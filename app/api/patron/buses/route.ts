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

    const buses = await prisma.bus.findMany({
      where: { companyId: targetCompanyId },
      orderBy: { createdAt: "desc" },
    });

    // Format the data for the frontend
    const formattedBuses = buses.map((bus) => ({
      id: bus.id,
      plateNumber: bus.plateNumber,
      model: bus.model,
      brand: "Non spécifié", // Valeur par défaut car le champ n'existe pas dans le schéma
      capacity: bus.capacity,
      status: bus.status || "ACTIVE",
      lastMaintenance:
        bus.lastMaintenance?.toISOString() || new Date().toISOString(),
      nextMaintenance:
        bus.nextMaintenance?.toISOString() ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      mileage: bus.mileage || 0,
      year: bus.year || new Date().getFullYear(),
      color: "Non spécifié", // Valeur par défaut car le champ n'existe pas dans le schéma
      fuelType: "DIESEL", // Valeur par défaut car le champ n'existe pas dans le schéma
      features: [], // Valeur par défaut car le champ n'existe pas dans le schéma
      // Calculer les propriétés booléennes à partir des features (toutes false par défaut)
      hasAC: false,
      hasWifi: false,
      hasTV: false,
      hasToilet: false,
      hasUSB: false,
    }));

    return NextResponse.json(formattedBuses);
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

    // Validation des données (seulement les champs qui existent dans le schéma)
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

    // Créer le bus avec seulement les champs qui existent dans le schéma
    const bus = await prisma.bus.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: Number.parseInt(data.capacity),
        year: data.year ? Number.parseInt(data.year) : null,
        status: data.status || "ACTIVE",
        mileage: data.mileage || 0,
        lastMaintenance: data.lastMaintenance
          ? new Date(data.lastMaintenance)
          : new Date(),
        nextMaintenance: data.nextMaintenance
          ? new Date(data.nextMaintenance)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        insuranceExpiry: data.insuranceExpiry
          ? new Date(data.insuranceExpiry)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        technicalControlExpiry: data.technicalControlExpiry
          ? new Date(data.technicalControlExpiry)
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
      brand: "Non spécifié",
      capacity: bus.capacity,
      status: bus.status,
      lastMaintenance: bus.lastMaintenance?.toISOString(),
      nextMaintenance: bus.nextMaintenance?.toISOString(),
      mileage: bus.mileage,
      year: bus.year,
      color: "Non spécifié",
      fuelType: "DIESEL",
      features: [],
      hasAC: false,
      hasWifi: false,
      hasTV: false,
      hasToilet: false,
      hasUSB: false,
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
