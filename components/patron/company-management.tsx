"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  PowerOff,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Archive,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  totalEmployees?: number;
  totalBuses?: number;
  totalRevenue?: number;
  canDelete: boolean;
}

interface CompanyManagementProps {
  ownerId: string; // The ID of the patron managing these companies
}

export default function CompanyManagement({ ownerId }: CompanyManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // États
  // const [companies, setCompanies] = useState<Company[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
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
  }, [ownerId]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/companies?ownerId=${ownerId}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les entreprises.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur inattendue est survenue lors du chargement des entreprises.",
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

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/patron/companies/${companyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== companyId));
        toast({
          title: "Entreprise supprimée",
          description: "L'entreprise a été supprimée avec succès",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Impossible de supprimer l'entreprise",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur inattendue est survenue lors de la suppression.",
        variant: "destructive",
      });
    }
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

  const handleArchiveCompany = async (companyId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir archiver cette entreprise ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/patron/companies/${companyId}/archive`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchCompanies(); // Refresh data
        toast({
          title: "Entreprise archivée",
          description: "L'entreprise a été archivée avec succès",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible d'archiver l'entreprise",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error archiving company:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue lors de l'archivage.",
        variant: "destructive",
      });
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
      <Card>
        <CardHeader>
          <CardTitle>Gestion des entreprises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chargement des entreprises...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Gestion des entreprises
          </CardTitle>
          <Button onClick={() => router.push("/patron/companies/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une entreprise
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies.length > 0 ? (
            companies.map((company) => (
              <div
                key={company.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
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
                      <h3 className="font-medium">{company.name}</h3>
                      {company.isVerified ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Vérifiée
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          En attente
                        </Badge>
                      )}
                      {company.isActive && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {company.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>
                        Créée le:{" "}
                        {format(new Date(company.createdAt), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      <span>Employés: {company.totalEmployees || 0}</span>
                      <span>Bus: {company.totalBuses || 0}</span>
                      <span>
                        Revenus:{" "}
                        {new Intl.NumberFormat("fr-FR").format(
                          company.totalRevenue || 0
                        )}{" "}
                        FCFA
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/patron/companies/${company.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/patron/companies/${company.id}/edit`)
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {company.canDelete ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 hover:text-yellow-700"
                        onClick={() => handleArchiveCompany(company.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune entreprise créée</p>
              <p className="text-sm mb-4">
                Créez votre première entreprise pour commencer
              </p>
              <Button onClick={() => router.push("/patron/companies/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première entreprise
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
