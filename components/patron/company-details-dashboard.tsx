"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  ArrowLeft,
  Settings,
  Users,
  Bus,
  Route,
  TrendingUp,
  Calendar,
  Edit,
  Archive,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import EmployeeManagement from "@/components/patron/employee-management";
import BusFleetManagement from "@/components/patron/bus-fleet-management";
import RouteManagement from "@/components/patron/route-management";
import TripScheduling from "@/components/patron/trip-scheduling";

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
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
  createdAt: string;
  operatingCountries?: string[];
  services?: string[];
  vehicleTypes?: string[];
  _count: {
    employees: number;
    buses: number;
    routes: number;
    trips: number;
    reservations: number;
    tickets: number;
  };
  stats?: {
    revenue: number;
    activeTrips: number;
    completedTrips: number;
    totalPassengers: number;
  };
}

interface CompanyDetailsDashboardProps {
  companyId: string;
}

export default function CompanyDetailsDashboard({
  companyId,
}: CompanyDetailsDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);

        // Vérifier si l'entreprise peut être supprimée (aucun ticket vendu)
        setCanDelete(
          data._count.tickets === 0 && data._count.reservations === 0
        );
      } else {
        throw new Error("Entreprise non trouvée");
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'entreprise",
        variant: "destructive",
      });
      router.push("/patron/companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!company || !canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/patron/companies/${company.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Entreprise supprimée avec succès",
        });
        router.push("/patron/companies");
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
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = async () => {
    if (!company) return;

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
          description: "Entreprise archivée avec succès",
        });
        fetchCompanyDetails();
      } else {
        throw new Error("Erreur lors de l'archivage");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowArchiveDialog(false);
    }
  };

  const getStatusBadge = (company: Company) => {
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
    if (!company.isActive) {
      return <X className="h-4 w-4 text-gray-500" />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Entreprise non trouvée
            </h3>
            <p className="text-gray-600 mb-4">
              L'entreprise que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => router.push("/patron/companies")}>
              Retour aux entreprises
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patron/companies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {company.logo ? (
                <AvatarImage
                  src={company.logo || "/placeholder.svg"}
                  alt={company.name}
                />
              ) : (
                <AvatarFallback className="text-lg">
                  {company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.name}
                </h1>
                {getStatusIcon(company)}
                {getStatusBadge(company)}
              </div>
              <p className="text-gray-600">{company.description}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {company.city}, {company.country}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Créée le {formatDate(company.createdAt)}
                </span>
              </div>
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

          {canDelete ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Employés</p>
                <p className="text-2xl font-bold">{company._count.employees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flotte de bus</p>
                <p className="text-2xl font-bold">{company._count.buses}</p>
              </div>
              <Bus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Routes</p>
                <p className="text-2xl font-bold">{company._count.routes}</p>
              </div>
              <Route className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voyages</p>
                <p className="text-2xl font-bold">{company._count.trips}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="fleet">Flotte</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="trips">Voyages</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations de l'entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Contact</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{company.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>
                          {company.countryCode} {company.phone}
                        </span>
                      </div>
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Localisation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {company.city}, {company.country}
                        </span>
                      </div>
                      {company.commune && (
                        <div className="text-gray-600 ml-6">
                          {company.commune}
                        </div>
                      )}
                      <div className="text-gray-600 ml-6">
                        {company.address}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Informations légales
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Licence: </span>
                        <span className="font-medium">
                          {company.licenseNumber}
                        </span>
                      </div>
                      {company.taxId && (
                        <div>
                          <span className="text-gray-600">ID Fiscal: </span>
                          <span className="font-medium">{company.taxId}</span>
                        </div>
                      )}
                      {company.foundedYear && (
                        <div>
                          <span className="text-gray-600">
                            Année de création:{" "}
                          </span>
                          <span className="font-medium">
                            {company.foundedYear}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Activité</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Réservations: </span>
                        <span className="font-medium">
                          {company._count.reservations}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tickets vendus: </span>
                        <span className="font-medium">
                          {company._count.tickets}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Statut: </span>
                        <span
                          className={`font-medium ${
                            canDelete ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {canDelete
                            ? "Peut être supprimée"
                            : "Activité détectée"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("employees")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les employés
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("fleet")}
                >
                  <Bus className="h-4 w-4 mr-2" />
                  Gérer la flotte
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("routes")}
                >
                  <Route className="h-4 w-4 mr-2" />
                  Gérer les routes
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("trips")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer un voyage
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="fleet">
          <BusFleetManagement />
        </TabsContent>

        <TabsContent value="routes">
          <RouteManagement />
        </TabsContent>

        <TabsContent value="trips">
          <TripScheduling />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/patron/companies/${company.id}/edit`)
                  }
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier les informations
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-red-900">Zone de danger</h4>
                  <p className="text-sm text-gray-600">
                    {canDelete
                      ? "Vous pouvez supprimer cette entreprise car aucun ticket n'a été vendu."
                      : "Cette entreprise ne peut pas être supprimée car des tickets ont été vendus. Vous pouvez l'archiver."}
                  </p>

                  {canDelete ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer l'entreprise
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowArchiveDialog(true)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver l'entreprise
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Supprimer l'entreprise
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'entreprise "{company.name}" ?
              Cette action est irréversible et supprimera toutes les données
              associées.
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
              disabled={isDeleting}
            >
              {isDeleting ? (
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

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Archive className="h-5 w-5" />
              Archiver l'entreprise
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir archiver l'entreprise "{company.name}" ?
              L'entreprise sera désactivée mais les données seront conservées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleArchive}>Archiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
