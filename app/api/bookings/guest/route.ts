import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const guestBookingSchema = z.object({
  tripId: z.string(),
  passengerName: z.string().min(1, "Nom du passager requis"),
  passengerEmail: z.string().email("Email invalide"),
  passengerPhone: z.string().min(1, "Téléphone requis"),
  countryCode: z.string().default("+221"),
  numberOfSeats: z.number().min(1).max(10),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD"]),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = guestBookingSchema.parse(body);

    // Check if trip exists and has available seats
    const trip = await prisma.trip.findUnique({
      where: { id: validatedData.tripId },
      include: {
        company: true,
        bus: true,
        route: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Voyage non trouvé" }, { status: 404 });
    }

    // Vérifier si le voyage est disponible (SCHEDULED ou ACTIVE)
    if (trip.status !== "SCHEDULED" && trip.status !== "BOARDING") {
      return NextResponse.json(
        { error: "Ce voyage n'est plus disponible" },
        { status: 400 }
      );
    }

    if (trip.availableSeats < validatedData.numberOfSeats) {
      return NextResponse.json(
        { error: "Pas assez de places disponibles" },
        { status: 400 }
      );
    }

    // Generate unique reservation number
    const reservationNumber = `RES-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: reservationNumber,
        passengerName: validatedData.passengerName,
        passengerEmail: validatedData.passengerEmail,
        passengerPhone: validatedData.passengerPhone,
        tripId: validatedData.tripId,
        companyId: trip.companyId,
        seatNumbers: [], // Will be assigned later
        totalAmount: validatedData.totalAmount,
        status: "PENDING",
        paymentStatus:
          validatedData.paymentMethod === "CASH" ? "PENDING" : "PENDING",
        paymentMethod: validatedData.paymentMethod,
        emergencyContact: validatedData.emergencyContact || null,
        specialRequests: validatedData.specialRequests || null,
        userId: null, // Guest booking
      },
    });

    // Update available seats
    await prisma.trip.update({
      where: { id: validatedData.tripId },
      data: {
        availableSeats: {
          decrement: validatedData.numberOfSeats,
        },
      },
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: "RESERVATION_CREATED",
          description: `Nouvelle réservation invité: ${validatedData.passengerName} pour ${validatedData.numberOfSeats} place(s)`,
          metadata: {
            reservationId: reservation.id,
            tripId: validatedData.tripId,
            passengerEmail: validatedData.passengerEmail,
            numberOfSeats: validatedData.numberOfSeats,
            totalAmount: validatedData.totalAmount,
          },
          companyId: trip.companyId,
        },
      });
    } catch (logError) {
      console.warn("Failed to log reservation activity:", logError);
    }

    // Déterminer les villes de départ et d'arrivée
    const departureCity = trip.route?.departureLocation || "N/A";
    const arrivalCity = trip.route?.arrivalLocation || "N/A";

    return NextResponse.json({
      success: true,
      message: "Réservation créée avec succès",
      reservation: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        passengerName: reservation.passengerName,
        totalAmount: reservation.totalAmount,
        paymentMethod: reservation.paymentMethod,
        status: reservation.status,
      },
      trip: {
        departureCity: departureCity,
        arrivalCity: arrivalCity,
        departureTime: trip.departureTime,
        company: trip.company.name,
      },
    });
  } catch (error) {
    console.error("Guest booking error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
