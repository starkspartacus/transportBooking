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
    const companyId = searchParams.get("companyId") || session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Get today's and upcoming trips
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trips = await prisma.trip.findMany({
      where: {
        companyId,
        departureTime: {
          gte: today,
        },
        status: {
          in: ["SCHEDULED", "BOARDING", "IN_TRANSIT"],
        },
      },
      include: {
        route: true,
        bus: true,
        reservations: {
          include: {
            user: true,
            payments: true,
          },
        },
        tickets: true,
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    // Calculate trip statistics
    const tripsWithStats = trips.map((trip) => {
      const totalSeats = trip.bus.capacity;
      const reservedSeats = trip.reservations.reduce(
        (sum: number, r) => sum + r.seatNumbers.length,
        0
      );
      const paidReservations = trip.reservations.filter((r) =>
        r.payments.some((p) => p.status === "COMPLETED")
      ).length;
      const pendingReservations = trip.reservations.filter(
        (r) => !r.payments.some((p) => p.status === "COMPLETED")
      ).length;
      const availableSeats = totalSeats - reservedSeats;
      const revenue = trip.reservations
        .filter((r) => r.payments.some((p) => p.status === "COMPLETED"))
        .reduce((sum: number, r) => sum + r.totalAmount, 0);

      return {
        ...trip,
        stats: {
          totalSeats,
          reservedSeats,
          availableSeats,
          paidReservations,
          pendingReservations,
          revenue,
          occupancyRate: Math.round((reservedSeats / totalSeats) * 100),
        },
      };
    });

    return NextResponse.json(tripsWithStats);
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
