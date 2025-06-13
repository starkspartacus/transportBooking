import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocketIO } from "@/lib/socket";

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

    // Find trips that have already arrived and are not yet archived
    const tripsToArchive = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        arrivalTime: {
          lt: now, // Arrival time is in the past
        },
        status: {
          in: ["ARRIVED", "COMPLETED"], // Only archive arrived/completed trips
        },
        isArchived: false,
      },
      include: {
        route: true, // Include route for activity log description
      },
    });

    if (tripsToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun voyage à archiver.",
        updatedCount: 0,
      });
    }

    let updatedCount = 0;
    for (const trip of tripsToArchive) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          isArchived: true,
          status: "COMPLETED", // Ensure status is COMPLETED upon archiving
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: "TRIP_ARCHIVED",
          metadata: {
            tripId: trip.id,
            routeId: trip.route.id,
            busId: trip.busId,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            status: "COMPLETED",
            isArchived: true,
          },
          description: `Voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation} archivé.`,
          status: "SUCCESS",
          userId: session.user.id,
          companyId: companyId,
        },
      });
      updatedCount++;

      // Emit socket event for archiving
      const io = getSocketIO();
      if (io) {
        io.to(`company-${companyId}`).emit("trip-status-updated", {
          tripId: trip.id,
          status: "COMPLETED",
          isArchived: true,
          route: `${trip.route.departureLocation} - ${trip.route.arrivalLocation}`,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} voyages archivés avec succès.`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error archiving past trips:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
