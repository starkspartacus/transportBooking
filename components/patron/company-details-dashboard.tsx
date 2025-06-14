"use client";

import { useState, useEffect, useCallback } from "react";
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
  Globe,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import BusFleetManagement from "./bus-fleet-management";
import RouteManagement from "./route-management";
import TripFleetManagement from "./trip-fleet-management";
import EmployeeManagement from "./employee-management";
import Link from "next/link"; // Import Link for navigation

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
  // Computed properties from API
  totalRevenue: number;
  activeEmployees: number;
  activeBuses: number;
  activeRoutes: number;
  scheduledTrips: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview"); // Default to overview or first tab

  // Memoized fetch functions to prevent re-creation on every render
  const fetchCompanyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch company data.");
      }
      const data = await response.json();
      setCompany(data);
    } catch (err: any) {
      console.error("Error fetching company:", err);
      setError(
        err.message ||
          "Une erreur est survenue lors du chargement des données de l'entreprise."
      );
      toast({
        title: "Erreur de chargement",
        description:
          err.message || "Impossible de charger les détails de l'entreprise.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId, fetchCompanyData]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
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
      APPROVED: { color: "bg-green-100 text-green-800", label: "Approuvé" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Rejeté" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
    };

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            Chargement des données de l'entreprise...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Veuillez patienter pendant que nous récupérons les informations.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[60vh] bg-red-50 rounded-lg shadow-sm border border-red-200">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="text-red-800 text-xl font-semibold mb-2">
          Erreur de chargement
        </p>
        <p className="text-red-600 text-center max-w-md">{error}</p>
        <Button
          onClick={() => fetchCompanyData()}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12 min-h-[60vh] flex flex-col items-center justify-center">
        <Building className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-xl font-semibold">
          Entreprise non trouvée
        </p>
        <p className="text-gray-500 mt-2">
          L'entreprise que vous recherchez n'existe pas ou n'est pas accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
      {/* En-tête de l'entreprise */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-3xl font-extrabold mb-2 tracking-tight">
                {company.name}
              </CardTitle>
              <p className="text-blue-100 text-lg opacity-90">
                {company.description || "Aucune description fournie."}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-sm text-blue-200">
                {company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-300" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-300" />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-300" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {getStatusBadge(company.status)}
              <Link href={`/patron/companies/${company.id}/edit`} passHref>
                <Button
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 px-5 py-2.5 rounded-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col items-start justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-blue-600 font-medium">
                Employés actifs
              </p>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-blue-800">
              {company.activeEmployees}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col items-start justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-green-600 font-medium">Bus actifs</p>
              <Bus className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-green-800">
              {company.activeBuses}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col items-start justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-purple-600 font-medium">
                Routes actives
              </p>
              <Route className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-4xl font-bold text-purple-800">
              {company.activeRoutes}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col items-start justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-orange-600 font-medium">
                Voyages programmés
              </p>
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-orange-800">
              {company.scheduledTrips}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col items-start justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-emerald-600 font-medium">
                Revenus (XOF)
              </p>
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-4xl font-bold text-emerald-800">
              {company.totalRevenue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b px-6 pt-6 bg-gray-50">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 h-12 rounded-md p-1">
                <TabsTrigger
                  value="employees"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 transition-all duration-200"
                >
                  <Users className="h-4 w-4" />
                  Employés
                </TabsTrigger>
                <TabsTrigger
                  value="fleet"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 transition-all duration-200"
                >
                  <Bus className="h-4 w-4" />
                  Flotte
                </TabsTrigger>
                <TabsTrigger
                  value="routes"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 transition-all duration-200"
                >
                  <Route className="h-4 w-4" />
                  Routes
                </TabsTrigger>
                <TabsTrigger
                  value="trips"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-700 transition-all duration-200"
                >
                  <Calendar className="h-4 w-4" />
                  Voyages
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
