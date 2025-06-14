import { CardDescription } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bus, MapPin, Star, ArrowLeft, Globe } from "lucide-react";
import { TripCard } from "@/components/search/trip-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TripWithDetails } from "@/lib/types";

interface CompanyDetailsPageProps {
  params: {
    id: string;
  };
}

async function getCompanyDetails(companyId: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId, isActive: true },
      include: {
        trips: {
          where: {
            status: { in: ["SCHEDULED", "BOARDING"] }, // Only show active trips
            isArchived: false,
          },
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
                departureCoordinates: true,
                arrivalCoordinates: true,
              },
            },
            reservations: {
              select: {
                seatNumbers: true,
                status: true,
              },
              where: {
                status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
              },
            },
          },
          orderBy: {
            departureTime: "asc",
          },
        },
      },
    });

    if (!company) return null;

    // Calculate available seats for each trip
    const tripsWithAvailableSeats = company.trips.map((trip) => {
      const occupiedSeatsCount = trip.reservations.flatMap((res) =>
        res.status === "CONFIRMED" ||
        res.status === "CHECKED_IN" ||
        res.status === "PENDING"
          ? res.seatNumbers.map((s) => s.toString())
          : []
      ).length;
      const availableSeats = trip.bus.capacity - occupiedSeatsCount;
      return {
        ...trip,
        availableSeats: availableSeats,
      } as TripWithDetails;
    });

    return {
      ...company,
      trips: tripsWithAvailableSeats,
    };
  } catch (error) {
    console.error("Error fetching company details:", error);
    return null;
  }
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${
        i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
      }`}
    />
  ));
};

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const company = await getCompanyDetails(params.id);

  if (!company) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/client" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>

      <Card className="mx-auto max-w-5xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-800 text-white p-6 rounded-t-lg flex flex-col md:flex-row items-center gap-4">
          {company.logo && (
            <img
              src={company.logo || "/placeholder.svg"}
              alt={company.name}
              className="h-24 w-24 rounded-full border-4 border-white p-1 object-contain shadow-md"
            />
          )}
          <div className="text-center md:text-left">
            <CardTitle className="text-4xl font-extrabold">
              {company.name}
            </CardTitle>
            <CardDescription className="text-purple-100 text-lg mt-2">
              <MapPin className="inline-block mr-2 h-5 w-5" />
              {company.city}, {company.country}
              {company.commune && `, ${company.commune}`}
            </CardDescription>
            {company.rating && (
              <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                {renderStars(company.rating)}
                <span className="text-purple-100 text-sm">
                  ({company.rating.toFixed(1)} / 5)
                </span>
              </div>
            )}
            {company.website && (
              <Link
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200 hover:underline flex items-center justify-center md:justify-start mt-2"
              >
                <Globe className="mr-2 h-4 w-4" />
                Visiter le site web
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
              <Bus className="mr-3 h-6 w-6 text-purple-600" /> Voyages
              disponibles avec {company.name}
            </h2>
            <Separator className="mb-6" />
            <div className="space-y-4">
              {company.trips.length > 0 ? (
                company.trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Aucun voyage disponible pour cette entreprise pour le
                    moment.
                  </p>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
