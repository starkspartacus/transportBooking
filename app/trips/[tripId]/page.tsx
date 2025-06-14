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
  ArrowLeft,
} from "lucide-react";
import { WeatherDisplay } from "@/components/weather/weather-display";
import type { TripWithDetails, WeatherData, Coordinates } from "@/lib/types"; // Import Coordinates
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedRouteMap } from "@/components/trip/animated-route-map";
import { TripBookingSection } from "@/components/trip/trip-booking-section"; // Import the new component

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
            departureCoordinates: true, // Ensure departureCoordinates are fetched
            arrivalCoordinates: true, // Ensure arrivalCoordinates are fetched
          },
        },
        reservations: {
          // ADDED: Include reservations to get occupied seats
          select: {
            seatNumbers: true,
            status: true,
          },
          where: {
            status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] }, // Only active reservations
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

    // Calculate available seats based on current reservations
    const occupiedSeatsCount = trip.reservations.flatMap((res) =>
      res.status === "CONFIRMED" ||
      res.status === "CHECKED_IN" ||
      res.status === "PENDING"
        ? res.seatNumbers.map((s: number) => s.toString())
        : []
    ).length;
    const availableSeats = trip.bus.capacity - occupiedSeatsCount;

    return {
      ...trip,
      availableSeats: availableSeats, // Add calculated availableSeats
    } as TripWithDetails;
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

  const routeCoordinates: Coordinates[] = [];
  // Safely cast and add coordinates if they exist and are valid
  if (
    trip.route.departureCoordinates &&
    typeof trip.route.departureCoordinates === "object" &&
    "lat" in trip.route.departureCoordinates &&
    "lng" in trip.route.departureCoordinates
  ) {
    routeCoordinates.push(
      trip.route.departureCoordinates as unknown as Coordinates
    );
  }
  if (
    trip.route.arrivalCoordinates &&
    typeof trip.route.arrivalCoordinates === "object" &&
    "lat" in trip.route.arrivalCoordinates &&
    "lng" in trip.route.arrivalCoordinates
  ) {
    routeCoordinates.push(
      trip.route.arrivalCoordinates as unknown as Coordinates
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/search" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste des voyages
          </Button>
        </Link>
      </div>

      <Card className="mx-auto max-w-5xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <CardTitle className="text-4xl font-extrabold">
            Voyage de {trip.route.departureLocation} à{" "}
            {trip.route.arrivalLocation}
          </CardTitle>
          <CardDescription className="text-blue-100 text-lg mt-2">
            Avec {trip.company.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
          {/* Trip Info */}
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
                <Building2 className="mr-3 h-6 w-6 text-blue-600" />{" "}
                Informations sur la Compagnie
              </h2>
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg shadow-sm">
                {trip.company.logo && (
                  <img
                    src={trip.company.logo || "/placeholder.svg"}
                    alt={trip.company.name}
                    className="h-20 w-20 rounded-full border-2 border-blue-200 p-1 object-contain shadow-md"
                  />
                )}
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {trip.company.name}
                  </p>
                  {trip.company.rating && (
                    <p className="text-sm text-gray-600">
                      Note: {trip.company.rating.toFixed(1)} / 5
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
                <MapPin className="mr-3 h-6 w-6 text-blue-600" /> Itinéraire et
                Horaires
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                  <p className="text-sm text-blue-700 font-semibold">Départ</p>
                  <p className="text-xl font-bold text-gray-900">
                    {trip.route.departureLocation} (
                    {trip.route.departureCountry})
                  </p>
                  <p className="flex items-center text-base text-gray-700 mt-2">
                    <CalendarDays className="mr-2 h-5 w-5 text-blue-500" />
                    {departureDateTime.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="flex items-center text-base text-gray-700">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {departureDateTime.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                  <p className="text-sm text-green-700 font-semibold">
                    Arrivée
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {trip.route.arrivalLocation} ({trip.route.arrivalCountry})
                  </p>
                  <p className="flex items-center text-base text-gray-700 mt-2">
                    <CalendarDays className="mr-2 h-5 w-5 text-green-500" />
                    {arrivalDateTime.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="flex items-center text-base text-gray-700">
                    <Clock className="mr-2 h-5 w-5 text-green-500" />
                    {arrivalDateTime.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-lg text-gray-600">Durée Estimée du Voyage</p>
                <p className="text-3xl font-extrabold text-blue-700">
                  {trip.route.estimatedDuration} minutes
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
                <Bus className="mr-3 h-6 w-6 text-blue-600" /> Détails du Bus
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Modèle</p>
                  <p className="font-medium text-gray-900">
                    {trip.bus.brand} {trip.bus.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Immatriculation</p>
                  <p className="font-medium text-gray-900">
                    {trip.bus.plateNumber}
                  </p>
                </div>
                {/* Removed bus.type as it's not in schema */}
                <div>
                  <p className="text-sm text-gray-500">Sièges disponibles</p>
                  <p className="flex items-center font-medium text-gray-900">
                    <Users className="mr-2 h-5 w-5 text-blue-500" />{" "}
                    {trip.availableSeats} / {trip.bus.capacity}
                  </p>
                </div>
              </div>
              {trip.bus.features && trip.bus.features.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-lg font-semibold text-gray-800">
                    Fonctionnalités à bord :
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {trip.bus.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-4 py-2 text-base bg-blue-100 text-blue-800 rounded-full shadow-sm"
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
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
                <DollarSign className="mr-3 h-6 w-6 text-blue-600" />{" "}
                Tarification
              </h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 flex-grow">
                  <div>
                    <p className="text-sm text-gray-500">Prix de base</p>
                    <p className="text-xl font-medium text-gray-900">
                      {trip.basePrice.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prix actuel</p>
                    <p className="text-3xl font-extrabold text-green-700">
                      {trip.currentPrice.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  <TripBookingSection trip={trip} />
                </div>
              </div>
            </section>
          </div>

          {/* Weather & Map Info */}
          <div className="space-y-8 lg:col-span-1">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-800">Météo</h2>
              <div className="space-y-4">
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
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                Visualisation de l'itinéraire
              </h2>
              {routeCoordinates.length === 2 ? ( // Ensure both departure and arrival coordinates are present
                <AnimatedRouteMap
                  coordinates={routeCoordinates}
                  distance={trip.route.distance}
                  departureLocation={trip.route.departureLocation}
                  arrivalLocation={trip.route.arrivalLocation}
                />
              ) : (
                <Card className="w-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    Coordonnées de l'itinéraire non disponibles pour la
                    visualisation.
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
