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

    const routes = await prisma.route.findMany({
      where: {
        companyId: companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        departureLocation: true,
        arrivalLocation: true,
        distance: true,
        estimatedDuration: true,
        basePrice: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(routes);
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
    console.log("Route creation data received:", data);

    // Validation des données
    const requiredFields = [
      "name",
      "origin",
      "destination",
      "distance",
      "estimatedDuration",
      "basePrice",
      "companyId",
    ];

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        console.error(`Missing required field: ${field}`);
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

    // Vérifier l'unicité du nom de route dans l'entreprise
    const existingRoute = await prisma.route.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId,
      },
    });

    if (existingRoute) {
      return NextResponse.json(
        { error: "Une route avec ce nom existe déjà dans votre entreprise" },
        { status: 400 }
      );
    }

    // Créer la route
    const route = await prisma.route.create({
      data: {
        name: data.name,
        departureLocation: data.origin,
        arrivalLocation: data.destination,
        departureCountry: data.departureCountry || "Côte d'Ivoire",
        arrivalCountry: data.arrivalCountry || "Côte d'Ivoire",
        distance: Number(data.distance),
        estimatedDuration: Number(data.estimatedDuration),
        basePrice: Number(data.basePrice),
        description: data.description || "",
        isInternational: data.isInternational || false,
        status: data.status || "ACTIVE",
        companyId: data.companyId,
      },
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
      departureLocation: route.departureLocation,
      arrivalLocation: route.arrivalLocation,
      departureCountry: route.departureCountry,
      arrivalCountry: route.arrivalCountry,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      basePrice: route.basePrice,
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
