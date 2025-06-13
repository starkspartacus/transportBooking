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
  Tv,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { type TripWithDetails } from "@/lib/types";
import { TripStatus } from "@prisma/client";

interface TripCardProps {
  trip: TripWithDetails;
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

  const formatTime = (dateTime: Date) => {
    return format(dateTime, "HH:mm");
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
    if (featureLower.includes("tv") || featureLower.includes("ecran"))
      return <Tv className="h-3 w-3" />;
    return <Bus className="h-3 w-3" />;
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.SCHEDULED:
        return "bg-green-100 text-green-800";
      case TripStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case TripStatus.DELAYED:
        return "bg-orange-100 text-orange-800";
      case TripStatus.IN_TRANSIT:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Ensure availableSeats is correctly calculated or provided by the API
  const availableSeats =
    trip.availableSeats !== undefined ? trip.availableSeats : trip.bus.capacity;

  const isBookable = trip.status === TripStatus.SCHEDULED && availableSeats > 0;

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
                    {trip.route.departureLocation}
                  </span>
                  <span className="text-gray-400 text-xl">→</span>
                  <span className="font-bold text-lg">
                    {trip.route.arrivalLocation}
                  </span>
                </div>
              </div>
              <Badge className={getStatusColor(trip.status)}>
                {trip.status === TripStatus.SCHEDULED
                  ? "Disponible"
                  : trip.status}
              </Badge>
            </div>

            {/* Company and Bus Info */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="font-medium">
                {trip.companyId}
              </Badge>
              <span className="text-sm text-gray-600">
                {trip.bus.plateNumber} {trip.bus.model}
              </span>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="font-medium">
                    {formatTime(trip.departureTime)}
                  </span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className="font-medium">
                    {formatTime(trip.arrivalTime)}
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
                  {availableSeats} / {trip.bus.capacity} places
                </span>
              </div>
            </div>

            {/* Features */}
            {trip.bus.features && trip.bus.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trip.bus.features
                  .slice(0, 5)
                  .map((feature: string, index: number) => (
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
            {availableSeats <= 5 && availableSeats > 0 && (
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Plus que {availableSeats} place{availableSeats > 1 ? "s" : ""}{" "}
                disponible
                {availableSeats > 1 ? "s" : ""} !
              </div>
            )}
          </div>

          {/* Price and Action */}
          <div className="flex flex-col items-end gap-4 min-w-[200px]">
            <div className="text-right">
              <div className="flex items-center gap-1 text-3xl font-bold text-green-600">
                <DollarSign className="h-6 w-6" />
                {formatPrice(trip.route.basePrice)}
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
                    {availableSeats === 0 ? "Complet" : "Non disponible"}
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
