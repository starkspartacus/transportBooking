"use client";

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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Key,
  Clock,
  Copy,
  Users,
  Shield,
  Sparkles,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Loader2,
  Building2,
  Award,
  MapPin,
  DollarSign,
  Globe,
  Trash2,
} from "lucide-react";
import {
  NATIONALITIES,
  DEPARTMENTS,
  type POSITIONS,
} from "@/constants/employee";
import { AFRICAN_COUNTRIES } from "@/constants/countries";
import EmployeeForm from "./employee-form"; // Importez le composant EmployeeForm

// --- INTERFACES ---
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
  image?: string;
  address?: string;
  country?: string;
  city?: string;
  commune?: string;
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  idType?: string;
  idExpiryDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  employeeNotes?: string;
  education?: string;
  skills?: string[];
  languages?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

interface GeneratedCode {
  code: string;
  expiresAt: string;
  phone: string;
  message: string;
}

// Define a type for the department keys
type DepartmentKey = keyof typeof POSITIONS;

interface EmployeeManagementProps {
  companyId: string;
}

export default function EmployeeManagement({
  companyId,
}: EmployeeManagementProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false); // Pour le formulaire d'ajout
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Pour le formulaire de modification
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  ); // ID de l'employé à modifier
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // États pour la génération de codes
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    null
  );
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [selectedEmployeeForCode, setSelectedEmployeeForCode] =
    useState<Employee | null>(null); // Employé pour la génération de code
  const [phoneData, setPhoneData] = useState({
    phone: "",
    countryCode: "", // countryCode initialised to empty string
  });
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Pour la confirmation de suppression
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  ); // Employé à supprimer

  useEffect(() => {
    if (companyId) {
      fetchEmployees();
    }
  }, [companyId]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/company/employees?companyId=${companyId}`
      ); // Changé l'API ici
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

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/company/employees/${employeeToDelete.id}`,
        {
          // Changé l'API ici
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Employé supprimé avec succès.",
        });
        fetchEmployees(); // Rafraîchir la liste
        setIsDeleteDialogOpen(false); // Fermer le dialogue de suppression
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la suppression de l'employé.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la suppression de l'employé.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setEmployeeToDelete(null); // Réinitialiser l'employé à supprimer
    }
  };

  const handleConfirmDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleGenerateCode = async (employee: Employee) => {
    setIsGenerating(employee.id);
    try {
      const response = await fetch(
        `/api/company/employees/${employee.id}/generate-code`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data);
        setSelectedEmployeeForCode(employee);
        setShowCodeDialog(true);
        toast({
          title: "Code généré avec succès",
          description: data.message,
        });
      } else {
        const errorData = await response.json();

        // Si l'erreur est due à un téléphone manquant, proposer de l'ajouter
        if (
          errorData.code === "MISSING_PHONE" ||
          errorData.code === "MISSING_COUNTRY_CODE"
        ) {
          toast({
            title: "Téléphone requis",
            description:
              "Un numéro de téléphone est nécessaire pour générer un code d'accès",
            variant: "destructive",
          });
          setSelectedEmployeeForCode(employee);
          setPhoneData({
            phone: employee.phone || "",
            countryCode:
              employee.countryCode || AFRICAN_COUNTRIES[0]?.code || "+225", // Fallback to first African country code
          });
          setShowPhoneDialog(true);
        } else {
          toast({
            title: "Erreur",
            description:
              errorData.error || "Erreur lors de la génération du code",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleUpdatePhone = async () => {
    if (
      !phoneData.phone ||
      !phoneData.countryCode ||
      !selectedEmployeeForCode
    ) {
      toast({
        title: "Données incomplètes",
        description:
          "Veuillez fournir un numéro de téléphone et un indicatif pays",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPhone(true);
    try {
      const response = await fetch(
        `/api/company/employees/${selectedEmployeeForCode.id}`,
        {
          // Changed to PATCH on employee endpoint
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phoneData.phone,
            countryCode: phoneData.countryCode,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Téléphone mis à jour",
          description:
            "Le numéro de téléphone de l'employé a été mis à jour avec succès.",
        });
        setShowPhoneDialog(false);

        // Rafraîchir la liste des employés et générer le code
        fetchEmployees().then(() => {
          if (selectedEmployeeForCode) {
            // Find the updated employee from the new list
            const updatedEmployee = employees.find(
              (emp) => emp.id === selectedEmployeeForCode.id
            );
            if (updatedEmployee) {
              handleGenerateCode(updatedEmployee);
            }
          }
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Erreur lors de la mise à jour du téléphone",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating phone:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du téléphone",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Code copié dans le presse-papiers",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const formatPhone = (employee: Employee) => {
    if (!employee.phone) return null;
    return `${employee.countryCode || ""} ${employee.phone}`.trim();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "GESTIONNAIRE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CAISSIER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "GESTIONNAIRE":
        return "Gestionnaire";
      case "CAISSIER":
        return "Caissier";
      default:
        return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        );
      case "SUSPENDED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
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
            {/* Bouton d'ajout d'employé */}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                  onClick={handleOpenCreateDialog}
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Ajouter un employé
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                      Ajouter un nouvel employé
                    </DialogTitle>
                  </div>
                </div>
                <EmployeeForm
                  companyId={companyId}
                  mode="create"
                  onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    fetchEmployees();
                  }}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
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
            <div className="flex gap-2">
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-blue-500">
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
                <SelectTrigger className="w-[140px] border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm ||
                departmentFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <Card className="shadow-xl border-0">
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-500">
                {employees.length === 0
                  ? "Commencez par ajouter votre premier employé"
                  : "Aucun employé ne correspond à vos critères de recherche"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-6 hover:bg-gray-50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                        <AvatarImage
                          src={
                            employee.image ||
                            "/placeholder.svg?height=64&width=64&query=employee-avatar"
                          }
                          alt={employee.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 truncate">
                            {employee.name}
                          </h3>
                          <Badge className={getRoleBadgeColor(employee.role)}>
                            {getRoleLabel(employee.role)}
                          </Badge>
                          {getStatusBadge(employee.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          {formatPhone(employee) && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{formatPhone(employee)}</span>
                            </div>
                          )}
                          {employee.department && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-purple-500" />
                              <span>
                                {getDepartmentName(employee.department)}
                              </span>
                            </div>
                          )}
                          {employee.position && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span>{employee.position}</span>
                            </div>
                          )}
                          {employee.nationality && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-indigo-500" />
                              <span>
                                {getNationalityName(employee.nationality)}
                              </span>
                            </div>
                          )}
                          {employee.hireDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              <span>
                                Embauché le {formatDate(employee.hireDate)}
                              </span>
                            </div>
                          )}
                          {employee.salary && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span>
                                {employee.salary.toLocaleString()} FCFA
                              </span>
                            </div>
                          )}
                          {employee.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="truncate">
                                {employee.address}
                              </span>
                            </div>
                          )}
                          {employee.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>{employee.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCode(employee)}
                        disabled={isGenerating === employee.id}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                      >
                        {isGenerating === employee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(employee.id)}
                            className="hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedEmployeeId === employee.id && ( // Only render content for the selected employee
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                  <Edit className="h-6 w-6" />
                                </div>
                                <DialogTitle className="text-2xl font-bold">
                                  Modifier l'employé
                                </DialogTitle>
                              </div>
                            </div>
                            <EmployeeForm
                              companyId={companyId}
                              employeeId={selectedEmployeeId}
                              mode="edit"
                              onSuccess={() => {
                                setIsEditDialogOpen(false);
                                fetchEmployees();
                              }}
                              onCancel={() => setIsEditDialogOpen(false)}
                            />
                          </DialogContent>
                        )}
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmDelete(employee)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour afficher le code généré */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Code d'accès généré
            </DialogTitle>
            <DialogDescription>
              Code d'accès temporaire pour {selectedEmployeeForCode?.name}
            </DialogDescription>
          </DialogHeader>
          {generatedCode && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  {generatedCode.code}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span>Téléphone: {generatedCode.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Expire le: {formatDate(generatedCode.expiresAt)}</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  {generatedCode.message}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(generatedCode.code)}
                  className="flex-1"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le code
                </Button>
                <Button
                  onClick={() => setShowCodeDialog(false)}
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter/modifier le téléphone */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Ajouter un numéro de téléphone
            </DialogTitle>
            <DialogDescription>
              Un numéro de téléphone est requis pour générer un code d'accès
              pour {selectedEmployeeForCode?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneUpdate">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <Select
                  value={phoneData.countryCode}
                  onValueChange={(value) =>
                    setPhoneData((prev) => ({
                      ...prev,
                      countryCode: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phoneUpdate"
                  value={phoneData.phone}
                  onChange={(e) =>
                    setPhoneData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="0123456789"
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPhoneDialog(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdatePhone} disabled={isUpdatingPhone}>
                {isUpdatingPhone ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'employé{" "}
              {employeeToDelete?.name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployee}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
