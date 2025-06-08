"use client";

import { Suspense } from "react";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function BusEditForm({ busId }: { busId: string }) {
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
  };

  // Convertir les données pour correspondre à ce que VehicleForm attend
  const busData = {
    licensePlate: bus.plateNumber,
    brand: bus.brand,
    model: bus.model,
    year: bus.year.toString(),
    capacity: bus.capacity.toString(),
    color: bus.color,
    fuelType: bus.fuelType,
    type: "bus",
    description: bus.features.join(", "),
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/patron/buses/${busId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier le véhicule
          </h1>
          <p className="text-gray-600">
            {bus.plateNumber} - {bus.brand} {bus.model}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            initialData={busData}
            onSubmit={async (data) => {
              // Simuler une sauvegarde
              console.log("Données soumises:", data);
              return true;
            }}
            isLoading={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function BusEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BusEditForm busId={id} />
    </Suspense>
  );
}
