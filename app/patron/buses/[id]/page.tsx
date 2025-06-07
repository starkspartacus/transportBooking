"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  BusIcon,
  Edit,
  ArrowLeft,
  Shield,
  Calendar,
  Wrench,
  Gauge,
  Palette,
  Fuel,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BusDetails {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  fuelType: string;
  status: string;
  totalKm: number;
  insuranceExpiry?: string;
  technicalInspectionExpiry?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  equipment: string[];
  company: {
    name: string;
  };
}

const EQUIPMENT_LABELS: Record<
  string,
  { name: string; icon: any; color: string }
> = {
  climatisation: { name: "Climatisation", icon: "❄️", color: "text-blue-500" },
  wifi: { name: "WiFi", icon: "📶", color: "text-purple-500" },
  usb: { name: "Chargement USB", icon: "🔌", color: "text-green-500" },
  divertissement: {
    name: "Divertissement",
    icon: "🎵",
    color: "text-orange-500",
  },
  sieges_inclinables: {
    name: "Sièges inclinables",
    icon: "🪑",
    color: "text-indigo-500",
  },
  toilettes: { name: "Toilettes", icon: "🚻", color: "text-teal-500" },
  compartiment_bagages: {
    name: "Compartiment bagages",
    icon: "🧳",
    color: "text-amber-500",
  },
  accessible_pmr: {
    name: "Accessible PMR",
    icon: "♿",
    color: "text-rose-500",
  },
};

export default function BusDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [bus, setBus] = useState<BusDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusDetails();
  }, [params.id]);

  const fetchBusDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/company/buses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setBus(data);
      } else {
        toast({
          title: "Erreur",
          description: "Bus non trouvé",
          variant: "destructive",
        });
        router.push("/patron/buses");
      }
    } catch (error) {
      console.error("Error fetching bus details:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des détails du bus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non défini";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "En service",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "MAINTENANCE":
        return {
          label: "En maintenance",
          icon: AlertTriangle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "OUT_OF_SERVICE":
        return {
          label: "Hors service",
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          label: status,
          icon: CheckCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des détails du bus...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <BusIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Bus non trouvé
            </h2>
            <p className="text-gray-600 mb-6">
              Le bus demandé n'existe pas ou a été supprimé.
            </p>
            <Button
              onClick={() => router.push("/patron/buses")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(bus.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/patron/buses")}
              className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BusIcon className="h-8 w-8 text-blue-600" />
                </div>
                {bus.plateNumber}
              </h1>
              <p className="text-gray-600 mt-1">{bus.company.name}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/patron/buses/${bus.id}/edit`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statut et informations de base */}
          <Card className="lg:col-span-2 shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BusIcon className="h-5 w-5 text-blue-600" />
                </div>
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Statut */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2",
                  statusInfo.bgColor,
                  statusInfo.borderColor
                )}
              >
                <StatusIcon className={cn("h-6 w-6", statusInfo.color)} />
                <div>
                  <p className="font-medium text-gray-800">Statut</p>
                  <p className={cn("text-sm font-semibold", statusInfo.color)}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>

              {/* Grille d'informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Marque</p>
                      <p className="font-semibold text-gray-800">{bus.brand}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <BusIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Modèle</p>
                      <p className="font-semibold text-gray-800">{bus.model}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Année</p>
                      <p className="font-semibold text-gray-800">{bus.year}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-sm text-gray-600">Capacité</p>
                      <p className="font-semibold text-gray-800">
                        {bus.capacity} places
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Palette className="h-5 w-5 text-pink-500" />
                    <div>
                      <p className="text-sm text-gray-600">Couleur</p>
                      <p className="font-semibold text-gray-800">{bus.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Fuel className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Carburant</p>
                      <p className="font-semibold text-gray-800">
                        {bus.fuelType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Kilométrage */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <Gauge className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Kilométrage total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bus.totalKm.toLocaleString()} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates importantes */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium text-blue-700">
                      Assurance
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(bus.insuranceExpiry)}
                  </p>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium text-orange-700">
                      Contrôle technique
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(bus.technicalInspectionExpiry)}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium text-green-700">
                      Dernière maintenance
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(bus.lastMaintenance)}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <p className="text-sm font-medium text-purple-700">
                      Prochaine maintenance
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(bus.nextMaintenance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Équipements */}
        {bus.equipment && bus.equipment.length > 0 && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                Équipements et services
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {bus.equipment.map((equipmentId) => {
                  const equipment = EQUIPMENT_LABELS[equipmentId];
                  if (!equipment) return null;

                  return (
                    <div
                      key={equipmentId}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                    >
                      <span className="text-2xl">{equipment.icon}</span>
                      <div>
                        <p className={cn("font-medium", equipment.color)}>
                          {equipment.name}
                        </p>
                        <p className="text-xs text-gray-500">Disponible</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
