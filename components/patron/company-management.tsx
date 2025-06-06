"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  Bus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Globe,
  Briefcase,
  FileText,
  Archive,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AFRICAN_COUNTRIES } from "@/constants/countries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { FileUpload } from "@/components/ui/file-upload";

// Schema de validation pour le formulaire d'entreprise
const companySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().min(1, "Code pays requis"),
  address: z.string().min(5, "Adresse complète requise"),
  country: z.string().min(1, "Pays requis"),
  city: z.string().min(1, "Ville requise"),
  commune: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  licenseNumber: z.string().min(3, "Numéro de licence requis"),
  taxId: z.string().optional(),
  foundedYear: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]),
  slogan: z.string().optional(),
  operatingHours: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface OperatingCountry {
  code: string;
  name: string;
  isMainCountry: boolean;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  country: string;
  city: string;
  commune?: string;
  website?: string;
  licenseNumber: string;
  taxId?: string;
  foundedYear?: number;
  size: string;
  isVerified: boolean;
  isActive: boolean;
  status: string;
  isArchived: boolean;
  slogan?: string;
  operatingHours?: string;
  specialties?: string[];
  createdAt: string;
  _count: {
    employees: number;
    buses: number;
    trips: number;
    tickets: number;
    reservations: number;
  };
  operatingCountries?: OperatingCountry[];
  galleryImages?: { id: string; url: string; isPrimary: boolean }[];
  stats?: {
    totalRevenue: number;
    activeTrips: number;
    completedTrips: number;
  };
}

