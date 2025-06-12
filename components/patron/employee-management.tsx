"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Key,
  Clock,
  Copy,
  Users,
  Shield,
  Sparkles,
  UserPlus,
  Building2,
  Briefcase,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Star,
  Award,
  Activity,
} from "lucide-react";
import { NATIONALITIES, DEPARTMENTS, POSITIONS } from "@/constants/employee";
import { AFRICAN_COUNTRIES } from "@/constants/countries";

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  role: string;
  status: string;
  nationality?: string;
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
  createdAt: string;
  companyId?: string;
}

interface EmployeeCode {
  employeeId: string;
  code: string;
  expiresAt: string;
  generatedAt: string;
}

// Define a type for the department keys
type DepartmentKey = keyof typeof POSITIONS;

// Update the EmployeeFormData type
interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  role: "GESTIONNAIRE" | "CAISSIER";
  status: "ACTIVE" | "SUSPENDED";
  nationality: string;
  department: string;
  position: string;
  salary: string;
  hireDate: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

const initialFormData: EmployeeFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryCode: "+225",
  role: "CAISSIER",
  status: "ACTIVE",
  nationality: "CI", // Default to Côte d'Ivoire
  department: "operations", // Default department
  position: "",
  salary: "",
  hireDate: "",
  emergencyContact: "",
  emergencyPhone: "",
  notes: "",
};

interface EmployeeManagementProps {
  companyId: string;
}

