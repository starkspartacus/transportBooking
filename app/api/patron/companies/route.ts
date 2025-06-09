import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyStatus } from "@prisma/client";

// GET - Récupérer toutes les entreprises du patron
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    const companies = await prisma.company.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        email: true,
        phone: true,
        city: true,
        country: true,
        isActive: true,
        isVerified: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            employees: true,
            buses: true,
            trips: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching patron companies:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle entreprise
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    console.log("Creating company with data:", {
      userId,
      name: data.name,
      email: data.email,
      operatingCountries: data.operatingCountries,
    });

    // Validation des données
    const requiredFields = [
      "name",
      "email",
      "phone",
      "countryCode",
      "address",
      "country",
      "city",
      "licenseNumber",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Validation des tableaux
    if (!Array.isArray(data.operatingCountries)) {
      data.operatingCountries = [];
    }

    if (!Array.isArray(data.services)) {
      data.services = [];
    }

    if (!Array.isArray(data.vehicleTypes)) {
      data.vehicleTypes = [];
    }

    if (!Array.isArray(data.primaryRoutes)) {
      data.primaryRoutes = [];
    }

    // Vérifier si l'email est déjà utilisé
    const existingCompanyEmail = await prisma.company.findUnique({
      where: { email: data.email },
    });

    if (existingCompanyEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé par une autre entreprise" },
        { status: 409 }
      );
    }

    // Vérifier si le numéro de licence est déjà utilisé
    const existingLicense = await prisma.company.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: "Ce numéro de licence est déjà utilisé" },
        { status: 409 }
      );
    }

    // Vérifier que l'ID utilisateur est valide
    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur non valide" },
        { status: 400 }
      );
    }

    // Créer l'entreprise
    const company = await prisma.company.create({
      data: {
        name: data.name,
        description: data.description || "",
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        address: data.address,
        country: data.country,
        city: data.city,
        commune: data.commune || "",
        website: data.website || "",
        licenseNumber: data.licenseNumber,
        taxId: data.taxId || "",
        foundedYear: data.foundedYear
          ? Number.parseInt(data.foundedYear.toString())
          : undefined,
        size: data.size || "SMALL",
        isVerified: false,
        isActive: true,
        status: "PENDING" as CompanyStatus,
        operatingCountries: data.operatingCountries,
        services: data.services,
        vehicleTypes: data.vehicleTypes,
        primaryRoutes: data.primaryRoutes,
        owner: {
          connect: { id: userId },
        },
      },
    });

    // Si c'est la première entreprise du patron, la définir comme active
    const userCompaniesCount = await prisma.company.count({
      where: { ownerId: userId },
    });

    if (userCompaniesCount === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeCompanyId: company.id },
      });
    }

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_CREATED",
        description: `Entreprise ${company.name} créée`,
        status: "SUCCESS",
        userId: userId,
        companyId: company.id,
      },
    });

    return NextResponse.json({
      company,
      message: "Entreprise créée avec succès. En attente de vérification.",
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
