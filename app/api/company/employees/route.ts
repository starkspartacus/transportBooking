import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let companyId: string | null = searchParams.get("companyId");

    // Si pas de companyId fourni, utiliser celui de l'utilisateur
    if (!companyId) {
      if (session.user.role === "PATRON") {
        companyId =
          session.user.activeCompanyId || session.user.companyId || null;
      } else {
        companyId = session.user.companyId || null;
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    console.log("Fetching employees for company:", companyId);

    // Vérifier que l'utilisateur a accès à cette entreprise
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Entreprise non trouvée ou accès refusé" },
          { status: 403 }
        );
      }
    }

    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${employees.length} employees`);

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      role,
      firstName,
      lastName,
      phone,
      country,
      city,
      commune,
      password,
      countryCode,
      companyId,
    } = body;

    console.log("Creating employee with data:", {
      name,
      email,
      role,
      companyId,
    });

    // Utiliser le companyId fourni ou celui de l'utilisateur
    let targetCompanyId: string | null = companyId || null;
    if (!targetCompanyId) {
      if (session.user.role === "PATRON") {
        targetCompanyId =
          session.user.activeCompanyId || session.user.companyId || null;
      } else {
        targetCompanyId = session.user.companyId || null;
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    // Validation des champs requis
    if (!name && !firstName && !lastName) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    if (!role || !["GESTIONNAIRE", "CAISSIER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Vérifier que le téléphone n'existe pas déjà (si fourni)
    if (phone && countryCode) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          countryCode,
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Générer un mot de passe par défaut si non fourni
    const defaultPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Créer l'employé
    const employee = await prisma.user.create({
      data: {
        name: name || `${firstName || ""} ${lastName || ""}`.trim(),
        firstName: firstName || name?.split(" ")[0] || "",
        lastName: lastName || name?.split(" ").slice(1).join(" ") || "",
        email,
        phone: phone || null,
        countryCode: countryCode || null,
        password: hashedPassword,
        role: role as "GESTIONNAIRE" | "CAISSIER",
        country: country || null,
        city: city || null,
        commune: commune || null,
        companyId: targetCompanyId,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
      },
    });

    console.log("Employee created successfully:", employee.id);

    return NextResponse.json({
      ...employee,
      generatedPassword: password ? undefined : defaultPassword,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'employé" },
      { status: 500 }
    );
  }
}
