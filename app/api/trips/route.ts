import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const departureDate = searchParams.get("departureDate");

    const whereClause: any = {
      company: {
        isActive: true,
        isVerified: true,
      },
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (departureDate) {
      const date = new Date(departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.departureTime = {
        gte: date,
        lt: nextDay,
      };
    }

    // Only show future trips for public API
    if (!companyId) {
      whereClause.departureTime = {
        gte: new Date(),
      };
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        route: {
          include: {
            departure: true,
            arrival: true,
          },
        },
        bus: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
