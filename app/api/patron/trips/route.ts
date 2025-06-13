import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocketIO } from "@/lib/socket"; // Updated import

// GET - Récupérer tous les voyages d'une entreprise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const includeArchived = searchParams.get("includeArchived") === "true";

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
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const whereClause: any = {
      companyId: companyId,
    };

    if (!includeArchived) {
      whereClause.isArchived = false;
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        route: {
          select: {
            id: true,
            name: true,
            departureLocation: true,
            arrivalLocation: true,
            distance: true,
            estimatedDuration: true,
            basePrice: true, // Ensure price is included
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
        departureTime: "desc",
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
        { error: "Entreprise non trouvée ou non autorisée" },
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
      return NextResponse.json(
        {
          error: "Route non trouvée ou n'appartient pas à votre entreprise",
        },
        { status: 404 }
      );
    }

    if (!bus) {
      return NextResponse.json(
        {
          error: "Bus non trouvé ou n'appartient pas à votre entreprise",
        },
        { status: 404 }
      );
    }

    // Vérifier la disponibilité du bus
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        busId: data.busId,
        companyId: data.companyId,
        status: {
          in: [
            "SCHEDULED",
            "BOARDING",
            "DELAYED",
            "IN_TRANSIT",
            "ARRIVED",
            "COMPLETED",
            "MAINTENANCE",
          ], // Only consider active trips that might conflict
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
          {
            // Check if a trip starts during the new trip
            AND: [
              { departureTime: { gte: new Date(data.departureTime) } },
              { departureTime: { lte: new Date(data.arrivalTime) } },
            ],
          },
          {
            // Check if a trip ends during the new trip
            AND: [
              { arrivalTime: { gte: new Date(data.departureTime) } },
              { arrivalTime: { lte: new Date(data.arrivalTime) } },
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

    // Determine basePrice and currentPrice. Use route's basePrice if no customPrice is provided.
    const basePrice =
      data.customPrice !== null && data.customPrice !== undefined
        ? Number.parseFloat(data.customPrice)
        : route.basePrice;
    const currentPrice = basePrice; // For now, currentPrice is same as basePrice or customPrice

    // Create the trip
    const trip = await prisma.trip.create({
      data: {
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        basePrice: basePrice,
        currentPrice: currentPrice,
        availableSeats: data.availableSeats || bus.capacity,
        status: data.status || "SCHEDULED",
        tripType: data.tripType || "STANDARD",
        services: data.services || [],
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        notes: data.notes || null,
        boardingStartTime: data.boardingStartTime
          ? new Date(data.boardingStartTime)
          : null,
        boardingEndTime: data.boardingEndTime
          ? new Date(data.boardingEndTime)
          : null,
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
        route: {
          select: {
            id: true,
            name: true,
            departureLocation: true,
            arrivalLocation: true,
            basePrice: true, // Include basePrice here for socket emit
            estimatedDuration: true,
          },
        },
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

    // Emit socket event for new trip
    const io = getSocketIO();
    if (io) {
      io.to(`company-${data.companyId}`).emit("new-trip-scheduled", {
        id: trip.id,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        availableSeats: trip.availableSeats,
        route: {
          id: trip.route.id,
          name: trip.route.name,
          departureLocation: trip.route.departureLocation,
          arrivalLocation: trip.route.arrivalLocation,
          price: trip.route.basePrice, // Use basePrice for display
          estimatedDuration: trip.route.estimatedDuration,
        },
        bus: {
          id: trip.bus.id,
          plateNumber: trip.bus.plateNumber,
          model: trip.bus.model,
          capacity: trip.bus.capacity,
        },
        _count: {
          reservations: 0, // New trips have 0 reservations initially
          tickets: 0,
        },
        company: {
          name: company.name,
        },
      });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
