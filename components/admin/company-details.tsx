"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Users,
  Bus,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
  FileText,
  DollarSign,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Shield,
  AlertTriangle,
  Route,
  Clock,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface CompanyDetailsProps {
  id: string;
}

export function CompanyDetails({ id }: CompanyDetailsProps) {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${id}`);
      if (!response.ok)
        throw new Error(
          "Erreur lors du chargement des détails de l'entreprise"
        );
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company details:", error);
      toast.error("Impossible de charger les détails de l'entreprise");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/admin/companies/${id}/approve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erreur lors de l'approbation");

      toast.success("Entreprise approuvée avec succès");
      fetchCompanyDetails();
    } catch (error) {
      console.error("Error approving company:", error);
      toast.error("Erreur lors de l'approbation de l'entreprise");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const response = await fetch(`/api/admin/companies/${id}/reject`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erreur lors du rejet");

      toast.success("Entreprise rejetée avec succès");
      fetchCompanyDetails();
    } catch (error) {
      console.error("Error rejecting company:", error);
      toast.error("Erreur lors du rejet de l'entreprise");
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            En attente
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approuvée
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejetée
          </Badge>
        );
      case "SUSPENDED":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Suspendue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "PATRON":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Patron
          </Badge>
        );
      case "GESTIONNAIRE":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Gestionnaire
          </Badge>
        );
      case "CAISSIER":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Caissier
          </Badge>
        );
      case "CHAUFFEUR":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Chauffeur
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getBusStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Actif
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Maintenance
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Inactif
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy à HH:mm", { locale: fr });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Chargement des détails de l'entreprise...
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Entreprise non trouvée</h3>
        <p className="text-muted-foreground mt-1">
          L'entreprise demandée n'existe pas ou a été supprimée
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/companies")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/companies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>ID: {company.id}</span>
              {getStatusBadge(company.status)}
              {company.isVerified && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Vérifiée
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {company.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isRejecting ? "Rejet..." : "Rejeter"}
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={isRejecting || isApproving}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? "Approbation..." : "Approuver"}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/companies/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employés
                </p>
                <p className="text-2xl font-bold">{company._count.employees}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Véhicules
                </p>
                <p className="text-2xl font-bold">{company._count.buses}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Routes
                </p>
                <p className="text-2xl font-bold">{company._count.routes}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Route className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Revenus
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(company.stats.totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="fleet">Flotte</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations de l'entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Informations générales
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {company.description || "Aucune description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p>{company.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p>
                          {company.countryCode} {company.phone}
                        </p>
                      </div>
                      {company.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
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

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Adresse
                    </h3>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{company.address}</p>
                        <p>
                          {company.commune && `${company.commune}, `}
                          {company.city}
                        </p>
                        <p>
                          {company.country}{" "}
                          {company.postalCode && `- ${company.postalCode}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Informations légales
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p>
                          Licence:{" "}
                          <span className="font-medium">
                            {company.licenseNumber || "Non renseigné"}
                          </span>
                        </p>
                      </div>
                      {company.taxId && (
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p>
                            ID Fiscal:{" "}
                            <span className="font-medium">{company.taxId}</span>
                          </p>
                        </div>
                      )}
                      {company.foundedYear && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p>
                            Fondée en:{" "}
                            <span className="font-medium">
                              {company.foundedYear}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(company.owner.name || company.owner.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {company.owner.name || "Nom non renseigné"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {company.owner.email}
                    </p>
                    {company.owner.phone && (
                      <p className="text-sm text-muted-foreground">
                        {company.owner.countryCode} {company.owner.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Membre depuis le {formatDate(company.owner.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activités récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.stats.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {company.stats.recentActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.createdAt)}
                          </p>
                          {activity.user && (
                            <p className="text-xs text-muted-foreground">
                              par {activity.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Aucune activité récente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employés ({company.employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.employees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Poste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.employees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(employee.name || employee.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {employee.name || "Nom non renseigné"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{getRoleBadge(employee.role)}</TableCell>
                        <TableCell>
                          {employee.employeeRole ? (
                            <Badge variant="outline">
                              {employee.employeeRole}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              Non défini
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun employé enregistré
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Flotte de véhicules ({company.buses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.buses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaque</TableHead>
                      <TableHead>Modèle</TableHead>
                      <TableHead>Capacité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.buses.map((bus: any) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">
                          {bus.plateNumber}
                        </TableCell>
                        <TableCell>{bus.model}</TableCell>
                        <TableCell>{bus.capacity} places</TableCell>
                        <TableCell>{getBusStatusBadge(bus.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun véhicule enregistré
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Routes ({company.routes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.routes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Départ</TableHead>
                      <TableHead>Arrivée</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.routes.map((route: any) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">
                          {route.name}
                        </TableCell>
                        <TableCell>{route.departureLocation}</TableCell>
                        <TableCell>{route.arrivalLocation}</TableCell>
                        <TableCell>{getBusStatusBadge(route.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune route configurée
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({company.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.documents && company.documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.documents.map((document: any) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          {document.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{document.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {document.isVerified ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {document.expiryDate ? (
                            <span
                              className={
                                new Date(document.expiryDate) < new Date()
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {formatDate(document.expiryDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Aucune
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun document téléchargé
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
