import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les voyages disponibles pour un caissier
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CAISSIER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    // A cashier can only see trips for their assigned company
    if (session.user.companyId !== companyId) {
      return NextResponse.json(
        { error: "Accès refusé à cette entreprise" },
        { status: 403 }
      );
    }

    // Fetch trips that are currently scheduled or boarding, and not archived
    const trips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
        status: {
          in: [
            "SCHEDULED",
            "BOARDING",
            "DELAYED",
            "ARRIVED",
            "CANCELLED",
            "COMPLETED",
            "DEPARTED",
            "IN_TRANSIT",
            "MAINTENANCE",
          ], // Include trips that are active
        },
        isArchived: false, // Do not show archived trips
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            departureLocation: true,
            arrivalLocation: true,
            basePrice: true, // Crucially include basePrice from route
            estimatedDuration: true,
          },
        },
        bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            reservations: true,
            tickets: true,
          },
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Error fetching cashier trips:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
