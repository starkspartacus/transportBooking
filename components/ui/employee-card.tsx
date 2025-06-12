"use client";

import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  Calendar,
  Key,
  Clock,
  Copy,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Award,
  MapPin,
  DollarSign,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, intervalToDuration, type Duration } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmployeeForm from "@/components/patron/employee-form";
import { DEPARTMENTS, NATIONALITIES } from "@/constants/employee";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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

interface EmployeeCardProps {
  employee: Employee;
  companyId: string;
  onGenerateCode: (employee: Employee) => void;
  onEdit: (employeeId: string) => void;
  onDelete: (employee: Employee) => void;
  isGenerating: string | null;
  generatedCode: GeneratedCode | null;
  showCodeDialog: boolean;
  setShowCodeDialog: (show: boolean) => void;
  onSuccessEdit: () => void;
  onCancelEdit: () => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  onConfirmDelete: (employee: Employee) => void;
}

export default function EmployeeCard({
  employee,
  companyId,
  onGenerateCode,
  onEdit,
  onDelete,
  isGenerating,
  generatedCode,
  showCodeDialog,
  setShowCodeDialog,
  onSuccessEdit,
  onCancelEdit,
  isEditDialogOpen,
  setIsEditDialogOpen,
  onConfirmDelete,
}: EmployeeCardProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<Duration | null>(null);

  useEffect(() => {
    if (generatedCode && generatedCode.expiresAt) {
      const calculateTimeLeft = () => {
        const now = new Date();
        const expiry = new Date(generatedCode.expiresAt);
        if (expiry > now) {
          setTimeLeft(intervalToDuration({ start: now, end: expiry }));
        } else {
          setTimeLeft(null);
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
    setTimeLeft(null);
  }, [generatedCode]);

  const formatTimeLeft = (duration: Duration | null) => {
    if (!duration) return "Expiré";
    const { minutes, seconds } = duration;
    if (minutes === undefined || seconds === undefined) return "Expiré";
    return `${minutes.toString().padStart(2, "0")}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
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

  const formatPhone = (emp: Employee) => {
    if (!emp.phone) return null;
    return `${emp.countryCode || ""} ${emp.phone}`.trim();
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

  return (
    <div
      className={cn(
        "relative p-6 transition-all duration-300 transform hover:scale-[1.01] rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 group",
        "flex flex-col sm:flex-row items-start justify-between gap-6"
      )}
    >
      <div className="flex items-start gap-4 flex-1">
        <Avatar className="h-20 w-20 border-4 border-white shadow-lg flex-shrink-0">
          <AvatarImage
            src={
              employee.image ||
              "/placeholder.svg?height=80&width=80&query=employee-avatar"
            }
            alt={employee.name}
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-900 truncate max-w-[calc(100%-100px)]">
              {employee.name}
            </h3>
            <Badge className={getRoleBadgeColor(employee.role)}>
              {getRoleLabel(employee.role)}
            </Badge>
            {getStatusBadge(employee.status)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-700">
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
                <span>{getDepartmentName(employee.department)}</span>
              </div>
            )}
            {employee.position && (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span>{employee.position}</span>
              </div>
            )}
            {employee.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>{employee.salary.toLocaleString()} FCFA</span>
              </div>
            )}
            {employee.hireDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>Embauché le {formatDate(employee.hireDate)}</span>
              </div>
            )}
            {employee.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>
                  {employee.city}, {employee.country}
                </span>
              </div>
            )}
            {employee.nationality && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-500" />
                <span>{getNationalityName(employee.nationality)}</span>
              </div>
            )}
          </div>

          {/* Generated Code Display */}
          {generatedCode && generatedCode.phone === formatPhone(employee) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
                <Key className="h-5 w-5" />
                <span>Code: {generatedCode.code}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-700 text-sm">
                <Clock className="h-4 w-4" />
                <span>Expire dans: {formatTimeLeft(timeLeft)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCode.code)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy className="h-4 w-4 mr-1" /> Copier
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 self-center sm:self-auto flex-shrink-0 mt-4 sm:mt-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onGenerateCode(employee)}
          disabled={isGenerating === employee.id}
          className="w-10 h-10 rounded-full hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Générer un code d'accès"
        >
          {isGenerating === employee.id ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Key className="h-5 w-5" />
          )}
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(employee.id)}
              className="w-10 h-10 rounded-full hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Modifier l'employé"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          {isEditDialogOpen && ( // Only render content when dialog is open
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-lg shadow-2xl">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white rounded-t-lg">
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
                employeeId={employee.id}
                mode="edit"
                onSuccess={onSuccessEdit}
                onCancel={onCancelEdit}
              />
            </DialogContent>
          )}
        </Dialog>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onConfirmDelete(employee)}
          className="w-10 h-10 rounded-full hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Supprimer l'employé"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
