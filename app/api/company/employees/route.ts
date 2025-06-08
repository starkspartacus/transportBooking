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
        companyId = session.user.companyId || null;
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
        status: true,
        image: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        idNumber: true,
        idType: true,
        address: true,
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
      firstName,
      lastName,
      email,
      role,
      phone,
      countryCode,
      companyId,
      dateOfBirth,
      gender,
      nationality,
      idType,
      idNumber,
      address,
      country,
      city,
      commune,
      emergencyContact,
      emergencyPhone,
      hireDate,
      salary,
      department,
      position,
      notes,
      status,
      image,
      password,
    } = body;

    console.log("Creating employee with data:", {
      firstName,
      lastName,
      email,
      role,
      companyId,
    });

    // Utiliser le companyId fourni ou celui de l'utilisateur
    let targetCompanyId: string | null = companyId || null;
    if (!targetCompanyId) {
      if (session.user.role === "PATRON") {
        // Pour un patron, utiliser son companyId ou récupérer la première entreprise qu'il possède
        if (session.user.companyId) {
          targetCompanyId = session.user.companyId;
        } else {
          // Récupérer la première entreprise du patron
          const userCompany = await prisma.company.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true },
          });
          targetCompanyId = userCompany?.id || null;
        }
      } else {
        targetCompanyId = session.user.companyId || null;
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json(
        { error: "Aucune entreprise trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    console.log("Using companyId:", targetCompanyId);

    // Vérifier que l'utilisateur a accès à cette entreprise
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: targetCompanyId,
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

    // Validation des champs requis
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Prénom et nom requis" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    if (!phone || !countryCode) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis" },
        { status: 400 }
      );
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

    // Vérifier que le téléphone n'existe pas déjà
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

    // Générer un mot de passe par défaut si non fourni
    const defaultPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Valider le statut
    const validStatuses = ["ACTIVE", "SUSPENDED"] as const;
    const employeeStatus =
      status && validStatuses.includes(status as any)
        ? (status as "ACTIVE" | "SUSPENDED")
        : "ACTIVE";

    // Créer l'employé avec toutes les informations
    const employee = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        password: hashedPassword,
        role: role as "GESTIONNAIRE" | "CAISSIER",
        status: employeeStatus,
        image: image || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender as "MALE" | "FEMALE" | "OTHER" | null,
        nationality: nationality || null,
        idType: idType as
          | "PASSPORT"
          | "NATIONAL_ID"
          | "DRIVERS_LICENSE"
          | "OTHER"
          | null,
        idNumber: idNumber || null,
        address: address || null,
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
        status: true,
        image: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        idNumber: true,
        idType: true,
        address: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
      },
    });

    // Enregistrer l'activité de création d'employé
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_ADDED",
        description: `Nouvel employé ajouté: ${employee.name} (${employee.role})`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: targetCompanyId,
        metadata: {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
          department: department || null,
          position: position || null,
        },
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
