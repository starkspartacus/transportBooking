import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      departureLocation,
      arrivalLocation,
      departureCountry,
      arrivalCountry,
      distance,
      estimatedDuration,
      basePrice,
      isInternational,
      status,
    } = body;

    // Vérifier que la route existe et appartient à l'utilisateur
    const existingRoute = await prisma.route.findFirst({
      where: {
        id,
        company: {
          ownerId: session.user.id,
        },
      },
    });

    if (!existingRoute) {
      return NextResponse.json({ error: "Route non trouvée" }, { status: 404 });
    }

    // Mettre à jour la route
    const updatedRoute = await prisma.route.update({
      where: { id },
      data: {
        name,
        description,
        departureLocation,
        arrivalLocation,
        departureCountry,
        arrivalCountry,
        distance: Number(distance),
        estimatedDuration: Number(estimatedDuration),
        basePrice: Number(basePrice),
        isInternational: Boolean(isInternational),
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRoute);
  } catch (error) {
    console.error("Error updating route:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la route" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Vérifier que la route existe et appartient à l'utilisateur
    const existingRoute = await prisma.route.findFirst({
      where: {
        id,
        company: {
          ownerId: session.user.id,
        },
      },
      include: {
        trips: true,
      },
    });

    if (!existingRoute) {
      return NextResponse.json({ error: "Route non trouvée" }, { status: 404 });
    }

    // Vérifier s'il y a des voyages actifs sur cette route
    const activeTrips = existingRoute.trips.filter(
      (trip) => trip.status === "SCHEDULED" || trip.status === "IN_TRANSIT"
    );

    if (activeTrips.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une route avec des voyages actifs" },
        { status: 400 }
      );
    }

    // Supprimer la route
    await prisma.route.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Route supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la route" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Récupérer la route avec les statistiques
    const route = await prisma.route.findFirst({
      where: {
        id,
        company: {
          ownerId: session.user.id,
        },
      },
      include: {
        trips: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: "Route non trouvée" }, { status: 404 });
    }

    // Ajouter les statistiques
    const routeWithStats = {
      ...route,
      totalTrips: route._count.trips,
      activeTrips: route.trips.filter(
        (trip) => trip.status === "SCHEDULED" || trip.status === "IN_TRANSIT"
      ).length,
    };

    return NextResponse.json(routeWithStats);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la route" },
      { status: 500 }
    );
  }
}
