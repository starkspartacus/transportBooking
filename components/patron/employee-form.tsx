"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  Shield,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Briefcase,
  Activity,
  Building2,
  Award,
  Cake,
  UserCircle,
  GraduationCap,
  Languages,
  FileText,
  Banknote,
  Globe,
  Bookmark,
  BadgeCheck,
  Fingerprint,
  CalendarClock,
  ArrowLeft,
  Contact,
  PhoneCall,
  Heart,
  Home,
  MapPin,
  CreditCard,
  BookOpen,
  CircleUser,
  X,
  Loader2,
  UserPlus,
  Edit,
  Sparkles,
} from "lucide-react";
import { NATIONALITIES, DEPARTMENTS, POSITIONS } from "@/constants/employee";
import { AFRICAN_COUNTRIES } from "@/constants/countries"; // Added AFRICAN_COUNTRIES import

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

  // Informations personnelles supplémentaires
  image: string;
  address: string;
  country: string;
  city: string;
  commune: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  idType: string;
  idExpiryDate: string;

  // Informations professionnelles supplémentaires
  education: string;
  skills: string;
  languages: string;

  // Informations bancaires
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;

  // Contact d'urgence
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;

  // Notes
  employeeNotes: string;
}

const initialFormData: EmployeeFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryCode: AFRICAN_COUNTRIES[0]?.code || "+225", // Default to first African country or +225
  role: "CAISSIER",
  status: "ACTIVE",
  nationality: NATIONALITIES[0]?.code || "CI", // Default to first nationality or CI
  department: "OPERATIONS", // Default to a valid department
  position: "",
  salary: "",
  hireDate: "",

  // Informations personnelles supplémentaires
  image: "",
  address: "",
  country: AFRICAN_COUNTRIES[0]?.code || "CI", // Default to first African country or CI
  city: "",
  commune: "",
  dateOfBirth: "",
  gender: "MALE",
  idNumber: "",
  idType: "NATIONAL_ID",
  idExpiryDate: "",

  // Informations professionnelles supplémentaires
  education: "",
  skills: "",
  languages: "",

  // Informations bancaires
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",

  // Contact d'urgence
  emergencyContact: "",
  emergencyPhone: "",
  emergencyRelation: "",

  // Notes
  employeeNotes: "",
};

interface EmployeeFormProps {
  companyId: string;
  employeeId?: string;
  mode: "create" | "edit";
  onSuccess: () => void; // Callback to close dialog and refresh list
  onCancel: () => void; // Callback to close dialog
}

