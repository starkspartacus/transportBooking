"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Bus,
  Route,
  Calendar,
  MapPin,
  TrendingUp,
  Edit,
  Phone,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import BusFleetManagement from "./bus-fleet-management";
import RouteManagement from "./route-management";
import TripFleetManagement from "./trip-fleet-management";
import EmployeeManagement from "./employee-management";

interface CompanyData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: string;
  createdAt: string;
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  hireDate?: string;
  department?: string;
  position?: string;
}

interface BusData {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
}

interface RouteData {
  id: string;
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  status: string;
  totalTrips: number;
}

interface TripData {
  id: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  availableSeats: number;
  status: string;
  route?: {
    name: string;
    departureLocation: string;
    arrivalLocation: string;
  };
  bus?: {
    plateNumber: string;
    model: string;
  };
}

interface CompanyDetailsDashboardProps {
  companyId: string;
}

export default function CompanyDetailsDashboard({
  companyId,
}: CompanyDetailsDashboardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
      fetchEmployees();
      fetchBuses();
      fetchRoutes();
      fetchTrips();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `/api/patron/employees?companyId=${companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await fetch(`/api/patron/buses?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setBuses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
      setBuses([]);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`/api/patron/routes?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      setRoutes([]);
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await fetch(`/api/patron/trips?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Actif" },
      INACTIVE: { color: "bg-gray-100 text-gray-800", label: "Inactif" },
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "En attente" },
      SUSPENDED: { color: "bg-red-100 text-red-800", label: "Suspendu" },
      SCHEDULED: { color: "bg-blue-100 text-blue-800", label: "Programmé" },
      COMPLETED: { color: "bg-green-100 text-green-800", label: "Terminé" },
      CANCELLED: { color: "bg-red-100 text-red-800", label: "Annulé" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
    };

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Statistiques calculées
  const activeEmployees = employees.filter(
    (emp) => emp.status === "ACTIVE"
  ).length;
  const activeBuses = buses.filter((bus) => bus.status === "ACTIVE").length;
  const activeRoutes = routes.filter(
    (route) => route.status === "ACTIVE"
  ).length;
  const scheduledTrips = trips.filter(
    (trip) => trip.status === "SCHEDULED"
  ).length;
  const totalRevenue = trips.reduce((sum, trip) => sum + trip.basePrice, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Chargement des données de l'entreprise...
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Entreprise non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de l'entreprise */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold mb-2">
                {company.name}
              </CardTitle>
              <p className="text-blue-100">
                {company.description || "Aucune description"}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                {company.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{company.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(company.status)}
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {activeEmployees}
                </p>
                <p className="text-sm text-blue-600">Employés actifs</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {activeBuses}
                </p>
                <p className="text-sm text-green-600">Bus actifs</p>
              </div>
              <Bus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {activeRoutes}
                </p>
                <p className="text-sm text-purple-600">Routes actives</p>
              </div>
              <Route className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-700">
                  {scheduledTrips}
                </p>
                <p className="text-sm text-orange-600">Voyages programmés</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600">Revenus (XOF)</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger
                  value="employees"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Employés ({employees.length})
                </TabsTrigger>
                <TabsTrigger value="fleet" className="flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  Flotte ({buses.length})
                </TabsTrigger>
                <TabsTrigger value="routes" className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Routes ({routes.length})
                </TabsTrigger>
                <TabsTrigger value="trips" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Voyages ({trips.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="employees" className="p-6">
              <EmployeeManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="fleet" className="p-6">
              <BusFleetManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="routes" className="p-6">
              <RouteManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="trips" className="p-6">
              <TripFleetManagement companyId={companyId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
