import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  Users,
  Bus,
  DollarSign,
  CalendarDays,
  Building2,
  Tv,
  Wifi,
  AirVent,
  Car,
  Luggage,
  Coffee,
} from "lucide-react";
import { WeatherDisplay } from "@/components/weather/weather-display";
import type { TripWithDetails, WeatherData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface TripDetailsPageProps {
  params: {
    tripId: string;
  };
}

async function getTripDetails(tripId: string): Promise<TripWithDetails | null> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            rating: true,
          },
        },
        bus: {
          select: {
            id: true,
            model: true,
            brand: true,
            features: true,
            capacity: true,
            plateNumber: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            distance: true,
            estimatedDuration: true,
            departureLocation: true,
            arrivalLocation: true,
            departureCountry: true,
            arrivalCountry: true,
            basePrice: true,
          },
        },
        _count: {
          select: {
            reservations: true,
            tickets: true,
          },
        },
      },
    });

    if (!trip) return null;

    return trip as TripWithDetails;
  } catch (error) {
    console.error("Error fetching trip details:", error);
    return null;
  }
}

async function getWeatherData(
  city: string,
  country: string
): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL
      }/api/weather?city=${encodeURIComponent(
        city
      )}&country=${encodeURIComponent(country)}`,
      {
        cache: "no-store", // Ensure fresh data
      }
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch weather for ${city}, ${country}:`,
        await response.text()
      );
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching weather for ${city}, ${country}:`, error);
    return null;
  }
}

const FeatureIcon = ({ feature }: { feature: string }) => {
  switch (feature.toLowerCase()) {
    case "tv":
      return <Tv className="mr-1 h-5 w-5 text-gray-600" />;
    case "wifi":
      return <Wifi className="mr-1 h-5 w-5 text-gray-600" />;
    case "climatisation":
      return <AirVent className="mr-1 h-5 w-5 text-gray-600" />;
    case "sièges inclinables":
      return <Car className="mr-1 h-5 w-5 text-gray-600" />;
    case "bagages":
      return <Luggage className="mr-1 h-5 w-5 text-gray-600" />;
    case "collation":
      return <Coffee className="mr-1 h-5 w-5 text-gray-600" />;
    default:
      return null;
  }
};

export default async function TripDetailsPage({
  params,
}: TripDetailsPageProps) {
  const trip = await getTripDetails(params.tripId);

  if (!trip) {
    notFound();
  }

  const departureWeather = await getWeatherData(
    trip.route.departureLocation,
    trip.route.departureCountry || ""
  );
  const arrivalWeather = await getWeatherData(
    trip.route.arrivalLocation,
    trip.route.arrivalCountry || ""
  );

  const departureDateTime = new Date(trip.departureTime);
  const arrivalDateTime = new Date(trip.arrivalTime);

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-5xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Détails du Voyage
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {trip.route.departureLocation} ({trip.route.departureCountry}){" "}
            <span className="mx-2">→</span> {trip.route.arrivalLocation} (
            {trip.route.arrivalCountry})
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Trip Info */}
          <div className="space-y-6 lg:col-span-2">
            <section>
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <Building2 className="mr-2 h-5 w-5" /> Informations sur la
                Compagnie
              </h2>
              <div className="flex items-center space-x-4">
                {trip.company.logo && (
                  <img
                    src={trip.company.logo || "/placeholder.svg"}
                    alt={trip.company.name}
                    className="h-16 w-16 rounded-full border p-1 object-contain"
                  />
                )}
                <p className="text-lg font-medium">{trip.company.name}</p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <MapPin className="mr-2 h-5 w-5" /> Itinéraire et Horaires
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Départ</p>
                  <p className="text-lg font-medium">
                    {trip.route.departureLocation} (
                    {trip.route.departureCountry})
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    {departureDateTime.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-1 h-4 w-4" />
                    {departureDateTime.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrivée</p>
                  <p className="text-lg font-medium">
                    {trip.route.arrivalLocation} ({trip.route.arrivalCountry})
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    {arrivalDateTime.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-1 h-4 w-4" />
                    {arrivalDateTime.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Durée Estimée</p>
                <p className="text-lg font-medium">
                  {trip.route.estimatedDuration} minutes
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <Bus className="mr-2 h-5 w-5" /> Détails du Bus
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Modèle</p>
                  <p className="font-medium">
                    {trip.bus.brand} {trip.bus.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Immatriculation</p>
                  <p className="font-medium">{trip.bus.plateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sièges disponibles</p>
                  <p className="flex items-center font-medium">
                    <Users className="mr-1 h-4 w-4" /> {trip.availableSeats} /{" "}
                    {trip.bus.capacity}
                  </p>
                </div>
              </div>
              {trip.bus.features && trip.bus.features.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-500">
                    Fonctionnalités :
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                </div>
              )}
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <DollarSign className="mr-2 h-5 w-5" /> Tarification
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Prix de base</p>
                  <p className="text-lg font-medium">
                    {trip.basePrice.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prix actuel</p>
                  <p className="text-2xl font-bold text-primary">
                    {trip.currentPrice.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Weather Info */}
          <div className="space-y-6 lg:col-span-1">
            <h2 className="mb-4 text-xl font-semibold">Météo</h2>
            {departureWeather ? (
              <WeatherDisplay weather={departureWeather} />
            ) : (
              <Card className="w-full">
                <CardContent className="p-6 text-center text-gray-500">
                  Météo de départ non disponible.
                </CardContent>
              </Card>
            )}
            {arrivalWeather ? (
              <WeatherDisplay weather={arrivalWeather} />
            ) : (
              <Card className="w-full">
                <CardContent className="p-6 text-center text-gray-500">
                  Météo d'arrivée non disponible.
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
