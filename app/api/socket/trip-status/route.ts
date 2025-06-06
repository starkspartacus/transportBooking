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
    if (!data.tripId || !data.status) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Update trip status
    const trip = await prisma.trip.update({
      where: { id: data.tripId },
      data: { status: data.status },
      include: {
        route: true,
        reservations: {
          include: {
            user: true,
          },
        },
      },
    });

    // Send notification via socket
    const io = getSocket();

    // Broadcast to all clients
    io.emit("trip-status-updated", {
      tripId: trip.id,
      status: trip.status,
      route: `${trip.route.departureLocation} - ${trip.route.arrivalLocation}`,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
    });

    // Notify users with reservations for this trip
    for (const reservation of trip.reservations) {
      if (reservation.userId) {
        // Create notification in database
        const notification = await prisma.notification.create({
          data: {
            type: "TRIP_STATUS",
            title: "Statut du voyage mis à jour",
            message: `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} est maintenant ${trip.status}`,
            userId: reservation.userId,
            read: false,
            data: {
              tripId: trip.id,
              status: trip.status,
              reservationId: reservation.id,
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
      }
    }

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        status: trip.status,
      },
    });
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
