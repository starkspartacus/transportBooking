import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les entreprises de l'utilisateur
    const companies = await prisma.company.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (companies.length === 0) {
      return NextResponse.json([]);
    }

    const companyIds = companies.map((company) => company.id);

    // Récupérer tous les bus des entreprises de l'utilisateur
    const buses = await prisma.bus.findMany({
      where: {
        companyId: { in: companyIds },
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formater les données avec le schéma actuel + valeurs par défaut pour les nouveaux champs
    const formattedBuses = buses.map((bus) => ({
      id: bus.id,
      plateNumber: bus.plateNumber,
      brand: "Mercedes", // Valeur par défaut temporaire
      model: bus.model,
      year: bus.year || new Date().getFullYear(),
      capacity: bus.capacity,
      color: "Blanc", // Valeur par défaut temporaire
      fuelType: "DIESEL", // Valeur par défaut temporaire
      status: bus.status,
      totalKm: bus.mileage || 0,
      lastMaintenance:
        bus.lastMaintenance?.toISOString() || new Date().toISOString(),
      nextMaintenance:
        bus.nextMaintenance?.toISOString() || new Date().toISOString(),
      insuranceExpiry: bus.insuranceExpiry?.toISOString(),
      technicalInspectionExpiry: bus.technicalControlExpiry?.toISOString(),
      equipment: [], // Valeur par défaut temporaire
    }));

    return NextResponse.json(formattedBuses);
  } catch (error) {
    console.error("Erreur lors de la récupération des bus:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des bus" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      plateNumber,
      brand,
      model,
      year,
      capacity,
      color,
      fuelType,
      status,
      totalKm,
      insuranceExpiry,
      technicalInspectionExpiry,
      lastMaintenance,
      nextMaintenance,
      equipment,
    } = body;

    // Validation des champs obligatoires
    if (!plateNumber || !model || !year || !capacity) {
      return NextResponse.json(
        {
          error:
            "Numéro d'immatriculation, modèle, année et capacité sont obligatoires",
        },
        { status: 400 }
      );
    }

    // Récupérer l'entreprise active de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        activeCompany: true,
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Déterminer l'entreprise à utiliser
    let companyId = user.activeCompanyId;
    if (!companyId && user.ownedCompanies.length > 0) {
      companyId = user.ownedCompanies[0].id;
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Aucune entreprise trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro d'immatriculation existe déjà
    const existingBus = await prisma.bus.findFirst({
      where: { plateNumber },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: "Ce numéro d'immatriculation existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si les nouvelles colonnes existent dans la table
    const tableInfo = (await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Bus' AND column_name IN ('brand', 'color', 'fuelType', 'totalKm', 'equipment')
    `) as Array<{ column_name: string }>;

    const hasNewColumns = tableInfo.length > 0;

    let newBus;

    if (hasNewColumns) {
      // Utiliser la nouvelle structure avec tous les champs
      newBus = await prisma.$executeRaw`
        INSERT INTO "Bus" (
          "id", "plateNumber", "brand", "model", "year", "capacity", "color", 
          "fuelType", "status", "totalKm", "mileage", "insuranceExpiry", 
          "technicalInspectionExpiry", "technicalControlExpiry", "lastMaintenance", 
          "nextMaintenance", "equipment", "companyId", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${plateNumber},
          ${brand || "Mercedes"},
          ${model},
          ${Number.parseInt(year)},
          ${Number.parseInt(capacity)},
          ${color || "Blanc"},
          ${fuelType || "DIESEL"},
          ${status || "ACTIVE"}::"BusStatus",
          ${Number.parseInt(totalKm || "0")},
          ${Number.parseInt(totalKm || "0")},
          ${insuranceExpiry ? new Date(insuranceExpiry) : null},
          ${
            technicalInspectionExpiry
              ? new Date(technicalInspectionExpiry)
              : null
          },
          ${
            technicalInspectionExpiry
              ? new Date(technicalInspectionExpiry)
              : null
          },
          ${lastMaintenance ? new Date(lastMaintenance) : new Date()},
          ${nextMaintenance ? new Date(nextMaintenance) : new Date()},
          ${equipment ? equipment : []}::text[],
          ${companyId},
          true,
          NOW(),
          NOW()
        )
      `;
    } else {
      // Utiliser l'ancienne structure avec seulement les champs existants
      newBus = await prisma.bus.create({
        data: {
          plateNumber,
          model,
          year: Number.parseInt(year),
          capacity: Number.parseInt(capacity),
          status: status || "ACTIVE",
          mileage: Number.parseInt(totalKm || "0"),
          insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
          technicalControlExpiry: technicalInspectionExpiry
            ? new Date(technicalInspectionExpiry)
            : null,
          lastMaintenance: lastMaintenance
            ? new Date(lastMaintenance)
            : new Date(),
          nextMaintenance: nextMaintenance
            ? new Date(nextMaintenance)
            : new Date(),
          companyId,
        },
      });
    }

    // Récupérer le bus créé
    const createdBus = await prisma.bus.findFirst({
      where: { plateNumber },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        id: createdBus?.id,
        plateNumber: createdBus?.plateNumber,
        model: createdBus?.model,
        capacity: createdBus?.capacity,
        status: createdBus?.status,
        message: "Bus créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création du bus:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création du bus",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
