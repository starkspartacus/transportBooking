import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Fuel,
  Palette,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function BusDetails({ busId }: { busId: string }) {
  // Simuler la récupération des données du bus
  const bus = {
    id: busId,
    plateNumber: "DK-1234-AB",
    brand: "Mercedes",
    model: "Sprinter 515",
    year: 2022,
    capacity: 22,
    fuelType: "Diesel",
    color: "Blanc",
    status: "ACTIVE",
    purchaseDate: "2022-03-15",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-07-15",
    mileage: 45000,
    features: ["Climatisation", "WiFi", "Prises USB", "Sièges inclinables"],
    company: {
      name: "Transport Express",
      id: "company-1",
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif";
      case "MAINTENANCE":
        return "En maintenance";
      case "INACTIVE":
        return "Inactif";
      default:
        return "Inconnu";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patron/buses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {bus.plateNumber}
            </h1>
            <p className="text-gray-600">
              {bus.brand} {bus.model} ({bus.year})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(bus.status)}>
            {getStatusText(bus.status)}
          </Badge>
          <Link href={`/patron/buses/${busId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Numéro de plaque
                </label>
                <p className="text-lg font-semibold">{bus.plateNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Capacité
                </label>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {bus.capacity} passagers
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Marque
                </label>
                <p className="text-lg font-semibold">{bus.brand}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Modèle
                </label>
                <p className="text-lg font-semibold">{bus.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Année
                </label>
                <p className="text-lg font-semibold">{bus.year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Kilométrage
                </label>
                <p className="text-lg font-semibold">
                  {bus.mileage.toLocaleString()} km
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Carburant
                </label>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Fuel className="h-4 w-4" />
                  {bus.fuelType}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Couleur
                </label>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  {bus.color}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Date d'achat
              </label>
              <p className="text-lg font-semibold">
                {new Date(bus.purchaseDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">
                Dernière maintenance
              </label>
              <p className="text-lg font-semibold text-green-600">
                {new Date(bus.lastMaintenance).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">
                Prochaine maintenance
              </label>
              <p className="text-lg font-semibold text-orange-600">
                {new Date(bus.nextMaintenance).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Équipements */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Équipements et options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bus.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function BusDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BusDetails busId={id} />
    </Suspense>
  );
}
