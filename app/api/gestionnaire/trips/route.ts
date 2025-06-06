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
    const limit = searchParams.get("limit");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    const trips = await prisma.trip.findMany({
      where: {
        companyId,
        status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
      },
      include: {
        route: {
          include: {
            departure: true,
            arrival: true,
          },
        },
        bus: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
      take: limit ? Number.parseInt(limit) : undefined,
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Get gestionnaire trips error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