export default function CompanyManagement() {
  const router = useRouter();
  const { toast } = useToast();

  // États
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOperatingCountries, setSelectedOperatingCountries] = useState<
    OperatingCountry[]
  >([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");

  // États pour les uploads
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // Formulaire
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      countryCode: "+225",
      address: "",
      country: "Côte d'Ivoire",
      city: "",
      commune: "",
      website: "",
      licenseNumber: "",
      taxId: "",
      foundedYear: "",
      size: "SMALL",
      slogan: "",
      operatingHours: "",
      specialties: [],
    },
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/patron/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        throw new Error("Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos entreprises",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedCompany
        ? `/api/patron/companies/${selectedCompany.id}`
        : "/api/patron/companies";
      const method = selectedCompany ? "PUT" : "POST";

      const payload = {
        ...data,
        logo: logoUrl,
        coverImage: coverUrl,
        galleryImages: galleryUrls,
        operatingCountries: selectedOperatingCountries,
        specialties,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: selectedCompany
            ? "Entreprise modifiée avec succès"
            : "Entreprise créée avec succès",
        });

        resetForm();
        fetchCompanies();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'opération");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedCompany(null);
    form.reset();
    setLogoUrl("");
    setCoverUrl("");
    setGalleryUrls([]);
    setSelectedOperatingCountries([]);
    setSpecialties([]);
  };

  const handleEdit = async (company: Company) => {
    setSelectedCompany(company);

    // Charger les détails complets de l'entreprise
    try {
      const response = await fetch(`/api/patron/companies/${company.id}`);
      if (response.ok) {
        const data = await response.json();

        form.reset({
          name: data.name,
          description: data.description || "",
          email: data.email,
          phone: data.phone,
          countryCode: data.countryCode,
          address: data.address,
          country: data.country,
          city: data.city,
          commune: data.commune || "",
          website: data.website || "",
          licenseNumber: data.licenseNumber,
          taxId: data.taxId || "",
          foundedYear: data.foundedYear?.toString() || "",
          size: data.size as any,
          slogan: data.slogan || "",
          operatingHours: data.operatingHours || "",
          specialties: data.specialties || [],
        });

        setLogoUrl(data.logo || "");
        setCoverUrl(data.coverImage || "");
        setGalleryUrls(data.galleryImages?.map((img: any) => img.url) || []);
        setSelectedOperatingCountries(data.operatingCountries || []);
        setSpecialties(data.specialties || []);
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    }

    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/patron/companies/${selectedCompany.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Entreprise supprimée avec succès",
        });
        setShowDeleteDialog(false);
        setSelectedCompany(null);
        fetchCompanies();
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (company: Company) => {
    try {
      const response = await fetch(
        `/api/patron/companies/${company.id}/archive`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Entreprise ${
            company.isArchived ? "désarchivée" : "archivée"
          }`,
        });
        fetchCompanies();
      } else {
        throw new Error("Erreur lors de l'archivage");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const response = await fetch(
        `/api/patron/companies/${company.id}/toggle-status`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Entreprise ${
            company.isActive ? "désactivée" : "activée"
          }`,
        });
        fetchCompanies();
      } else {
        throw new Error("Erreur lors du changement de statut");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (company: Company) => {
    if (company.isArchived) {
      return <Badge variant="secondary">Archivée</Badge>;
    }

    if (!company.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    switch (company.status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approuvée</Badge>;
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejetée</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-red-100 text-red-800">Suspendue</Badge>;
      default:
        return <Badge variant="outline">{company.status}</Badge>;
    }
  };

  const getStatusIcon = (company: Company) => {
    if (company.isArchived) {
      return <Archive className="h-4 w-4 text-gray-500" />;
    }

    if (!company.isActive) {
      return <PowerOff className="h-4 w-4 text-gray-500" />;
    }

    switch (company.status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "REJECTED":
        return <X className="h-4 w-4 text-red-600" />;
      case "SUSPENDED":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  const canDelete = (company: Company) => {
    return company._count.tickets === 0 && company._count.reservations === 0;
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && company.isActive && !company.isArchived) ||
      (statusFilter === "inactive" && !company.isActive) ||
      (statusFilter === "archived" && company.isArchived) ||
      company.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des entreprises
          </h1>
          <p className="text-gray-600">
            Gérez vos {companies.length} entreprise
            {companies.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une entreprise
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="inactive">Inactives</SelectItem>
                <SelectItem value="archived">Archivées</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
                <SelectItem value="suspended">Suspendues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des entreprises */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {companies.length === 0 ? "Aucune entreprise" : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-4">
              {companies.length === 0
                ? "Commencez par créer votre première entreprise"
                : "Aucune entreprise ne correspond à vos critères de recherche"}
            </p>
            {companies.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une entreprise
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className={`h-2 ${
                  company.isArchived
                    ? "bg-gray-500"
                    : company.status === "APPROVED"
                    ? "bg-green-500"
                    : company.status === "PENDING"
                    ? "bg-yellow-500"
                    : company.status === "REJECTED"
                    ? "bg-red-500"
                    : company.status === "SUSPENDED"
                    ? "bg-orange-500"
                    : "bg-gray-500"
                }`}
              />

              <CardContent className="p-6">
                {/* Header de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {company.logo ? (
                        <AvatarImage
                          src={company.logo || "/placeholder.svg"}
                          alt={company.name}
                        />
                      ) : (
                        <AvatarFallback>
                          {company.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(company)}
                        {getStatusBadge(company)}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/patron/companies/${company.id}`)
                        }
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gérer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!company.isArchived && (
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(company)}
                        >
                          {company.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleArchive(company)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {company.isArchived ? "Désarchiver" : "Archiver"}
                      </DropdownMenuItem>
                      {canDelete(company) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Informations de contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>
                      {company.countryCode} {company.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">
                      {company.city}, {company.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Créée le {formatDate(company.createdAt)}</span>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-600">Employés</p>
                    <p className="font-semibold text-blue-600">
                      {company._count.employees}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bus className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600">Bus</p>
                    <p className="font-semibold text-green-600">
                      {company._count.buses}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-600">Voyages</p>
                    <p className="font-semibold text-purple-600">
                      {company._count.trips}
                    </p>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      router.push(`/patron/companies/${company.id}`)
                    }
                  >
                    Gérer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCompany(company);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création/modification */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany
                ? "Modifier l'entreprise"
                : "Créer une nouvelle entreprise"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? "Modifiez les informations de votre entreprise"
                : "Remplissez les informations pour créer votre entreprise"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Informations</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="media">Médias</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Transport Express"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slogan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slogan</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Le meilleur service de transport"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre entreprise..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de licence *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: LIC123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro fiscal</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: TAX789012" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="foundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Année de création</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 2020"
                              min="1900"
                              max={new Date().getFullYear()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille de l'entreprise</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SMALL">
                                Petite (1-10 employés)
                              </SelectItem>
                              <SelectItem value="MEDIUM">
                                Moyenne (11-50 employés)
                              </SelectItem>
                              <SelectItem value="LARGE">
                                Grande (51-200 employés)
                              </SelectItem>
                              <SelectItem value="ENTERPRISE">
                                Entreprise (200+ employés)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="operatingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heures d'ouverture</FormLabel>
                          <FormControl>
                            <Input placeholder="Lun-Ven: 9h-17h" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.exemple.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email professionnel *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@entreprise.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code pays *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AFRICAN_COUNTRIES.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.phonePrefix}
                                >
                                  {country.flag} {country.phonePrefix}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone *</FormLabel>
                            <FormControl>
                              <Input placeholder="01 23 45 67 89" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse complète *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adresse complète de l'entreprise"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AFRICAN_COUNTRIES.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.name}
                                >
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Abidjan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="commune"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commune/Quartier</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cocody" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium">
                        Logo de l'entreprise
                      </Label>
                      <p className="text-sm text-gray-500 mb-4">
                        Format carré recommandé (1:1)
                      </p>
                      <ImageUpload
                        endpoint="companyLogo"
                        value={logoUrl}
                        onChange={setLogoUrl}
                        aspectRatio="square"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        Image de couverture
                      </Label>
                      <p className="text-sm text-gray-500 mb-4">
                        Format paysage recommandé (16:9)
                      </p>
                      <ImageUpload
                        endpoint="companyCover"
                        value={coverUrl}
                        onChange={setCoverUrl}
                        aspectRatio="video"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      Galerie d'images
                    </Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Ajoutez jusqu'à 10 images de votre entreprise
                    </p>
                    <FileUpload
                      endpoint="companyGallery"
                      value={galleryUrls}
                      onChange={(urls) =>
                        setGalleryUrls(Array.isArray(urls) ? urls : [urls])
                      }
                      maxFiles={10}
                      accept={{
                        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">
                      Pays d'opération
                    </Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Sélectionnez les pays où votre entreprise opère
                    </p>
                    <Card>
                      <CardContent className="p-4">
                        <ScrollArea className="h-40">
                          {AFRICAN_COUNTRIES.map((country) => (
                            <div
                              key={country.code}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
                            >
                              <Checkbox
                                id={`country-${country.code}`}
                                checked={selectedOperatingCountries.some(
                                  (c) => c.code === country.code
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedOperatingCountries([
                                      ...selectedOperatingCountries,
                                      {
                                        code: country.code,
                                        name: country.name,
                                        isMainCountry: false,
                                      },
                                    ]);
                                  } else {
                                    setSelectedOperatingCountries(
                                      selectedOperatingCountries.filter(
                                        (c) => c.code !== country.code
                                      )
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`country-${country.code}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {country.flag} {country.name}
                              </Label>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Spécialités</Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Ajoutez les spécialités de votre entreprise
                    </p>
                    <div className="flex space-x-2 mb-4">
                      <Input
                        type="text"
                        placeholder="Ajouter une spécialité"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newSpecialty.trim() !== "") {
                              setSpecialties([
                                ...specialties,
                                newSpecialty.trim(),
                              ]);
                              setNewSpecialty("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newSpecialty.trim() !== "") {
                            setSpecialties([
                              ...specialties,
                              newSpecialty.trim(),
                            ]);
                            setNewSpecialty("");
                          }
                        }}
                      >
                        Ajouter
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {specialty}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() =>
                              setSpecialties(
                                specialties.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Documents</Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Uploadez vos documents officiels (licences, assurances,
                      etc.)
                    </p>
                    <FileUpload
                      endpoint="companyDocuments"
                      value={[]}
                      onChange={() => {}}
                      maxFiles={10}
                      accept={{
                        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                        "application/pdf": [".pdf"],
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {selectedCompany ? "Modification..." : "Création..."}
                    </>
                  ) : selectedCompany ? (
                    "Modifier"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Détails de l'entreprise
            </DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <ScrollArea className="h-[75vh]">
              <div className="space-y-6">
                {/* Header avec logo et statut */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    {selectedCompany.logo ? (
                      <AvatarImage
                        src={selectedCompany.logo || "/placeholder.svg"}
                        alt={selectedCompany.name}
                      />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {selectedCompany.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {selectedCompany.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedCompany.description}
                    </p>
                    {selectedCompany.slogan && (
                      <p className="text-md italic text-gray-500 mt-1">
                        "{selectedCompany.slogan}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(selectedCompany)}
                      {getStatusBadge(selectedCompany)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      Informations de base
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>Licence: {selectedCompany.licenseNumber}</span>
                      </div>
                      {selectedCompany.taxId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Archive className="h-4 w-4 text-gray-400" />
                          <span>ID Fiscal: {selectedCompany.taxId}</span>
                        </div>
                      )}
                      {selectedCompany.foundedYear && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Année de création: {selectedCompany.foundedYear}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          Taille:{" "}
                          {selectedCompany.size === "SMALL"
                            ? "Petite"
                            : selectedCompany.size === "MEDIUM"
                            ? "Moyenne"
                            : selectedCompany.size === "LARGE"
                            ? "Grande"
                            : "Entreprise"}
                        </span>
                      </div>
                      {selectedCompany.operatingHours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            Heures d'ouverture: {selectedCompany.operatingHours}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Informations de contact
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedCompany.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>
                          {selectedCompany.countryCode} {selectedCompany.phone}
                        </span>
                      </div>
                      {selectedCompany.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={selectedCompany.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedCompany.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Localisation
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {selectedCompany.city}, {selectedCompany.country}
                        </span>
                      </div>
                      {selectedCompany.commune && (
                        <div className="text-sm text-gray-600 ml-6">
                          {selectedCompany.commune}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 ml-6">
                        {selectedCompany.address}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Statistiques</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Employés</p>
                        <p className="font-semibold text-blue-600">
                          {selectedCompany._count.employees}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <Bus className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Bus</p>
                        <p className="font-semibold text-green-600">
                          {selectedCompany._count.buses}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Voyages</p>
                        <p className="font-semibold text-purple-600">
                          {selectedCompany._count.trips}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Réservations</p>
                        <p className="font-semibold text-orange-600">
                          {selectedCompany._count.reservations}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCompany.specialties &&
                  selectedCompany.specialties.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Spécialités
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.specialties.map(
                            (specialty, index) => (
                              <Badge key={index} variant="outline">
                                {specialty}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                <Separator />

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Créée le {formatDate(selectedCompany.createdAt)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(selectedCompany)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/patron/companies/${selectedCompany.id}`)
                      }
                    >
                      Gérer
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Supprimer l'entreprise
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'entreprise "
              {selectedCompany?.name}" ? Cette action est irréversible et
              supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
