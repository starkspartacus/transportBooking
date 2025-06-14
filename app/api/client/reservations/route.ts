import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Ensure session and user ID exist
    if (!session?.user?.id) {
      console.warn(
        "Unauthorized access attempt to /api/client/reservations: No user ID in session."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: userId,
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: {
              select: {
                plateNumber: true,
                model: true,
                brand: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            qrCode: true,
            status: true,
            seatNumber: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Get client reservations error:", error);
    // Return more detailed error information in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
