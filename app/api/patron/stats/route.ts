import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Get date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalRevenue,
      totalTrips,
      totalReservations,
      totalSeats,
      occupiedSeats,
    ] = await Promise.all([
      // Total revenue - Fixed: Use correct relation path
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          ticket: {
            trip: {
              companyId,
            },
          },
        },
      }),

      // Total trips
      prisma.trip.count({
        where: {
          companyId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Total reservations
      prisma.reservation.count({
        where: {
          companyId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Total seats available
      prisma.trip.aggregate({
        _sum: { availableSeats: true },
        where: {
          companyId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Occupied seats
      prisma.reservation.count({
        where: {
          companyId,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          trip: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      }),
    ]);

    // Calculate occupancy rate
    const totalSeatsCount = totalSeats._sum.availableSeats || 0;
    const occupancyRate =
      totalSeatsCount > 0 ? (occupiedSeats / totalSeatsCount) * 100 : 0;

    // Get recent trips
    const recentTrips = await prisma.trip.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        route: {
          include: {
            departure: { select: { name: true } },
            arrival: { select: { name: true } },
          },
        },
        bus: { select: { plateNumber: true } },
        _count: { select: { reservations: true } },
      },
    });

    const stats = {
      revenue: {
        total: totalRevenue._sum.amount || 0,
        currency: "XOF",
        change: 0, // TODO: Calculate change from previous month
      },
      trips: {
        total: totalTrips,
        completed: 0, // TODO: Count completed trips
        cancelled: 0, // TODO: Count cancelled trips
      },
      reservations: {
        total: totalReservations,
        confirmed: occupiedSeats,
        pending: 0, // TODO: Count pending reservations
      },
      occupancy: {
        rate: Math.round(occupancyRate),
        totalSeats: totalSeatsCount,
        occupiedSeats,
      },
      recentTrips: recentTrips.map((trip) => ({
        id: trip.id,
        route: `${trip.route.departure.name} → ${trip.route.arrival.name}`,
        departureTime: trip.departureTime.toISOString(),
        status: trip.status,
        bus: trip.bus.plateNumber,
        reservations: trip._count.reservations,
        availableSeats: trip.availableSeats,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching patron stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
