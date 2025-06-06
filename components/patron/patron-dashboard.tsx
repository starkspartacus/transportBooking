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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

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
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  status: string;
}

export default function PatronDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, employeesRes, busesRes, routesRes, activitiesRes] =
        await Promise.all([
          fetch("/api/patron/stats"),
          fetch("/api/patron/employees"),
          fetch("/api/patron/buses"),
          fetch("/api/patron/routes"),
          fetch("/api/patron/activities"),
        ]);

      const [statsData, employeesData, busesData, routesData, activitiesData] =
        await Promise.all([
          statsRes.json(),
          employeesRes.json(),
          busesRes.json(),
          routesRes.json(),
          activitiesRes.json(),
        ]);

      setStats(statsData);
      setEmployees(employeesData);
      setBuses(busesData);
      setRoutes(routesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Tableau de bord Patron
            </h1>
            <p className="text-sm text-gray-600">
              {session?.user?.company?.name}
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tableau de bord Patron
              </h1>
              <p className="text-gray-600">
                Gestion de {session?.user?.company?.name}
              </p>
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="employees">Employés</TabsTrigger>
            <TabsTrigger value="fleet">Flotte</TabsTrigger>
            <TabsTrigger value="routes">Itinéraires</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
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
                    {activities.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
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
                    ))}
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
                  {employees.map((employee) => (
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
                  ))}
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
                  {buses.map((bus) => (
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
                              Kilométrage: {bus.totalKm.toLocaleString()} km
                            </span>
                            <span>
                              Dernière maintenance:{" "}
                              {formatDate(bus.lastMaintenance)}
                            </span>
                            <span>
                              Prochaine maintenance:{" "}
                              {formatDate(bus.nextMaintenance)}
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
                  ))}
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
                  {routes.map((route) => (
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
                            <span>Prix: {formatCurrency(route.price)}</span>
                            <span>Voyages: {route.totalTrips}</span>
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
                  ))}
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
        </Tabs>
      </div>
    </div>
  );
}
