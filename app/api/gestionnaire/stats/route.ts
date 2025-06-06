import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total trips
    const totalTrips = await prisma.trip.count({
      where: { companyId },
    });

    // Get active trips (scheduled, boarding, departed)
    const activeTrips = await prisma.trip.count({
      where: {
        companyId,
        status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
      },
    });

    // Get today's revenue
    const todayPayments = await prisma.payment.findMany({
      where: {
        ticket: { companyId },
        status: "COMPLETED",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalRevenue = todayPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Get total reservations
    const totalReservations = await prisma.reservation.count({
      where: { companyId },
    });

    // Get pending reservations
    const pendingReservations = await prisma.reservation.count({
      where: {
        companyId,
        status: "PENDING",
      },
    });

    // Get available buses
    const availableBuses = await prisma.bus.count({
      where: {
        companyId,
        isActive: true,
      },
    });

    // Get total routes
    const totalRoutes = await prisma.route.count({
      where: { companyId },
    });

    // Get today's departures
    const todayDepartures = await prisma.trip.count({
      where: {
        companyId,
        departureTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return NextResponse.json({
      totalTrips,
      activeTrips,
      totalRevenue,
      totalReservations,
      availableBuses,
      totalRoutes,
      todayDepartures,
      pendingReservations,
    });
  } catch (error) {
    console.error("Get gestionnaire stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
