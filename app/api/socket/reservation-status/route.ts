import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocket } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !["PATRON", "MANAGER", "CASHIER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.reservationId || !data.status) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Update reservation status
    const reservation = await prisma.reservation.update({
      where: { id: data.reservationId },
      data: { status: data.status },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    // Send notification via socket
    const io = getSocket();

    // Notify company staff
    if (reservation.trip.companyId) {
      io.to(`company:${reservation.trip.companyId}`).emit(
        "reservation-updated",
        {
          reservationId: reservation.id,
          reservationCode: reservation.reservationCode,
          status: reservation.status,
          tripId: reservation.tripId,
        }
      );
    }

    // Notify user if exists
    if (reservation.userId) {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          type:
            data.status === "CONFIRMED"
              ? "RESERVATION_CONFIRMED"
              : "RESERVATION_STATUS",
          title: "Réservation mise à jour",
          message: `Votre réservation ${reservation.reservationCode} est maintenant ${reservation.status}`,
          userId: reservation.userId,
          read: false,
          data: {
            reservationId: reservation.id,
            status: reservation.status,
            tripId: reservation.tripId,
          },
        },
      });

      // Send personal notification
      io.to(`user:${reservation.userId}`).emit("notification", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
        read: notification.read,
        data: notification.data,
      });

      // Send reservation update event
      io.to(`user:${reservation.userId}`).emit("reservation-updated", {
        reservationId: reservation.id,
        reservationCode: reservation.reservationCode,
        status: reservation.status,
        tripId: reservation.tripId,
      });
    }

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
