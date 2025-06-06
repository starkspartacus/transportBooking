import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const reservationId = params.id;

    // Get reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        trip: {
          include: {
            company: true,
          },
        },
        ticket: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user owns this reservation
    if (reservation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if reservation can be cancelled
    if (
      reservation.status !== "PENDING" &&
      reservation.status !== "CONFIRMED"
    ) {
      return NextResponse.json(
        { error: "Cette réservation ne peut pas être annulée" },
        { status: 400 }
      );
    }

    // Check if trip allows cancellation (this would be based on company settings)
    const now = new Date();
    const departureTime = new Date(reservation.trip.departureTime);
    const hoursUntilDeparture =
      (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Example: Allow cancellation up to 2 hours before departure
    if (hoursUntilDeparture < 2) {
      return NextResponse.json(
        { error: "Annulation impossible : moins de 2 heures avant le départ" },
        { status: 400 }
      );
    }

    // Cancel reservation and related entities
    await prisma.$transaction(async (tx) => {
      // Update reservation status
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });

      // Cancel ticket if exists
      if (reservation.ticket) {
        await tx.ticket.update({
          where: { id: reservation.ticket.id },
          data: { status: "CANCELLED" },
        });
      }

      // Increase available seats
      await tx.trip.update({
        where: { id: reservation.tripId },
        data: {
          availableSeats: { increment: 1 },
        },
      });
    });

    return NextResponse.json({ message: "Réservation annulée avec succès" });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
