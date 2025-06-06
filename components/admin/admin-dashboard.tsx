"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  Shield,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Edit,
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface SystemStats {
  totalUsers: number;
  totalCompanies: number;
  totalTrips: number;
  totalRevenue: number;
  activeUsers: number;
  pendingApprovals: number;
  systemAlerts: number;
  monthlyGrowth: number;
}

interface Company {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  status: string;
  createdAt: string;
  totalEmployees: number;
  totalTrips: number;
  totalRevenue: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  company?: {
    name: string;
  };
}

interface SystemAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, companiesRes, usersRes, alertsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/companies"),
        fetch("/api/admin/users"),
        fetch("/api/admin/alerts"),
      ]);

      const [statsData, companiesData, usersData, alertsData] =
        await Promise.all([
          statsRes.json(),
          companiesRes.json(),
          usersRes.json(),
          alertsRes.json(),
        ]);

      setStats(statsData);
      setCompanies(companiesData);
      setUsers(usersData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveCompany = async (companyId: string) => {
    try {
      const response = await fetch(
        `/api/admin/companies/${companyId}/approve`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchDashboardData();
        alert("Entreprise approuvée avec succès");
      }
    } catch (error) {
      console.error("Error approving company:", error);
      alert("Erreur lors de l'approbation");
    }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir suspendre cet utilisateur ?"))
      return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
      });

      if (response.ok) {
        fetchDashboardData();
        alert("Utilisateur suspendu avec succès");
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      alert("Erreur lors de la suspension");
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}/resolve`, {
        method: "POST",
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const getStatusBadge = (
    status: string,
    type: "company" | "user" | "alert"
  ) => {
    const variants = {
      company: {
        PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
        APPROVED: "bg-green-50 text-green-700 border-green-200",
        SUSPENDED: "bg-red-50 text-red-700 border-red-200",
        REJECTED: "bg-gray-50 text-gray-700 border-gray-200",
      },
      user: {
        ACTIVE: "bg-green-50 text-green-700 border-green-200",
        INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
        SUSPENDED: "bg-red-50 text-red-700 border-red-200",
      },
      alert: {
        LOW: "bg-blue-50 text-blue-700 border-blue-200",
        MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
        HIGH: "bg-red-50 text-red-700 border-red-200",
        CRITICAL: "bg-red-100 text-red-800 border-red-300",
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "LOW":
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Chargement du tableau de bord administrateur...
          </p>
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
            <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Gestion système</p>
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
                Tableau de bord Administrateur
              </h1>
              <p className="text-gray-600">Gestion et supervision du système</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button onClick={() => router.push("/admin/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres système
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
                      Utilisateurs totaux
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalUsers}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.activeUsers} actifs
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Entreprises
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalCompanies}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.pendingApprovals} en attente
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Revenus système
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{stats.monthlyGrowth}% ce mois
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Alertes système
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.systemAlerts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nécessitent attention
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Alerts */}
        {alerts.filter((alert) => !alert.resolved).length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Alertes système actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts
                  .filter((alert) => !alert.resolved)
                  .slice(0, 3)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 bg-white p-3 rounded-lg"
                    >
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {alert.title}
                          </h4>
                          {getStatusBadge(alert.severity, "alert")}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(
                            new Date(alert.timestamp),
                            "dd MMM yyyy HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Résoudre
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="companies" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gestion des entreprises
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Rechercher..."
                        className="pl-8 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setStatusFilter("")}
                    >
                      Tous
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{company.name}</h3>
                            {getStatusBadge(company.status, "company")}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {company.email}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {company.city}, {company.country}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Employés: {company.totalEmployees}</span>
                            <span>Voyages: {company.totalTrips}</span>
                            <span>
                              Revenus: {formatCurrency(company.totalRevenue)}
                            </span>
                            <span>
                              Créée le: {formatDate(company.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {company.status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => approveCompany(company.id)}
                            >
                              Approuver
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/companies/${company.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/companies/${company.id}/edit`)
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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Rechercher..."
                        className="pl-8 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setStatusFilter("")}
                    >
                      Tous
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{user.name}</h3>
                            {getStatusBadge(user.status, "user")}
                            <Badge variant="secondary">{user.role}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {user.email}
                          </p>
                          {user.company && (
                            <p className="text-sm text-gray-600 mb-1">
                              Entreprise: {user.company.name}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>
                              Inscrit le: {formatDate(user.createdAt)}
                            </span>
                            {user.lastLogin && (
                              <span>
                                Dernière connexion: {formatDate(user.lastLogin)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => suspendUser(user.id)}
                            >
                              Suspendre
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/users/${user.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/users/${user.id}/edit`)
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
                    Croissance des utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Graphique de croissance</p>
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
                    Revenus par région
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Graphique des revenus</p>
                      <p className="text-sm">
                        Données en cours de chargement...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="space-y-4 lg:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    État du système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Base de données
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Opérationnelle
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">API</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Fonctionnelle
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Paiements
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">Actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Historique des alertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          alert.resolved ? "bg-gray-50" : "bg-white border"
                        }`}
                      >
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-medium ${
                                alert.resolved
                                  ? "text-gray-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {alert.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(alert.severity, "alert")}
                              {alert.resolved && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Résolu
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              alert.resolved ? "text-gray-500" : "text-gray-600"
                            }`}
                          >
                            {alert.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(alert.timestamp),
                              "dd MMM yyyy HH:mm",
                              { locale: fr }
                            )}
                          </p>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Résoudre
                          </Button>
                        )}
                      </div>
                    ))}
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
