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
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const buses = await prisma.bus.findMany({
      where: {
        companyId: companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        plateNumber: true,
        model: true,
        capacity: true,
        status: true,
        lastMaintenance: true,
        nextMaintenance: true,
        mileage: true,
        createdAt: true,
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
    const requiredFields = ["plateNumber", "model", "capacity", "companyId"];

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

    // Vérifier l'unicité du numéro d'immatriculation dans l'entreprise
    const existingBus = await prisma.bus.findFirst({
      where: {
        plateNumber: data.plateNumber,
        companyId: data.companyId,
      },
    });

    if (existingBus) {
      return NextResponse.json(
        {
          error:
            "Ce numéro d'immatriculation est déjà utilisé dans votre entreprise",
        },
        { status: 400 }
      );
    }

    // Créer le bus
    const bus = await prisma.bus.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        brand: data.brand || null,
        capacity: Number.parseInt(data.capacity),
        year: data.year ? Number.parseInt(data.year) : null,
        status: data.status || "ACTIVE",
        mileage: data.mileage || 0,
        features: data.equipment || [],
        lastMaintenance: data.lastMaintenance
          ? new Date(data.lastMaintenance)
          : new Date(),
        nextMaintenance: data.nextMaintenance
          ? new Date(data.nextMaintenance)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        insuranceExpiry: data.insuranceExpiry
          ? new Date(data.insuranceExpiry)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        technicalControlExpiry: data.technicalInspectionExpiry
          ? new Date(data.technicalInspectionExpiry)
          : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
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

    return NextResponse.json({
      id: bus.id,
      plateNumber: bus.plateNumber,
      model: bus.model,
      brand: bus.brand || "Non spécifié",
      capacity: bus.capacity,
      status: bus.status,
      lastMaintenance: bus.lastMaintenance?.toISOString(),
      nextMaintenance: bus.nextMaintenance?.toISOString(),
      mileage: bus.mileage,
      year: bus.year,
      features: bus.features,
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
