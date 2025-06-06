"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Building2,
  Users,
  Bus,
  Route,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Trash2,
  Plus,
  Eye,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CompanyDetailsProps {
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  commune?: string;
  website?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    employees: number;
    buses: number;
    routes: number;
    trips: number;
    reservations: number;
  };
  employees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  buses: Array<{
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    status: string;
    isActive: boolean;
  }>;
  routes: Array<{
    id: string;
    name: string;
    departureLocation: string;
    arrivalLocation: string;
    distance: number;
    estimatedDuration: number;
    status: string;
  }>;
  stats: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeTrips: number;
    completedTrips: number;
  };
}

export default function CompanyDetailsDashboard({
  companyId,
}: CompanyDetailsProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching company details for ID:", companyId);

      const response = await fetch(`/api/patron/companies/${companyId}`);

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Company data received:", data);
        setCompany(data);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        if (response.status === 404) {
          setError("Entreprise non trouvée");
        } else if (response.status === 403) {
          setError("Vous n'avez pas accès à cette entreprise");
        } else {
          setError(errorData.error || "Erreur lors du chargement");
        }

        toast({
          title: "Erreur",
          description:
            errorData.error ||
            "Impossible de charger les détails de l'entreprise",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Erreur de connexion");
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Entreprise supprimée avec succès",
        });
        router.push("/patron/companies");
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de supprimer l'entreprise",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactif</Badge>;
    }

    switch (status) {
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-500">
            Approuvé
          </Badge>
        );
      case "PENDING":
        return <Badge variant="secondary">En attente</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejeté</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Entreprise non trouvée"}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === "Entreprise non trouvée"
              ? "L'entreprise que vous recherchez n'existe pas ou a été supprimée."
              : error === "Vous n'avez pas accès à cette entreprise"
              ? "Cette entreprise ne vous appartient pas."
              : "Une erreur est survenue lors du chargement des détails."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/patron/companies")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux entreprises
            </Button>
            <Button variant="outline" onClick={fetchCompanyDetails}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patron/companies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(company.status, company.isActive)}
              <span className="text-sm text-gray-500">
                Créée le{" "}
                {new Date(company.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/patron/companies/${company.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette
                  action est irréversible et supprimera toutes les données
                  associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus Totaux
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(company.stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois: {formatCurrency(company.stats.monthlyRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.employees}</div>
            <p className="text-xs text-muted-foreground">
              Actifs dans l'entreprise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flotte</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.buses}</div>
            <p className="text-xs text-muted-foreground">
              Véhicules disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voyages</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company.stats.activeTrips}
            </div>
            <p className="text-xs text-muted-foreground">
              Actifs / {company.stats.completedTrips} terminés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.description && (
              <div>
                <h4 className="font-medium text-sm text-gray-500">
                  Description
                </h4>
                <p className="text-sm">{company.description}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{company.email}</span>
              </div>
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{company.phone}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {company.address}, {company.city}, {company.country}
                  </span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="employees" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="employees">
                  Employés ({company._count.employees})
                </TabsTrigger>
                <TabsTrigger value="buses">
                  Flotte ({company._count.buses})
                </TabsTrigger>
                <TabsTrigger value="routes">
                  Itinéraires ({company._count.routes})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="employees" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Employés récents</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {company.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {employee.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{employee.name}</p>
                          <p className="text-xs text-gray-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{employee.role}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {company.employees.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Aucun employé trouvé
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="buses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Flotte récente</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {company.buses.map((bus) => (
                    <div
                      key={bus.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {bus.plateNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {bus.model} • {bus.capacity} places
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            bus.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {bus.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {company.buses.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Aucun véhicule trouvé
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="routes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Itinéraires récents</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {company.routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Route className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{route.name}</p>
                          <p className="text-xs text-gray-500">
                            {route.departureLocation} → {route.arrivalLocation}
                          </p>
                          <p className="text-xs text-gray-500">
                            {route.distance}km •{" "}
                            {formatDuration(route.estimatedDuration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            route.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {route.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {company.routes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Aucun itinéraire trouvé
                    </p>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
