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
import { format, intervalToDuration } from "date-fns";
import { fr } from "date-fns/locale"; // Import French locale
import type { TripWithDetails } from "@/lib/types";
import { TripStatus } from "@prisma/client";
import { useState, useEffect } from "react";
import { Duration } from "date-fns";

interface TripCardProps {
  trip: TripWithDetails;
  showBookingButton?: boolean;
}

export default function TripCard({
  trip,
  showBookingButton = true,
}: TripCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<Duration | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const departure = new Date(trip.departureTime);

      if (trip.status === TripStatus.DEPARTING_SOON && departure > now) {
        setTimeRemaining(intervalToDuration({ start: now, end: departure }));
      } else {
        setTimeRemaining(null);
      }
    };

    calculateTimeRemaining(); // Initial calculation
    const timer = setInterval(calculateTimeRemaining, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, [trip.departureTime, trip.status]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : ""}`;
  };

  const formatDateTime = (dateTime: Date | string) => {
    const dateObj =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    return format(dateObj, "dd MMM yyyy HH:mm", { locale: fr });
  };

  const formatTime = (dateTime: Date | string) => {
    const dateObj =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    return format(dateObj, "HH:mm");
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
      case TripStatus.DEPARTING_SOON:
        return "bg-yellow-100 text-yellow-800"; // New color for departing soon
      case TripStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case TripStatus.DELAYED:
        return "bg-orange-100 text-orange-800";
      case TripStatus.IN_TRANSIT:
        return "bg-blue-100 text-blue-800";
      case TripStatus.DEPARTED:
        return "bg-gray-100 text-gray-800"; // Color for departed trips
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case TripStatus.SCHEDULED:
        return "Disponible";
      case TripStatus.DEPARTING_SOON:
        return "Départ Bientôt";
      case TripStatus.CANCELLED:
        return "Annulé";
      case TripStatus.DELAYED:
        return "Retardé";
      case TripStatus.IN_TRANSIT:
        return "En Transit";
      case TripStatus.DEPARTED:
        return "Parti";
      case TripStatus.ARRIVED:
        return "Arrivé";
      case TripStatus.COMPLETED:
        return "Terminé";
      default:
        return status;
    }
  };

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
                {getStatusText(trip.status)}
              </Badge>
            </div>

            {/* Company and Bus Info */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="font-medium">
                {trip.company.name} {/* Display company name */}
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
                    {formatTime(trip.departureTime)} -{" "}
                    {formatTime(trip.arrivalTime)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Départ: {formatDateTime(trip.departureTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Arrivée: {formatDateTime(trip.arrivalTime)}</span>
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

            {/* Availability Warning / Departing Soon Countdown */}
            {trip.status === TripStatus.DEPARTING_SOON && timeRemaining && (
              <div className="flex items-center gap-2 text-yellow-700 text-sm font-semibold">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                Départ dans:{" "}
                {timeRemaining.hours ? `${timeRemaining.hours}h ` : ""}
                {timeRemaining.minutes ? `${timeRemaining.minutes}m ` : ""}
                {timeRemaining.seconds ? `${timeRemaining.seconds}s` : ""}
              </div>
            )}
            {availableSeats <= 5 &&
              availableSeats > 0 &&
              trip.status === TripStatus.SCHEDULED && (
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  Plus que {availableSeats} place{availableSeats > 1 ? "s" : ""}{" "}
                  disponible
                  {availableSeats > 1 ? "s" : ""} !
                </div>
              )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>
                {availableSeats} / {trip.bus.capacity} places
              </span>
            </div>
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
                    {availableSeats === 0
                      ? "Complet"
                      : getStatusText(trip.status)}
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
