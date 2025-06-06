"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  Users,
  Bus,
  TrendingUp,
  DollarSign,
  MapPin,
  Settings,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  Building,
  Archive,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface CompanyStats {
  totalRevenue: number;
  totalTrips: number;
  totalEmployees: number;
  totalBuses: number;
  activeTrips: number;
  pendingReservations: number;
  monthlyGrowth: number;
  occupancyRate: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  hireDate: string;
  lastLogin?: string;
}

interface BusType {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKm: number;
}

interface Route {
  id: string;
  name: string;
  departure: string;
  arrival: string;
  distance: number;
  estimatedDuration: number;
  price: number;
  status: string;
  totalTrips: number;
  basePrice?: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  status: string;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  totalEmployees?: number;
  totalBuses?: number;
  totalRevenue?: number;
  canDelete: boolean;
}

export default function PatronDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Récupérer les détails de la compagnie active
    if (session?.user?.companyId && companies.length > 0) {
      const company = companies.find((c) => c.id === session.user.companyId);
      if (company) {
        setActiveCompany(company);
      } else {
        // Si l'ID de la compagnie n'est pas trouvé dans la liste, récupérer les détails
        fetchCompanyDetails(session.user.companyId);
      }
    }
  }, [session?.user?.companyId, companies]);

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`);
      if (response.ok) {
        const companyData = await response.json();
        setActiveCompany(companyData);
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        statsRes,
        employeesRes,
        busesRes,
        routesRes,
        activitiesRes,
        companiesRes,
      ] = await Promise.all([
        fetch("/api/patron/stats"),
        fetch("/api/patron/employees"),
        fetch("/api/patron/buses"),
        fetch("/api/patron/routes"),
        fetch("/api/patron/activities"),
        fetch("/api/patron/companies"),
      ]);

      const [
        statsData,
        employeesData,
        busesData,
        routesData,
        activitiesData,
        companiesData,
      ] = await Promise.all([
        statsRes.json(),
        employeesRes.json(),
        busesRes.json(),
        routesRes.json(),
        activitiesRes.json(),
        companiesRes.json(),
      ]);

      setStats(statsData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Initialiser avec des tableaux vides en cas d'erreur
      setEmployees([]);
      setBuses([]);
      setRoutes([]);
      setActivities([]);
      setCompanies([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (
    status: string,
    type: "employee" | "bus" | "route"
  ) => {
    const variants = {
      employee: {
        ACTIVE: "bg-green-50 text-green-700 border-green-200",
        INACTIVE: "bg-red-50 text-red-700 border-red-200",
        SUSPENDED: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      bus: {
        ACTIVE: "bg-green-50 text-green-700 border-green-200",
        MAINTENANCE: "bg-yellow-50 text-yellow-700 border-yellow-200",
        OUT_OF_SERVICE: "bg-red-50 text-red-700 border-red-200",
      },
      route: {
        ACTIVE: "bg-green-50 text-green-700 border-green-200",
        INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
        SUSPENDED: "bg-red-50 text-red-700 border-red-200",
      },
    };

    const variant =
      variants[type][status as keyof (typeof variants)[typeof type]] ||
      "bg-gray-50 text-gray-700 border-gray-200";

    return (
      <Badge variant="outline" className={variant}>
        {status}
      </Badge>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TRIP_CREATED":
        return <Plus className="h-4 w-4 text-blue-600" />;
      case "EMPLOYEE_ADDED":
        return <Users className="h-4 w-4 text-green-600" />;
      case "BUS_MAINTENANCE":
        return <Settings className="h-4 w-4 text-yellow-600" />;
      case "RESERVATION_CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PAYMENT_RECEIVED":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "SYSTEM_ALERT":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
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
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entreprise",
        variant: "destructive",
      });
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
        fetchDashboardData(); // Refresh data
        toast({
          title: "Entreprise archivée",
          description: "L'entreprise a été archivée avec succès",
        });
      }
    } catch (error) {
      console.error("Error archiving company:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver l'entreprise",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Obtenir le nom de la compagnie active
  const companyName = activeCompany?.name || "Votre entreprise";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Tableau de bord Patron
            </h1>
            <p className="text-sm text-gray-600">{companyName}</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {activeCompany?.logo ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={activeCompany.logo || "/placeholder.svg"}
                    alt={companyName}
                  />
                  <AvatarFallback>
                    {companyName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tableau de bord Patron
                </h1>
                <p className="text-gray-600">Gestion de {companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button onClick={() => router.push("/patron/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Revenus totaux
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{stats.monthlyGrowth}% ce mois
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Voyages actifs
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.activeTrips}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalTrips} au total
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bus className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Employés
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.totalEmployees}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Équipe active</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Taux d'occupation
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.occupancyRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Moyenne mensuelle
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="employees">Employés</TabsTrigger>
            <TabsTrigger value="fleet">Flotte</TabsTrigger>
            <TabsTrigger value="routes">Itinéraires</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activités récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(activities) && activities.length > 0 ? (
                      activities.slice(0, 8).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3"
                        >
                          {getActivityIcon(activity.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {format(
                                  new Date(activity.timestamp),
                                  "dd MMM HH:mm",
                                  { locale: fr }
                                )}
                              </p>
                              {activity.user && (
                                <p className="text-xs text-gray-500">
                                  par {activity.user}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>Aucune activité récente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => router.push("/patron/trips/new")}
                      className="justify-start h-12"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un nouveau voyage
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/patron/employees/new")}
                      className="justify-start h-12"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Ajouter un employé
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/patron/buses/new")}
                      className="justify-start h-12"
                    >
                      <Bus className="h-4 w-4 mr-2" />
                      Enregistrer un bus
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/patron/routes/new")}
                      className="justify-start h-12"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Créer un itinéraire
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/patron/reports")}
                      className="justify-start h-12"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Voir les rapports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Items */}
            {stats && stats.pendingReservations > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Éléments en attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="font-medium">
                        {stats.pendingReservations} réservations en attente de
                        confirmation
                      </p>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2"
                      onClick={() =>
                        router.push("/patron/reservations?status=pending")
                      }
                    >
                      Voir les réservations en attente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des employés
                  </CardTitle>
                  <Button onClick={() => router.push("/patron/employees/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un employé
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(employees) && employees.length > 0 ? (
                    employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{employee.name}</h3>
                              {getStatusBadge(employee.status, "employee")}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {employee.email}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>Rôle: {employee.role}</span>
                              <span>
                                Embauché le: {formatDate(employee.hireDate)}
                              </span>
                              {employee.lastLogin && (
                                <span>
                                  Dernière connexion:{" "}
                                  {formatDate(employee.lastLogin)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patron/employees/${employee.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/patron/employees/${employee.id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun employé enregistré</p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/patron/employees/new")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre premier employé
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Gestion de la flotte
                  </CardTitle>
                  <Button onClick={() => router.push("/patron/buses/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un bus
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(buses) && buses.length > 0 ? (
                    buses.map((bus) => (
                      <div
                        key={bus.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{bus.plateNumber}</h3>
                              {getStatusBadge(bus.status, "bus")}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {bus.model} - {bus.capacity} places
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>
                                Kilométrage:{" "}
                                {bus.totalKm?.toLocaleString() || 0} km
                              </span>
                              <span>
                                Dernière maintenance:{" "}
                                {bus.lastMaintenance
                                  ? formatDate(bus.lastMaintenance)
                                  : "N/A"}
                              </span>
                              <span>
                                Prochaine maintenance:{" "}
                                {bus.nextMaintenance
                                  ? formatDate(bus.nextMaintenance)
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patron/buses/${bus.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patron/buses/${bus.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun bus enregistré</p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/patron/buses/new")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre premier bus
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Gestion des itinéraires
                  </CardTitle>
                  <Button onClick={() => router.push("/patron/routes/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un itinéraire
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(routes) && routes.length > 0 ? (
                    routes.map((route) => (
                      <div
                        key={route.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{route.name}</h3>
                              {getStatusBadge(route.status, "route")}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {route.departure} → {route.arrival}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>Distance: {route.distance} km</span>
                              <span>Durée: {route.estimatedDuration} min</span>
                              <span>
                                Prix:{" "}
                                {formatCurrency(
                                  route.basePrice || route.price || 0
                                )}
                              </span>
                              <span>Voyages: {route.totalTrips || 0}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patron/routes/${route.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patron/routes/${route.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun itinéraire créé</p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/patron/routes/new")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer votre premier itinéraire
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenus mensuels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Graphique des revenus</p>
                      <p className="text-sm">
                        Données en cours de chargement...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Taux d'occupation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Graphique d'occupation</p>
                      <p className="text-sm">
                        Données en cours de chargement...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
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
                  {Array.isArray(companies) && companies.length > 0 ? (
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
                                Créée le: {formatDate(company.createdAt)}
                              </span>
                              <span>
                                Employés: {company.totalEmployees || 0}
                              </span>
                              <span>Bus: {company.totalBuses || 0}</span>
                              <span>
                                Revenus:{" "}
                                {formatCurrency(company.totalRevenue || 0)}
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
                                router.push(
                                  `/patron/companies/${company.id}/edit`
                                )
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
                      <Button
                        onClick={() => router.push("/patron/companies/new")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer ma première entreprise
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
