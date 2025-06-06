import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get current month start and end
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get stats
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      pendingApprovals,
      totalTrips,
      totalRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      systemAlerts,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({
        where: { status: "ACTIVE" },
      }),

      // Total companies
      prisma.company.count(),

      // Pending approvals
      prisma.company.count({
        where: { status: "PENDING" },
      }),

      // Total trips
      prisma.trip.count(),

      // Total revenue
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),

      // Current month revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: currentMonthStart },
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
        },
        _sum: { amount: true },
      }),

      // System alerts
      prisma.systemAlert.count({
        where: { resolved: false },
      }),
    ]);

    // Calculate monthly growth
    const currentRevenue = currentMonthRevenue._sum.amount || 0;
    const lastRevenue = lastMonthRevenue._sum.amount || 0;
    const monthlyGrowth =
      lastRevenue > 0
        ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
        : 0;

    const stats = {
      totalUsers,
      activeUsers,
      totalCompanies,
      pendingApprovals,
      totalTrips,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyGrowth,
      systemAlerts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
