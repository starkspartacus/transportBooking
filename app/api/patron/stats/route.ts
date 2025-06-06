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
          reservation: {
            trip: {
              companyId,
            },
          },
        },
        _sum: { amount: true },
      }),

      // Current month revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: currentMonthStart },
          reservation: {
            trip: {
              companyId,
            },
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
          reservation: {
            trip: {
              companyId,
            },
          },
        },
        _sum: { amount: true },
      }),

      // Total trips
      prisma.trip.count({
        where: { companyId },
      }),

      // Active trips
      prisma.trip.count({
        where: {
          companyId,
          status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
        },
      }),

      // Total employees
      prisma.user.count({
        where: {
          companyId,
          role: { in: ["MANAGER", "CASHIER"] },
        },
      }),

      // Total buses
      prisma.bus.count({
        where: { companyId },
      }),

      // Pending reservations
      prisma.reservation.count({
        where: {
          status: "PENDING",
          trip: { companyId },
        },
      }),

      // Total seats for occupancy calculation
      prisma.trip.aggregate({
        where: {
          companyId,
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
            companyId,
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
