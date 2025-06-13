import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocketIO } from "@/lib/socket";
import { TripStatus, NotificationType, ActivityStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const now = new Date();
    const io = getSocketIO();
    let updatedCount = 0;

    // Function to log activity and emit socket event
    const updateTripStatus = async (
      trip: any,
      newStatus: TripStatus,
      notificationTitle: string,
      notificationMessage: string
    ) => {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: newStatus },
      });
      updatedCount++;

      // Log activity
      await prisma.activity.create({
        data: {
          type: "TRIP_UPDATED",
          description: `Statut du voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} mis à jour : ${newStatus}.`,
          status: ActivityStatus.SUCCESS,
          userId: session.user.id,
          companyId: companyId,
        },
      });

      // Emit socket event for all relevant dashboards
      if (io) {
        io.to(`company-${companyId}`).emit("trip-status-updated", {
          tripId: trip.id,
          status: newStatus,
          route: `${trip.route.departureLocation} - ${trip.route.arrivalLocation}`,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
        });
      }

      // Notify users with reservations for this trip
      for (const reservation of trip.reservations) {
        if (reservation.userId) {
          const notification = await prisma.notification.create({
            data: {
              type: NotificationType.TRIP_STATUS,
              title: notificationTitle,
              message: notificationMessage,
              userId: reservation.userId,
              isRead: false,
              metadata: {
                tripId: trip.id,
                status: newStatus,
                reservationId: reservation.id,
              },
            },
          });
          if (io) {
            io.to(`user-${reservation.userId}`).emit(
              "notification",
              notification
            );
          }
        }
      }
    };

    // 1. Update SCHEDULED to BOARDING
    const scheduledToBoardingTrips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: TripStatus.SCHEDULED,
        boardingStartTime: {
          lte: now,
        },
      },
      include: {
        route: true,
        reservations: { include: { user: true } },
      },
    });

    for (const trip of scheduledToBoardingTrips) {
      await updateTripStatus(
        trip,
        TripStatus.BOARDING,
        "Embarquement imminent",
        `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} est maintenant en phase d'embarquement.`
      );
    }

    // 2. Update BOARDING to DEPARTED
    const boardingToDepartedTrips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: TripStatus.BOARDING,
        departureTime: {
          lte: now,
        },
      },
      include: {
        route: true,
        reservations: { include: { user: true } },
      },
    });

    for (const trip of boardingToDepartedTrips) {
      await updateTripStatus(
        trip,
        TripStatus.DEPARTED,
        "Voyage en cours",
        `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} est maintenant parti.`
      );
    }

    // 3. Update DEPARTED to IN_TRANSIT
    const departedToInTransitTrips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: TripStatus.DEPARTED,
        arrivalTime: {
          lte: now,
        },
      },
      include: {
        route: true,
        reservations: { include: { user: true } },
      },
    });

    for (const trip of departedToInTransitTrips) {
      await updateTripStatus(
        trip,
        TripStatus.IN_TRANSIT,
        "Voyage en cours",
        `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} est en cours.`
      );
    }

    // 4. Update IN_TRANSIT to ARRIVED
    const inTransitToArrivedTrips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: TripStatus.IN_TRANSIT,
        arrivalTime: {
          lte: now,
        },
      },
      include: {
        route: true,
        reservations: { include: { user: true } },
      },
    });

    for (const trip of inTransitToArrivedTrips) {
      await updateTripStatus(
        trip,
        TripStatus.ARRIVED,
        "Voyage terminé",
        `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} est maintenant arrivé.`
      );
    }

    // 5. Update ARRIVED to COMPLETED
    const arrivedToCompletedTrips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: TripStatus.ARRIVED,
        arrivalTime: {
          lt: now,
        },
        isArchived: false,
      },
      include: {
        route: true,
        reservations: { include: { user: true } },
      },
    });

    for (const trip of arrivedToCompletedTrips) {
      await updateTripStatus(
        trip,
        TripStatus.COMPLETED,
        "Voyage finalisé",
        `Votre voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} a été finalisé.`
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} voyages mis à jour.`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error checking and updating trip statuses:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const now = new Date();
    const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60 * 1000);

    // 1. Update SCHEDULED trips to DEPARTING_SOON
    const departingSoonTrips = await prisma.trip.updateMany({
      where: {
        status: TripStatus.SCHEDULED,
        departureTime: {
          lte: fortyMinutesFromNow, // Within 40 minutes from now
          gte: now, // Not yet departed
        },
      },
      data: {
        status: TripStatus.DEPARTING_SOON,
      },
    });

    // 2. Update DEPARTING_SOON or SCHEDULED trips to DEPARTED if departure time has passed
    const departedTrips = await prisma.trip.updateMany({
      where: {
        status: {
          in: [TripStatus.SCHEDULED, TripStatus.DEPARTING_SOON],
        },
        departureTime: {
          lte: now, // Departure time has passed
        },
      },
      data: {
        status: TripStatus.DEPARTED,
      },
    });

    console.log(
      `Trip status update: ${departingSoonTrips.count} trips set to DEPARTING_SOON, ${departedTrips.count} trips set to DEPARTED.`
    );

    return NextResponse.json({
      message: "Trip statuses updated successfully",
      departingSoonCount: departingSoonTrips.count,
      departedCount: departedTrips.count,
    });
  } catch (error) {
    console.error("Error updating trip statuses:", error);
    return NextResponse.json(
      { error: "Failed to update trip statuses" },
      { status: 500 }
    );
  }
}
