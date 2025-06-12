import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Get date range for the specified day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all payments for the day
    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        reservation: {
          include: {
            trip: {
              include: {
                route: true,
                bus: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get tickets sold directly (without reservation)
    const directTickets = await prisma.ticket.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        reservationId: null, // Direct sales
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalSales = payments.length + directTickets.length;
    const totalAmount =
      payments.reduce((sum, payment) => sum + payment.amount, 0) +
      directTickets.reduce((sum, ticket) => sum + ticket.price, 0);

    const cashSales =
      payments.filter((p) => p.method === "CASH").length + directTickets.length;
    const cardSales = payments.filter((p) => p.method === "CREDIT_CARD").length;
    const mobileSales = payments.filter(
      (p) => p.method === "MOBILE_MONEY"
    ).length;

    // Group sales by route
    const salesByRoute = new Map();

    payments.forEach((payment) => {
      if (payment.reservation?.trip?.route) {
        const routeName = `${payment.reservation.trip.route.departureLocation} → ${payment.reservation.trip.route.arrivalLocation}`;
        const existing = salesByRoute.get(routeName) || { count: 0, amount: 0 };
        salesByRoute.set(routeName, {
          count: existing.count + 1,
          amount: existing.amount + payment.amount,
        });
      }
    });

    directTickets.forEach((ticket) => {
      if (ticket.trip?.route) {
        const routeName = `${ticket.trip.route.departureLocation} → ${ticket.trip.route.arrivalLocation}`;
        const existing = salesByRoute.get(routeName) || { count: 0, amount: 0 };
        salesByRoute.set(routeName, {
          count: existing.count + 1,
          amount: existing.amount + ticket.price,
        });
      }
    });

    // Convert to array
    const routeStats = Array.from(salesByRoute.entries()).map(
      ([route, stats]) => ({
        route,
        ...stats,
      })
    );

    return NextResponse.json({
      date,
      totalSales,
      totalAmount,
      cashSales,
      cardSales,
      mobileSales,
      routeStats,
      transactions: [
        ...payments.map((p) => ({
          id: p.id,
          type: "payment",
          amount: p.amount,
          method: p.method,
          time: p.createdAt,
          customer: p.reservation?.passengerName || "N/A",
          route: p.reservation?.trip?.route
            ? `${p.reservation.trip.route.departureLocation} → ${p.reservation.trip.route.arrivalLocation}`
            : "N/A",
          reference: p.reference,
        })),
        ...directTickets.map((t) => ({
          id: t.id,
          type: "direct_ticket",
          amount: t.price,
          method: "CASH",
          time: t.createdAt,
          customer: t.passengerName,
          route: t.trip?.route
            ? `${t.trip.route.departureLocation} → ${t.trip.route.arrivalLocation}`
            : "N/A",
          reference: t.ticketNumber,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    });
  } catch (error) {
    console.error("Get daily sales error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