export default function EmployeeManagement({
  companyId,
}: EmployeeManagementProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeCodes, setEmployeeCodes] = useState<EmployeeCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchEmployees();
    }
    // Décompte toutes les minutes
    const interval = setInterval(() => {
      setEmployeeCodes((prev) =>
        prev.filter((code) => new Date(code.expiresAt) > new Date())
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [companyId]);

  useEffect(() => {
    if (formData.department && formData.department !== "none") {
      const departmentPositions =
        POSITIONS[formData.department as DepartmentKey];
      setAvailablePositions(departmentPositions?.map((pos) => pos.name) || []);
      setFormData((prev) => ({ ...prev, position: "" }));
    } else {
      setAvailablePositions([]);
    }
  }, [formData.department]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/patron/employees?companyId=${companyId}`
      );
      const contentType = response.headers.get("content-type");
      if (
        response.ok &&
        contentType &&
        contentType.includes("application/json")
      ) {
        const data = await response.json();
        setEmployees(data);
      } else {
        const errorText = await response.text();
        console.error("Non-JSON response received:", errorText);
        toast({
          title: "Erreur",
          description: "Erreur lors de la récupération des employés",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la récupération des employés",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        salary: formData.salary
          ? Number.parseFloat(formData.salary)
          : undefined,
        companyId,
        department:
          formData.department === "none" ? undefined : formData.department,
        position: !formData.position ? undefined : formData.position,
      };

      const response = await fetch("/api/patron/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Employé créé avec succès",
        });
        setIsDialogOpen(false);
        setFormData(initialFormData);
        fetchEmployees();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la création de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la création de l'employé",
        variant: "destructive",
      });
    }
  };

  const generateAccessCode = async (employeeId: string) => {
    setGeneratingCode(employeeId);
    try {
      const response = await fetch(
        `/api/company/employees/${employeeId}/generate-code`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Ajouter le code à la liste des codes générés
        const newCode: EmployeeCode = {
          employeeId,
          code: data.code,
          expiresAt: data.expiresAt,
          generatedAt: new Date().toISOString(),
        };

        setEmployeeCodes((prev) => {
          // Supprimer l'ancien code s'il existe
          const filtered = prev.filter((c) => c.employeeId !== employeeId);
          return [...filtered, newCode];
        });

        toast({
          title: "🔑 Code généré",
          description: `Code d'accès généré: ${data.code}`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la génération du code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la génération du code",
        variant: "destructive",
      });
    } finally {
      setGeneratingCode(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copié",
        description: "Code copié dans le presse-papiers",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getEmployeeCode = (employeeId: string) => {
    return employeeCodes.find((code) => code.employeeId === employeeId);
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return "Non défini";
    const department = DEPARTMENTS.find((d) => d.id === departmentId);
    return department?.name || departmentId;
  };

  const getNationalityName = (nationalityCode?: string) => {
    if (!nationalityCode) return "Non définie";
    const nationality = NATIONALITIES.find((n) => n.code === nationalityCode);
    return nationality?.name || nationalityCode;
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.phone && employee.phone.includes(searchTerm));

    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  // Statistiques
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (emp) => emp.status === "ACTIVE"
  ).length;
  const gestionnaires = employees.filter(
    (emp) => emp.role === "GESTIONNAIRE"
  ).length;
  const caissiers = employees.filter((emp) => emp.role === "CAISSIER").length;

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des employés...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestion des employés</h1>
                <p className="text-blue-100 text-sm font-normal">
                  Gérez votre équipe en toute simplicité
                </p>
              </div>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Ajouter un employé
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    Ajouter un nouvel employé
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section Informations personnelles */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Informations personnelles
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-blue-500" />
                          Prénom *
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          required
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="lastName"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-green-500" />
                          Nom *
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          required
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4 text-purple-500" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4 text-orange-500" />
                          Téléphone
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.countryCode}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                countryCode: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-24 border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AFRICAN_COUNTRIES.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {country.flag} {country.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="0123456789"
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="nationality"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4 text-red-500" />
                          Nationalité
                        </Label>
                        <Select
                          value={formData.nationality}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              nationality: value,
                            }))
                          }
                        >
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                            <SelectValue placeholder="Sélectionner une nationalité" />
                          </SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map((nationality) => (
                              <SelectItem
                                key={nationality.code}
                                value={nationality.code}
                              >
                                {nationality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section Informations professionnelles */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Informations professionnelles
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label
                          htmlFor="role"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4 text-blue-500" />
                          Rôle *
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: "GESTIONNAIRE" | "CAISSIER") =>
                            setFormData((prev) => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CAISSIER">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" />
                                Caissier
                              </div>
                            </SelectItem>
                            <SelectItem value="GESTIONNAIRE">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Gestionnaire
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="status"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Activity className="h-4 w-4 text-green-500" />
                          Statut
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: "ACTIVE" | "SUSPENDED") =>
                            setFormData((prev) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Actif
                              </div>
                            </SelectItem>
                            <SelectItem value="SUSPENDED">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                Suspendu
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="department"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4 text-indigo-500" />
                          Département
                        </Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              department: value,
                            }))
                          }
                        >
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                            <SelectValue placeholder="Sélectionner un département" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Aucun département
                            </SelectItem>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="position"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Award className="h-4 w-4 text-yellow-500" />
                          Poste
                        </Label>
                        <Select
                          value={formData.position}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              position: value,
                            }))
                          }
                          disabled={
                            !formData.department ||
                            formData.department === "none"
                          }
                        >
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                            <SelectValue placeholder="Sélectionner un poste" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Aucun poste spécifique
                            </SelectItem>
                            {availablePositions.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="salary"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <DollarSign className="h-4 w-4 text-green-500" />
                          Salaire (FCFA)
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              salary: e.target.value,
                            }))
                          }
                          placeholder="500000"
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="hireDate"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4 text-purple-500" />
                          Date d'embauche
                        </Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={formData.hireDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              hireDate: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section Contact d'urgence */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Contact d'urgence
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label
                          htmlFor="emergencyContact"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-red-500" />
                          Nom du contact
                        </Label>
                        <Input
                          id="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              emergencyContact: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="emergencyPhone"
                          className="text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4 text-red-500" />
                          Téléphone d'urgence
                        </Label>
                        <Input
                          id="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              emergencyPhone: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="notes"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Notes additionnelles..."
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer l'employé
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {totalEmployees}
                </p>
                <p className="text-sm text-blue-600">Total employés</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {activeEmployees}
                </p>
                <p className="text-sm text-green-600">Actifs</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {gestionnaires}
                </p>
                <p className="text-sm text-purple-600">Gestionnaires</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Shield className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-700">
                  {caissiers}
                </p>
                <p className="text-sm text-orange-600">Caissiers</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Users className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-48 border-2 border-gray-200 focus:border-blue-500">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-blue-500">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="hover:bg-gray-50 transition-colors border-2 border-gray-200 hover:border-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee, index) => {
          const employeeCode = getEmployeeCode(employee.id);
          const timeRemaining = employeeCode
            ? getTimeRemaining(employeeCode.expiresAt)
            : null;

          return (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 group transform hover:scale-[1.02] animate-in slide-in-from-left-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {employee.name}
                      </CardTitle>
                      <Badge
                        variant={
                          employee.role === "GESTIONNAIRE"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          employee.role === "GESTIONNAIRE"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }
                      >
                        {employee.role === "GESTIONNAIRE" ? (
                          <Shield className="h-3 w-3 mr-1" />
                        ) : (
                          <Users className="h-3 w-3 mr-1" />
                        )}
                        {employee.role === "GESTIONNAIRE"
                          ? "Gestionnaire"
                          : "Caissier"}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant={
                      employee.status === "ACTIVE" ? "default" : "destructive"
                    }
                    className={
                      employee.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {employee.status === "ACTIVE" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {employee.status === "ACTIVE" ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>
                        {employee.countryCode} {employee.phone}
                      </span>
                    </div>
                  )}
                  {employee.nationality && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{getNationalityName(employee.nationality)}</span>
                    </div>
                  )}
                  {employee.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span>{getDepartmentName(employee.department)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      Créé le{" "}
                      {new Date(employee.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {/* Code d'accès */}
                {employeeCode && timeRemaining ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Code d'accès
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(employeeCode.code)}
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-mono text-lg font-bold text-blue-900 bg-white px-2 py-1 rounded border">
                      {employeeCode.code}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-600">
                        Expire dans {timeRemaining}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAccessCode(employee.id)}
                    disabled={generatingCode === employee.id}
                    className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {generatingCode === employee.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      "Générer code d'accès"
                    )}
                  </Button>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "Aucun employé ne correspond aux critères de recherche."
                  : "Commencez par ajouter votre premier employé."}
              </p>
              {employees.length === 0 && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un employé
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
