import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer tous les voyages d'une entreprise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
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

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const trips = await prisma.trip.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            departure: true,
            arrival: true,
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
    console.error("Error fetching trips:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un nouveau voyage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validation des données
    const requiredFields = [
      "routeId",
      "busId",
      "departureTime",
      "arrivalTime",
      "basePrice",
      "companyId",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: data.companyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la route et le bus appartiennent à l'entreprise
    const [route, bus] = await Promise.all([
      prisma.route.findFirst({
        where: {
          id: data.routeId,
          companyId: data.companyId,
        },
      }),
      prisma.bus.findFirst({
        where: {
          id: data.busId,
          companyId: data.companyId,
        },
      }),
    ]);

    if (!route) {
      return NextResponse.json({ error: "Route non trouvée" }, { status: 404 });
    }

    if (!bus) {
      return NextResponse.json({ error: "Bus non trouvé" }, { status: 404 });
    }

    // Vérifier la disponibilité du bus
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        busId: data.busId,
        status: {
          in: ["SCHEDULED", "BOARDING", "DEPARTED"],
        },
        OR: [
          {
            AND: [
              { departureTime: { lte: new Date(data.departureTime) } },
              { arrivalTime: { gte: new Date(data.departureTime) } },
            ],
          },
          {
            AND: [
              { departureTime: { lte: new Date(data.arrivalTime) } },
              { arrivalTime: { gte: new Date(data.arrivalTime) } },
            ],
          },
        ],
      },
    });

    if (conflictingTrip) {
      return NextResponse.json(
        { error: "Ce bus n'est pas disponible à ces horaires" },
        { status: 400 }
      );
    }

    // Créer le voyage
    const trip = await prisma.trip.create({
      data: {
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        basePrice: Number.parseFloat(data.basePrice),
        currentPrice: Number.parseFloat(data.currentPrice || data.basePrice),
        availableSeats: data.availableSeats || bus.capacity,
        status: "SCHEDULED",
        route: {
          connect: { id: data.routeId },
        },
        bus: {
          connect: { id: data.busId },
        },
        company: {
          connect: { id: data.companyId },
        },
      },
      include: {
        route: true,
        bus: true,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "TRIP_CREATED",
        description: `Voyage ${route.name} programmé pour le ${new Date(
          data.departureTime
        ).toLocaleDateString()}`,
        status: "SUCCESS",
        user: {
          connect: { id: session.user.id },
        },
        company: {
          connect: { id: data.companyId },
        },
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
