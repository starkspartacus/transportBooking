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
  Plus,
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

export default function EmployeeManagement({
  companyId,
}: {
  companyId?: string;
}) {
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
    fetchEmployees();
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
      const url = companyId
        ? `/api/company/employees?companyId=${companyId}`
        : "/api/company/employees";
      const response = await fetch(url);
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
        salary: formData.salary
          ? Number.parseFloat(formData.salary)
          : undefined,
        companyId,
        // Ne pas envoyer department et position s'ils sont vides ou "none"
        department:
          formData.department === "none" ? undefined : formData.department,
        position: !formData.position ? undefined : formData.position,
      };

      const response = await fetch("/api/company/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Employé créé avec succès",
        });
        setIsDialogOpen(false);
        setFormData(initialFormData);
        fetchEmployees();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Erreur lors de la création de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Erreur",
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
          title: "Code généré",
          description: `Code d'accès généré: ${data.code}`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Erreur lors de la génération du code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Erreur",
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
        title: "Copié",
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
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
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter un employé
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouvel employé</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informations personnelles */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Prénom *</Label>
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
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nom *</Label>
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
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
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
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
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
                            <SelectTrigger className="w-24">
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
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nationality">Nationalité</Label>
                        <Select
                          value={formData.nationality}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              nationality: value,
                            }))
                          }
                        >
                          <SelectTrigger>
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

                  {/* Informations professionnelles */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Informations professionnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">Rôle *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: "GESTIONNAIRE" | "CAISSIER") =>
                            setFormData((prev) => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CAISSIER">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Caissier
                              </div>
                            </SelectItem>
                            <SelectItem value="GESTIONNAIRE">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Gestionnaire
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: "ACTIVE" | "SUSPENDED") =>
                            setFormData((prev) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">🟢 Actif</SelectItem>
                            <SelectItem value="SUSPENDED">
                              🔴 Suspendu
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="department">Département</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              department: value,
                            }))
                          }
                        >
                          <SelectTrigger>
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
                        <Label htmlFor="position">Poste</Label>
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
                          <SelectTrigger>
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
                        <Label htmlFor="salary">Salaire (FCFA)</Label>
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
                        />
                      </div>
                      <div>
                        <Label htmlFor="hireDate">Date d'embauche</Label>
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
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact d'urgence */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Contact d'urgence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact">Nom du contact</Label>
                        <Input
                          id="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              emergencyContact: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">
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
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
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
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">Créer l'employé</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {totalEmployees}
                </p>
                <p className="text-sm text-blue-600">Total employés</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {activeEmployees}
                </p>
                <p className="text-sm text-green-600">Actifs</p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {gestionnaires}
                </p>
                <p className="text-sm text-purple-600">Gestionnaires</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-700">
                  {caissiers}
                </p>
                <p className="text-sm text-orange-600">Caissiers</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const employeeCode = getEmployeeCode(employee.id);
          const timeRemaining = employeeCode
            ? getTimeRemaining(employeeCode.expiresAt)
            : null;

          return (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
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
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
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
                      <User className="h-4 w-4 text-gray-500" />
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
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
                        className="h-6 w-6 p-0"
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
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {generatingCode === employee.id
                      ? "Génération..."
                      : "Code d'accès"}
                  </Button>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-600">
                {searchTerm ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "Aucun employé ne correspond aux critères de recherche."
                  : "Commencez par ajouter votre premier employé."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
