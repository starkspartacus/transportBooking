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

    const userId = session.user.id;

    // Récupérer l'entreprise active ou utiliser toutes les entreprises
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    let whereClause: any = {};

    if (companyId) {
      // Vérifier que l'entreprise appartient au patron
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          ownerId: userId,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Entreprise non trouvée" },
          { status: 404 }
        );
      }

      whereClause = { companyId };
    } else {
      // Utiliser toutes les entreprises du patron
      const companies = await prisma.company.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const companyIds = companies.map((company) => company.id);
      whereClause = { companyId: { in: companyIds } };
    }

    // Get current month start and end
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get stats
    const [
      totalRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      totalTrips,
      activeTrips,
      totalEmployees,
      totalBuses,
      pendingReservations,
      totalSeats,
      occupiedSeats,
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          ticket: {
            ...whereClause,
          },
        },
        _sum: { amount: true },
      }),

      // Current month revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: currentMonthStart },
          ticket: {
            ...whereClause,
          },
        },
        _sum: { amount: true },
      }),

      // Last month revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
          ticket: {
            ...whereClause,
          },
        },
        _sum: { amount: true },
      }),

      // Total trips
      prisma.trip.count({
        where: whereClause,
      }),

      // Active trips
      prisma.trip.count({
        where: {
          ...whereClause,
          status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
        },
      }),

      // Total employees
      prisma.user.count({
        where: {
          ...whereClause,
          role: { in: ["GESTIONNAIRE", "CAISSIER"] },
        },
      }),

      // Total buses
      prisma.bus.count({
        where: whereClause,
      }),

      // Pending reservations
      prisma.reservation.count({
        where: {
          status: "PENDING",
          ...whereClause,
        },
      }),

      // Total seats for occupancy calculation
      prisma.trip.aggregate({
        where: {
          ...whereClause,
          departureTime: { gte: currentMonthStart },
        },
        _sum: {
          totalSeats: true,
        },
      }),

      // Occupied seats
      prisma.reservation.count({
        where: {
          status: { in: ["CONFIRMED", "PENDING"] },
          trip: {
            ...whereClause,
            departureTime: { gte: currentMonthStart },
          },
        },
      }),
    ]);

    // Calculate monthly growth
    const currentRevenue = currentMonthRevenue._sum.amount || 0;
    const lastRevenue = lastMonthRevenue._sum.amount || 0;
    const monthlyGrowth =
      lastRevenue > 0
        ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
        : 0;

    // Calculate occupancy rate
    const totalCapacity = totalSeats._sum.totalSeats || 0;
    const occupancyRate =
      totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

    const stats = {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTrips,
      activeTrips,
      totalEmployees,
      totalBuses,
      pendingReservations,
      monthlyGrowth,
      occupancyRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching patron stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
