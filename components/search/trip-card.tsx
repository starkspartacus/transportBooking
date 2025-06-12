"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  DollarSign,
  Bus,
  Wifi,
  Zap,
  Coffee,
  Music,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Trip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  bus: {
    id: string;
    model: string;
    brand?: string;
    features: string[];
  };
  route: {
    id: string;
    name: string;
    distance: number;
    estimatedDuration: number;
  };
}

interface TripCardProps {
  trip: Trip;
  showBookingButton?: boolean;
}

export default function TripCard({
  trip,
  showBookingButton = true,
}: TripCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : ""}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes("wifi")) return <Wifi className="h-3 w-3" />;
    if (featureLower.includes("usb") || featureLower.includes("charge"))
      return <Zap className="h-3 w-3" />;
    if (featureLower.includes("cafe") || featureLower.includes("snack"))
      return <Coffee className="h-3 w-3" />;
    if (featureLower.includes("music") || featureLower.includes("audio"))
      return <Music className="h-3 w-3" />;
    return <Bus className="h-3 w-3" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const isBookable = trip.status === "ACTIVE" && trip.availableSeats > 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Trip Info */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-lg">
                    {trip.departureCity}
                  </span>
                  <span className="text-gray-400 text-xl">→</span>
                  <span className="font-bold text-lg">{trip.arrivalCity}</span>
                </div>
              </div>
              <Badge className={getStatusColor(trip.status)}>
                {trip.status === "ACTIVE" ? "Disponible" : trip.status}
              </Badge>
            </div>

            {/* Company and Bus Info */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="font-medium">
                {trip.company.name}
              </Badge>
              <span className="text-sm text-gray-600">
                {trip.bus.brand} {trip.bus.model}
              </span>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="font-medium">
                    {format(
                      new Date(`2000-01-01T${trip.departureTime}`),
                      "HH:mm"
                    )}
                  </span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className="font-medium">
                    {format(
                      new Date(`2000-01-01T${trip.arrivalTime}`),
                      "HH:mm"
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  Durée: {formatDuration(trip.route.estimatedDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>
                  {trip.availableSeats} / {trip.totalSeats} places
                </span>
              </div>
            </div>

            {/* Features */}
            {trip.bus.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trip.bus.features.slice(0, 5).map((feature, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    {getFeatureIcon(feature)}
                    {feature}
                  </Badge>
                ))}
                {trip.bus.features.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{trip.bus.features.length - 5} autres
                  </Badge>
                )}
              </div>
            )}

            {/* Availability Warning */}
            {trip.availableSeats <= 5 && trip.availableSeats > 0 && (
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Plus que {trip.availableSeats} place
                {trip.availableSeats > 1 ? "s" : ""} disponible
                {trip.availableSeats > 1 ? "s" : ""} !
              </div>
            )}
          </div>

          {/* Price and Action */}
          <div className="flex flex-col items-end gap-4 min-w-[200px]">
            <div className="text-right">
              <div className="flex items-center gap-1 text-3xl font-bold text-green-600">
                <DollarSign className="h-6 w-6" />
                {formatPrice(trip.price)}
              </div>
              <p className="text-sm text-gray-500">FCFA par personne</p>
              {trip.route.distance && (
                <p className="text-xs text-gray-400">
                  {trip.route.distance} km
                </p>
              )}
            </div>

            {showBookingButton && (
              <div className="w-full">
                {isBookable ? (
                  <Link href={`/booking/${trip.id}`} className="block">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300"
                      size="lg"
                    >
                      Réserver maintenant
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full" size="lg">
                    {trip.availableSeats === 0 ? "Complet" : "Non disponible"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
