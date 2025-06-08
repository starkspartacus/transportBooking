"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Key,
  Download,
  Upload,
  Camera,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CascadingSelect } from "@/components/ui/cascading-select";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  role: string;
  employeeRole?: string;
  status?: string;
  image?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  idNumber?: string;
  idType?: string;
  address?: string;
  country?: string;
  city?: string;
  commune?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  hireDate?: string;
  salary?: number;
  department?: string;
  position?: string;
  notes?: string;
  lastLogin?: string;
  createdAt: string;
}

interface GeneratedCode {
  code: string;
  expiresAt: string;
  employee: {
    id: string;
    name: string;
    phone?: string;
    countryCode?: string;
  };
}

const employeeSchema = z.object({
  // Informations de base
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  countryCode: z.string().min(1, "Indicatif pays requis"),

  // Rôle et statut
  role: z.enum(["GESTIONNAIRE", "CAISSIER"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),

  // Informations personnelles
  dateOfBirth: z.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  nationality: z.string().optional(),
  idType: z
    .enum(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE", "OTHER"])
    .optional(),
  idNumber: z.string().optional(),

  // Localisation
  country: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
  address: z.string().optional(),

  // Contact d'urgence
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),

  // Informations professionnelles
  hireDate: z.date().optional(),
  salary: z.number().min(0).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "",
      role: "GESTIONNAIRE",
      status: "ACTIVE",
      gender: "MALE",
      idType: "NATIONAL_ID",
      department: "",
      position: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/company/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        console.error("Error fetching employees:", response.statusText);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      // Créer une preview locale
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Ici vous pouvez ajouter la logique d'upload vers votre service de stockage
      // Pour l'instant, on simule juste l'upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Photo uploadée",
        description: "La photo de profil a été uploadée avec succès",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload de la photo",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const formattedData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        dateOfBirth: data.dateOfBirth?.toISOString(),
        hireDate: data.hireDate?.toISOString(),
        image: imagePreview,
      };

      const response = await fetch("/api/company/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        const newEmployee = await response.json();
        toast({
          title: "Employé ajouté",
          description: "L'employé a été ajouté avec succès",
        });
        fetchEmployees();
        setShowNewForm(false);
        form.reset();
        setImagePreview(null);

        // Proposer de générer un code d'accès
        setSelectedEmployee(newEmployee);
        setShowCodeDialog(true);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'ajout de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'employé",
        variant: "destructive",
      });
    }
  };

  const generateAccessCode = async (employeeId: string) => {
    try {
      const response = await fetch(
        `/api/company/employees/${employeeId}/generate-code`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data);
        toast({
          title: "Code généré",
          description: "Code d'accès généré avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la génération du code",
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
    }
  };

  const handleViewEmployee = (employeeId: string) => {
    router.push(`/patron/employees/${employeeId}`);
  };

  const handleEditEmployee = (employeeId: string) => {
    router.push(`/patron/employees/${employeeId}/edit`);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;

    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Employé supprimé",
          description: "L'employé a été supprimé avec succès",
        });
        fetchEmployees();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description:
            error.error || "Erreur lors de la suppression de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'employé",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Actif
          </Badge>
        );
      case "SUSPENDED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Suspendu
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Inactif
          </Badge>
        );
      default:
        return <Badge variant="outline">Non défini</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "GESTIONNAIRE":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Gestionnaire
          </Badge>
        );
      case "CAISSIER":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Users className="h-3 w-3 mr-1" />
            Caissier
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const gestionnaires = employees.filter(
    (emp) => emp.role === "GESTIONNAIRE" || emp.employeeRole === "GESTIONNAIRE"
  );
  const caissiers = employees.filter(
    (emp) => emp.role === "CAISSIER" || emp.employeeRole === "CAISSIER"
  );

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              Gestion des employés ({employees.length})
            </CardTitle>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {showNewForm ? (
            <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Nouvel employé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Photo de profil */}
                    <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                          <AvatarImage src={imagePreview || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-lg">
                            <Camera className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Photo de profil (optionnelle)
                      </p>
                    </div>

                    {/* Informations personnelles */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                          <Users className="h-5 w-5 text-blue-600" />
                          Informations personnelles
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Prénom" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nom de famille"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date de naissance</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>Sélectionner une date</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Genre</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || "MALE"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner le genre" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="MALE">
                                      Masculin
                                    </SelectItem>
                                    <SelectItem value="FEMALE">
                                      Féminin
                                    </SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nationality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nationalité</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nationalité" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="idType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de pièce d'identité</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || "NATIONAL_ID"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Type de pièce" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="NATIONAL_ID">
                                      Carte d'identité
                                    </SelectItem>
                                    <SelectItem value="PASSPORT">
                                      Passeport
                                    </SelectItem>
                                    <SelectItem value="DRIVERS_LICENSE">
                                      Permis de conduire
                                    </SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="idNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Numéro de pièce</FormLabel>
                                <FormControl>
                                  <Input placeholder="Numéro" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                          <Mail className="h-5 w-5 text-green-600" />
                          Contact & Localisation
                        </h3>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="email@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <PhoneInput
                          countryCodeValue={form.watch("countryCode") || ""}
                          phoneValue={form.watch("phone") || ""}
                          onCountryCodeChange={(value) =>
                            form.setValue("countryCode", value)
                          }
                          onPhoneChange={(value) =>
                            form.setValue("phone", value)
                          }
                        />

                        <CascadingSelect
                          countryValue={form.watch("country") || ""}
                          cityValue={form.watch("city") || ""}
                          communeValue={form.watch("commune") || ""}
                          onCountryChange={(value) =>
                            form.setValue("country", value)
                          }
                          onCityChange={(value) => form.setValue("city", value)}
                          onCommuneChange={(value) =>
                            form.setValue("commune", value)
                          }
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse complète</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Adresse détaillée"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator />

                        <h4 className="flex items-center gap-2 font-medium text-gray-700">
                          <Phone className="h-4 w-4 text-red-500" />
                          Contact d'urgence
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du contact</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nom complet" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Téléphone d'urgence</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Numéro de téléphone"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informations professionnelles */}
                    <div className="space-y-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Shield className="h-5 w-5 text-purple-600" />
                        Informations professionnelles
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rôle *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || "GESTIONNAIRE"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le rôle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="GESTIONNAIRE">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4" />
                                      Gestionnaire
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="CAISSIER">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      Caissier
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || "ACTIVE"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le statut" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">Actif</SelectItem>
                                  <SelectItem value="SUSPENDED">
                                    Suspendu
                                  </SelectItem>
                                  <SelectItem value="INACTIVE">
                                    Inactif
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hireDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date d'embauche</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>Date d'embauche</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Département</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Transport, Administration"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poste</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Chef d'équipe, Agent"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salaire (XOF)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Salaire mensuel"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes additionnelles</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Informations complémentaires, compétences particulières, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewForm(false);
                          form.reset();
                          setImagePreview(null);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {form.formState.isSubmitting
                          ? "Ajout en cours..."
                          : "Ajouter l'employé"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : null}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des employés...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistiques améliorées */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-blue-700">
                          {employees.length}
                        </p>
                        <p className="text-sm text-blue-600">Total employés</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-purple-700">
                          {gestionnaires.length}
                        </p>
                        <p className="text-sm text-purple-600">Gestionnaires</p>
                      </div>
                      <Shield className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-700">
                          {caissiers.length}
                        </p>
                        <p className="text-sm text-green-600">Caissiers</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-orange-700">
                          {
                            employees.filter((emp) => emp.status === "ACTIVE")
                              .length
                          }
                        </p>
                        <p className="text-sm text-orange-600">Actifs</p>
                      </div>
                      <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="h-3 w-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des employés améliorée */}
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun employé trouvé
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Commencez par ajouter votre premier employé
                  </p>
                  <Button
                    onClick={() => setShowNewForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un employé
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {employees.map((employee) => (
                    <Card
                      key={employee.id}
                      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 border-2 border-gray-200">
                            <AvatarImage
                              src={employee.image || "/placeholder.svg"}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold">
                              {employee.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "EM"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {employee.name}
                              </h3>
                              {getRoleBadge(
                                employee.role ||
                                  employee.employeeRole ||
                                  "Non défini"
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(employee.status)}
                              {employee.department && (
                                <Badge variant="outline" className="text-xs">
                                  {employee.department}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">
                                  {employee.email}
                                </span>
                              </div>
                              {employee.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>
                                    {employee.countryCode} {employee.phone}
                                  </span>
                                </div>
                              )}
                              {(employee.city || employee.country) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {employee.city}, {employee.country}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Créé le {formatDate(employee.createdAt)}
                                </span>
                              </div>
                              {employee.lastLogin && (
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                  <span>
                                    Dernière connexion:{" "}
                                    {formatDate(employee.lastLogin)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              generateAccessCode(employee.id);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Code d'accès
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEmployee(employee.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEmployee(employee.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour le code d'accès */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Code d'accès généré
            </DialogTitle>
            <DialogDescription>
              Code d'accès temporaire pour {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>

          {generatedCode && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg text-center">
                <div className="text-3xl font-mono font-bold text-blue-700 mb-2 tracking-wider">
                  {generatedCode.code}
                </div>
                <p className="text-sm text-blue-600">
                  Expire le{" "}
                  {format(
                    new Date(generatedCode.expiresAt),
                    "dd/MM/yyyy à HH:mm",
                    { locale: fr }
                  )}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Instructions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Partagez ce code avec l'employé</li>
                  <li>
                    L'employé doit utiliser son numéro de téléphone et ce code
                    pour se connecter
                  </li>
                  <li>Le code expire automatiquement après 30 jours</li>
                  <li>Un nouveau code peut être généré à tout moment</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              Fermer
            </Button>
            {generatedCode && (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode.code);
                  toast({
                    title: "Code copié",
                    description: "Le code a été copié dans le presse-papiers",
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Copier le code
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
