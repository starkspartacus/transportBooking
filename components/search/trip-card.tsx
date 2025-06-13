"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Users,
  Tv,
  Wifi,
  AirVent,
  Car,
  Luggage,
  Coffee,
} from "lucide-react";
import { type TripWithDetails } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TripCardProps {
  trip: TripWithDetails;
}

const FeatureIcon = ({ feature }: { feature: string }) => {
  switch (feature.toLowerCase()) {
    case "tv":
      return <Tv className="mr-1 h-4 w-4" />;
    case "wifi":
      return <Wifi className="mr-1 h-4 w-4" />;
    case "climatisation":
      return <AirVent className="mr-1 h-4 w-4" />;
    case "sièges inclinables":
      return <Car className="mr-1 h-4 w-4" />; // Placeholder, consider better icon
    case "bagages":
      return <Luggage className="mr-1 h-4 w-4" />;
    case "collation":
      return <Coffee className="mr-1 h-4 w-4" />;
    default:
      return null;
  }
};

export function TripCard({ trip }: TripCardProps) {
  const departureTime = new Date(trip.departureTime);
  const arrivalTime = new Date(trip.arrivalTime);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isDepartingSoon, setIsDepartingSoon] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = departureTime.getTime() - now.getTime();

      if (diff > 0 && diff <= 40 * 60 * 1000) {
        // 40 minutes
        setIsDepartingSoon(true);
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setIsDepartingSoon(false);
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [departureTime]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline">Programmé</Badge>;
      case "BOARDING":
        return <Badge className="bg-blue-500 text-white">Embarquement</Badge>;
      case "DEPARTING_SOON":
        return (
          <Badge className="bg-indigo-500 text-white">Départ Bientôt</Badge>
        );
      case "DEPARTED":
        return <Badge className="bg-yellow-500 text-white">Parti</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-purple-500 text-white">En Transit</Badge>;
      case "ARRIVED":
        return <Badge className="bg-gray-500 text-white">Arrivé</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Annulé</Badge>;
      case "DELAYED":
        return <Badge className="bg-orange-500 text-white">Retardé</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-700 text-white">Terminé</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-red-700 text-white">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary" />
            <div className="text-xl font-semibold text-gray-800">
              {trip.route.departureLocation} <span className="mx-1">→</span>{" "}
              {trip.route.arrivalLocation}
            </div>
          </div>
          <div className="flex flex-col items-end">
            {isDepartingSoon && timeLeft ? (
              <Badge className="mb-1 bg-indigo-600 text-white">
                Départ dans {timeLeft}
              </Badge>
            ) : (
              getStatusBadge(trip.status)
            )}
            <div className="text-2xl font-bold text-green-600">
              {trip.currentPrice.toLocaleString()} FCFA
            </div>
            <p className="text-sm text-gray-500">par personne</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              Départ:{" "}
              {departureTime.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              à{" "}
              {departureTime.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              Arrivée:{" "}
              {arrivalTime.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              à{" "}
              {arrivalTime.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>{trip.availableSeats} places disponibles</span>
          </div>
          <div className="flex items-center">
            <img
              src={
                trip.company.logo ||
                "/placeholder.svg?height=20&width=20&text=Logo"
              }
              alt={trip.company.name}
              className="mr-2 h-5 w-5 rounded-full object-contain"
            />
            <span>{trip.company.name}</span>
          </div>
        </div>

        {trip.bus.features && trip.bus.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {trip.bus.features.map((feature, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <FeatureIcon feature={feature} />
                {feature}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Link href={`/trips/${trip.id}`} passHref>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              Détails
            </Button>
          </Link>
          <Link href={`/booking/${trip.id}`} passHref>
            <Button className="bg-primary text-white hover:bg-primary/90">
              Réserver maintenant
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
