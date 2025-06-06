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
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    const whereClause: any = { companyId };

    if (status) {
      whereClause.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        trip: {
          include: {
            route: {
              include: {
                departure: true,
                arrival: true,
              },
            },
          },
        },
        seat: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit ? Number.parseInt(limit) : undefined,
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Get gestionnaire reservations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
