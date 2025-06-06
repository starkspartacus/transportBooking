import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer tous les bus d'une entreprise
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

    const buses = await prisma.bus.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(buses);
  } catch (error) {
    console.error("Error fetching buses:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un nouveau bus
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validation des données
    const requiredFields = [
      "plateNumber",
      "model",
      "brand",
      "capacity",
      "year",
      "fuelType",
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

    // Vérifier l'unicité du numéro d'immatriculation
    const existingBus = await prisma.bus.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: "Ce numéro d'immatriculation est déjà utilisé" },
        { status: 400 }
      );
    }

    // Créer le bus
    const bus = await prisma.bus.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        brand: data.brand,
        capacity: Number.parseInt(data.capacity),
        year: Number.parseInt(data.year),
        color: data.color || "",
        fuelType: data.fuelType,
        status: data.status || "ACTIVE",
        totalKm: data.totalKm || 0,
        insuranceExpiry: new Date(data.insuranceExpiry),
        technicalControlExpiry: new Date(data.technicalControlExpiry),
        lastMaintenance: new Date(data.lastMaintenance),
        nextMaintenance: new Date(data.nextMaintenance),
        features: data.features || [],
        companyId: data.companyId,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "BUS_ADDED",
        description: `Bus ${bus.plateNumber} ajouté à la flotte`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: data.companyId,
      },
    });

    return NextResponse.json(bus);
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
