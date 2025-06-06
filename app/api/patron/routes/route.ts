import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les routes d'une entreprise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // Si pas de companyId fourni, utiliser l'entreprise active de l'utilisateur
    let targetCompanyId = companyId;

    if (!targetCompanyId) {
      // Récupérer la première entreprise du patron
      const userCompany = await prisma.company.findFirst({
        where: {
          ownerId: session.user.id,
        },
        select: { id: true },
      });

      if (!userCompany) {
        return NextResponse.json(
          { error: "Aucune entreprise trouvée" },
          { status: 404 }
        );
      }

      targetCompanyId = userCompany.id;
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: targetCompanyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const routes = await prisma.route.findMany({
      where: {
        companyId: targetCompanyId,
      },
      include: {
        stops: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformer les données pour inclure totalTrips et duration (pour compatibilité)
    const routesWithStats = routes.map((route) => ({
      ...route,
      totalTrips: route._count.trips,
      duration: route.estimatedDuration, // Utiliser estimatedDuration comme alias pour duration
      departure: route.departureLocation, // Alias pour compatibilité
      arrival: route.arrivalLocation, // Alias pour compatibilité
      price: route.basePrice, // Utiliser basePrice comme alias pour price
    }));

    return NextResponse.json(routesWithStats);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle route
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validation des données
    const requiredFields = [
      "name",
      "departure",
      "arrival",
      "departureCountry",
      "arrivalCountry",
      "duration",
      "price",
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

    // Créer la route avec transaction pour gérer les arrêts
    const route = await prisma.$transaction(async (tx) => {
      // Créer la route
      const newRoute = await tx.route.create({
        data: {
          name: data.name,
          departureLocation: data.departure, // Utiliser departure comme departureLocation
          arrivalLocation: data.arrival, // Utiliser arrival comme arrivalLocation
          departureCountry: data.departureCountry,
          arrivalCountry: data.arrivalCountry,
          distance: data.distance || 0,
          estimatedDuration: data.duration, // Utiliser duration comme estimatedDuration
          basePrice: data.price, // Utiliser price comme basePrice
          description: data.description,
          isInternational:
            data.isInternational ||
            data.departureCountry !== data.arrivalCountry,
          status: data.status || "ACTIVE",
          companyId: data.companyId,
        },
      });

      // Créer les arrêts s'il y en a
      if (data.stops && data.stops.length > 0) {
        await tx.routeStop.createMany({
          data: data.stops.map((stop: any, index: number) => ({
            routeId: newRoute.id,
            name: stop.name,
            country: stop.country,
            city: stop.city,
            order: index + 1,
            estimatedArrival: stop.estimatedArrival || 0,
          })),
        });
      }

      return newRoute;
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "ROUTE_CREATED",
        description: `Route ${route.name} créée`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: data.companyId,
      },
    });

    return NextResponse.json({
      id: route.id,
      name: route.name,
      departure: route.departureLocation, // Alias pour compatibilité
      arrival: route.arrivalLocation, // Alias pour compatibilité
      departureCountry: route.departureCountry,
      arrivalCountry: route.arrivalCountry,
      distance: route.distance,
      duration: route.estimatedDuration, // Alias pour compatibilité
      price: route.basePrice, // Alias pour compatibilité
      description: route.description,
      isInternational: route.isInternational,
      status: route.status,
      totalTrips: 0,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