export default function EmployeeForm({
  companyId,
  employeeId,
  mode,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const router = useRouter(); // Keep router for potential redirects
  const { toast } = useToast();
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && employeeId) {
      fetchEmployeeDetails();
    } else if (mode === "create") {
      setFormData(initialFormData); // Reset form for creation mode
    }
  }, [employeeId, mode]);

  useEffect(() => {
    if (formData.department && formData.department !== "none") {
      const departmentPositions =
        POSITIONS[formData.department as DepartmentKey];
      setAvailablePositions(departmentPositions?.map((pos) => pos.name) || []);
      // Only reset position if the current position is not available in the new department
      if (
        formData.position &&
        !departmentPositions.some((p) => p.name === formData.position)
      ) {
        setFormData((prev) => ({ ...prev, position: "" }));
      }
    } else {
      setAvailablePositions([]);
      setFormData((prev) => ({ ...prev, position: "" })); // Clear position if no department or "none"
    }
  }, [formData.department]);

  const fetchEmployeeDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`); // Adjusted API route
      if (response.ok) {
        const data = await response.json();

        // Convertir les dates au format YYYY-MM-DD pour les inputs de type date
        const formatDateForInput = (dateString?: string) => {
          if (!dateString) return "";
          try {
            return format(new Date(dateString), "yyyy-MM-dd");
          } catch {
            return "";
          }
        };

        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          countryCode: data.countryCode || AFRICAN_COUNTRIES[0]?.code || "+225",
          role: (data.role || "CAISSIER") as "GESTIONNAIRE" | "CAISSIER",
          status: (data.status || "ACTIVE") as "ACTIVE" | "SUSPENDED",
          nationality: data.nationality || NATIONALITIES[0]?.code || "CI",
          department: data.department || "OPERATIONS", // Default to a valid department if null
          // Convert position ID from DB to human-readable name for display
          position: data.position
            ? Object.values(POSITIONS)
                .flat()
                .find((p) => p.id === data.position)?.name || ""
            : "",
          salary: data.salary?.toString() || "",
          hireDate: formatDateForInput(data.hireDate),
          image: data.image || "",
          address: data.address || "",
          country: data.country || AFRICAN_COUNTRIES[0]?.code || "CI",
          city: data.city || "",
          commune: data.commune || "",
          dateOfBirth: formatDateForInput(data.dateOfBirth),
          gender: data.gender || "MALE",
          idNumber: data.idNumber || "",
          idType: data.idType || "NATIONAL_ID",
          idExpiryDate: formatDateForInput(data.idExpiryDate),
          education: data.education || "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
          languages: Array.isArray(data.languages)
            ? data.languages.join(", ")
            : "",
          bankName: data.bankName || "",
          bankAccountNumber: data.bankAccountNumber || "",
          bankAccountName: data.bankAccountName || "",
          emergencyContact: data.emergencyContact || "",
          emergencyPhone: data.emergencyPhone || "",
          emergencyRelation: data.emergencyRelation || "",
          employeeNotes: data.employeeNotes || "",
        });
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            "Erreur lors de la récupération des détails de l'employé"
        );
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Erreur lors de la récupération des détails de l'employé");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convertir les chaînes de compétences et langues en tableaux
      const skillsArray = formData.skills
        ? formData.skills.split(",").map((s) => s.trim())
        : [];
      const languagesArray = formData.languages
        ? formData.languages.split(",").map((l) => l.trim())
        : [];

      // Convert position name to its corresponding enum ID
      const positionId =
        !formData.position || formData.position === "none"
          ? null
          : Object.values(POSITIONS)
              .flat()
              .find((p) => p.name === formData.position)?.id || null;

      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        salary: formData.salary ? Number.parseFloat(formData.salary) : null, // Changed undefined to null for DB
        companyId,
        department: formData.department === "none" ? null : formData.department, // Changed undefined to null for DB
        position: positionId, // Use the converted position ID
        skills: skillsArray.length > 0 ? skillsArray : [], // Ensure it's an empty array if no skills
        languages: languagesArray.length > 0 ? languagesArray : [], // Ensure it's an empty array if no languages
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : null, // Changed undefined to null for DB
        idExpiryDate: formData.idExpiryDate
          ? new Date(formData.idExpiryDate).toISOString()
          : null, // Changed undefined to null for DB
        hireDate: formData.hireDate
          ? new Date(formData.hireDate).toISOString()
          : null, // Changed undefined to null for DB
        phone: formData.phone || null, // Ensure phone is null if empty string
        address: formData.address || null,
        country: formData.country || null,
        city: formData.city || null,
        commune: formData.commune || null,
        gender: formData.gender || null,
        idNumber: formData.idNumber || null,
        idType: formData.idType || null,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,
        emergencyRelation: formData.emergencyRelation || null,
        employeeNotes: formData.employeeNotes || null,
        education: formData.education || null,
        bankName: formData.bankName || null,
        bankAccountNumber: formData.bankAccountNumber || null,
        bankAccountName: formData.bankAccountName || null,
        image: formData.image || null,
        nationality: formData.nationality || null,
        countryCode: formData.countryCode || null,
      };

      let response;
      if (mode === "create") {
        response = await fetch("/api/company/employees", {
          // Adjusted API route
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/company/employees/${employeeId}`, {
          // Adjusted API route
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const data = await response.json();

        if (mode === "create" && data.employee?.tempPassword) {
          setTempPassword(data.employee.tempPassword);
        }

        toast({
          title:
            mode === "create" ? "✅ Employé créé" : "✅ Employé mis à jour",
          description:
            mode === "create"
              ? "L'employé a été créé avec succès"
              : "Les informations de l'employé ont été mises à jour",
        });

        // Only call onSuccess if not showing temp password, or after temp password is handled
        if (!tempPassword) {
          // If it's edit mode or create mode without temp password
          onSuccess();
        } else if (mode === "create") {
          // Keep dialog open to show temp password, onSuccess will be called via handleContinue
        } else {
          onSuccess(); // For edit mode, always close and refresh
        }
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            `Erreur lors de ${
              mode === "create" ? "la création" : "la mise à jour"
            } de l'employé`
        );
        toast({
          title: "❌ Erreur",
          description:
            errorData.error ||
            `Erreur lors de ${
              mode === "create" ? "la création" : "la mise à jour"
            } de l'employé`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} employee:`,
        error
      );
      setError(
        `Erreur lors de ${
          mode === "create" ? "la création" : "la mise à jour"
        } de l'employé`
      );
      toast({
        title: "❌ Erreur",
        description: `Erreur lors de ${
          mode === "create" ? "la création" : "la mise à jour"
        } de l'employé`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel(); // Use the passed onCancel callback
  };

  const handleContinue = () => {
    setTempPassword(null);
    onSuccess(); // Call onSuccess after temp password is seen
  };

  if (isLoading) {
    return (
      <CardContent className="pt-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </CardContent>
    );
  }

  if (error) {
    return (
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onCancel} // Use onCancel to close the dialog
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </CardContent>
    );
  }

  if (tempPassword) {
    return (
      <CardContent className="p-6">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-6">
            L'employé a été créé avec succès. Voici le mot de passe temporaire :
          </p>
          <div className="text-3xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg border-2 border-blue-200 mb-6">
            {tempPassword}
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Veuillez communiquer ce mot de passe à l'employé. Il devra le
            changer lors de sa première connexion.
          </p>
        </div>
        <Button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Continuer
        </Button>
      </CardContent>
    );
  }

  return (
    <div className="p-6">
      {" "}
      {/* Added padding to the main div inside DialogContent */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo de profil */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="mb-2 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Photo de profil
            </h3>
            <p className="text-sm text-gray-500">
              Ajoutez une photo pour identifier facilement l'employé
            </p>
          </div>
          <div className="w-32 h-32 relative">
            <ImageUpload
              endpoint="profilePicture"
              value={formData.image}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, image: url }))
              }
              className="w-full h-full"
              aspectRatio="square"
            />
          </div>
        </div>

        {/* Onglets pour organiser les informations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                Informations personnelles
              </span>
              <span className="sm:hidden">Personnel</span>
            </TabsTrigger>
            <TabsTrigger
              value="professional"
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">
                Informations professionnelles
              </span>
              <span className="sm:hidden">Professionnel</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Contact & Adresse</span>
              <span className="sm:hidden">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">
                Informations complémentaires
              </span>
              <span className="sm:hidden">Compléments</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Informations personnelles */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-blue-500" />
                  Prénom <span className="text-red-500">*</span>
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
                  placeholder="Entrez le prénom"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-green-500" />
                  Nom <span className="text-red-500">*</span>
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
                  placeholder="Entrez le nom"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Cake className="h-4 w-4 text-pink-500" />
                  Date de naissance
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <UserCircle className="h-4 w-4 text-indigo-500" />
                  Genre
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }))
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner le genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Homme</SelectItem>
                    <SelectItem value="FEMALE">Femme</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="nationality"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Globe className="h-4 w-4 text-blue-500" />
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
                  <SelectContent className="max-h-[200px]">
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
              <div className="space-y-2">
                <Label
                  htmlFor="idType"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Fingerprint className="h-4 w-4 text-purple-500" />
                  Type de pièce d'identité
                </Label>
                <Select
                  value={formData.idType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      idType: value,
                    }))
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL_ID">
                      Carte Nationale d'Identité
                    </SelectItem>
                    <SelectItem value="PASSPORT">Passeport</SelectItem>
                    <SelectItem value="DRIVERS_LICENSE">
                      Permis de conduire
                    </SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="idNumber"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  Numéro de pièce d'identité
                </Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      idNumber: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: C0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="idExpiryDate"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                  Date d'expiration de la pièce
                </Label>
                <Input
                  id="idExpiryDate"
                  type="date"
                  value={formData.idExpiryDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      idExpiryDate: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Informations professionnelles */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-purple-500" />
                  Email <span className="text-red-500">*</span>
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
                  placeholder="exemple@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-blue-500" />
                  Rôle <span className="text-red-500">*</span>
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="none">Aucun département</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
                    !formData.department || formData.department === "none"
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner un poste" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="none">Aucun poste spécifique</SelectItem>
                    {availablePositions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="salary"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Banknote className="h-4 w-4 text-green-500" />
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
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: 250000"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="hireDate"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-blue-500" />
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
              <div className="space-y-2">
                <Label
                  htmlFor="education"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  Formation / Diplômes
                </Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      education: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Licence en Transport et Logistique"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="skills"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Bookmark className="h-4 w-4 text-orange-500" />
                  Compétences (séparées par des virgules)
                </Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      skills: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Gestion de caisse, Service client, Excel"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="languages"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Languages className="h-4 w-4 text-indigo-500" />
                  Langues parlées (séparées par des virgules)
                </Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      languages: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Français, Anglais, Dioula"
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Contact & Adresse */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
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
                    <SelectContent className="max-h-[200px]">
                      {AFRICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
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
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Home className="h-4 w-4 text-blue-500" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Rue 12, Quartier Cocody"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Globe className="h-4 w-4 text-green-500" />
                  Pays
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: value,
                    }))
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-red-500" />
                  Ville
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Abidjan"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="commune"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-purple-500" />
                  Commune
                </Label>
                <Input
                  id="commune"
                  value={formData.commune}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commune: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Cocody"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContact"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Contact className="h-4 w-4 text-red-500" />
                  Contact d'urgence (Nom)
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
                  placeholder="Ex: Konan Kouamé"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyPhone"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <PhoneCall className="h-4 w-4 text-red-500" />
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
                  placeholder="Ex: 0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyRelation"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  Relation avec le contact d'urgence
                </Label>
                <Input
                  id="emergencyRelation"
                  value={formData.emergencyRelation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergencyRelation: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: Conjoint, Parent, Frère/Soeur"
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Informations complémentaires */}
          <TabsContent value="additional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="bankName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Nom de la banque
                </Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: SGCI, NSIA Banque"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="bankAccountNumber"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  Numéro de compte
                </Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankAccountNumber: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: CI123 45678 9012345678901 23"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="bankAccountName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-green-500" />
                  Nom sur le compte
                </Label>
                <Input
                  id="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankAccountName: e.target.value,
                    }))
                  }
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ex: KOUASSI Aya Marie"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label
                  htmlFor="employeeNotes"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  Notes et commentaires
                </Label>
                <Textarea
                  id="employeeNotes"
                  value={formData.employeeNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeNotes: e.target.value,
                    }))
                  }
                  className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                  placeholder="Ajoutez des notes ou commentaires concernant cet employé..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <CircleUser className="h-4 w-4 mr-1 text-blue-500" />
            <span>
              Onglet{" "}
              {activeTab === "personal"
                ? "1"
                : activeTab === "professional"
                ? "2"
                : activeTab === "contact"
                ? "3"
                : "4"}{" "}
              sur 4
            </span>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create"
                    ? "Création en cours..."
                    : "Mise à jour..."}
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <UserPlus className="h-4 w-4 mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  {mode === "create" ? "Créer l'employé" : "Mettre à jour"}
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
