"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySelector } from "@/components/patron/company-selector";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  Users,
  Bus,
  TrendingUp,
  DollarSign,
  Building,
  Plus,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardData {
  globalStats: {
    totalRevenue: number;
    totalTrips: number;
    totalBuses: number;
    totalEmployees: number;
    totalReservations: number;
    totalCompanies: number;
  };
  companies: {
    id: string;
    name: string;
    logo: string | null;
    isActive: boolean;
    isVerified: boolean;
    stats: {
      revenue: number;
      trips: number;
      buses: number;
      employees: number;
      reservations: number;
    };
  }[];
  recentActivities: {
    id: string;
    type: string;
    description: string;
    status: string;
    companyName: string;
    createdAt: string;
  }[];
}

export default function MultiCompanyDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/patron/dashboard");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TRIP_CREATED":
        return <Plus className="h-4 w-4 text-blue-600" />;
      case "EMPLOYEE_ADDED":
        return <Users className="h-4 w-4 text-green-600" />;
      case "COMPANY_CREATED":
        return <Building className="h-4 w-4 text-purple-600" />;
      case "COMPANY_UPDATED":
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Tableau de bord Patron
            </h1>
            <CompanySelector />
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
              <p className="text-gray-600">Gestion de vos entreprises</p>
            </div>
            <div className="flex items-center gap-4">
              <CompanySelector />
              <NotificationBell />
              <Button onClick={() => router.push("/patron/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>

        {/* Global Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Entreprises
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {dashboardData.globalStats.totalCompanies}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Revenus totaux
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData.globalStats.totalRevenue)}
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
                    <p className="text-sm font-medium text-gray-600">Voyages</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData.globalStats.totalTrips}
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
                    <p className="text-2xl font-bold text-amber-600">
                      {dashboardData.globalStats.totalEmployees}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bus</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {dashboardData.globalStats.totalBuses}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Bus className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Réservations
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {dashboardData.globalStats.totalReservations}
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
            <TabsTrigger value="activities">Activités</TabsTrigger>
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
                    {dashboardData?.recentActivities
                      .slice(0, 5)
                      .map((activity) => (
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
                                {formatDate(activity.createdAt)}
                              </p>
                              <p className="text-xs text-gray-500">
                                • {activity.companyName}
                              </p>
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
                      onClick={() => router.push("/patron/companies/new")}
                      className="justify-start h-12"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Créer une nouvelle entreprise
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/patron/trips/new")}
                      className="justify-start h-12"
                    >
                      <Bus className="h-4 w-4 mr-2" />
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
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Vos entreprises
                  </CardTitle>
                  <Button onClick={() => router.push("/patron/companies/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une entreprise
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData?.companies.map((company) => (
                    <Card key={company.id} className="overflow-hidden">
                      <div className="h-2 bg-blue-600"></div>
                      <CardContent className="p-4 pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              {company.logo ? (
                                <img
                                  src={company.logo || "/placeholder.svg"}
                                  alt={company.name}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <Building className="h-6 w-6 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{company.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {!company.isVerified && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                    En attente
                                  </span>
                                )}
                                {!company.isActive && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/patron/companies/${company.id}`)
                            }
                          >
                            Détails
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Revenus</p>
                            <p className="font-medium">
                              {formatCurrency(company.stats.revenue)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Voyages</p>
                            <p className="font-medium">{company.stats.trips}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Bus</p>
                            <p className="font-medium">{company.stats.buses}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Employés</p>
                            <p className="font-medium">
                              {company.stats.employees}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Historique des activités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 border-b pb-4 last:border-0"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            • {activity.companyName}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              activity.status === "SUCCESS"
                                ? "bg-green-100 text-green-800"
                                : activity.status === "WARNING"
                                ? "bg-yellow-100 text-yellow-800"
                                : activity.status === "ERROR"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {activity.status}
                          </span>
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
                    Revenus par entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
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
                    Performance des entreprises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Graphique de performance</p>
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
