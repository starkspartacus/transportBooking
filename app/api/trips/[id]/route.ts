import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        bus: {
          select: {
            id: true,
            model: true,
            brand: true,
            features: true,
            capacity: true, // Ensure capacity is selected for available seats calculation
            plateNumber: true, // Ensure plateNumber is selected
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
            departureCoordinates: true, // Changed from coordinates
            arrivalCoordinates: true, // Added
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

    if (!trip) {
      return NextResponse.json({ error: "Voyage non trouvé" }, { status: 404 });
    }

    // Ensure we have departure and arrival cities/countries
    const tripData = {
      ...trip,
      departureCity: trip.route?.departureLocation || "",
      arrivalCity: trip.route?.arrivalLocation || "",
      departureCountry: trip.route?.departureCountry || "",
      arrivalCountry: trip.route?.arrivalCountry || "",
    };

    return NextResponse.json({ trip: tripData });
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
