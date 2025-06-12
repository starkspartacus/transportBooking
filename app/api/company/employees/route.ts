import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt, { hash } from "bcryptjs";

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

// POST - Créer un nouvel employé avec phone + countryCode
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validation des données
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "countryCode",
      "role",
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
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité de l'email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du téléphone + indicatif
    const existingUserByPhone = await prisma.user.findFirst({
      where: {
        phone: data.phone,
        countryCode: data.countryCode,
      },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "Un utilisateur avec ce numéro de téléphone existe déjà" },
        { status: 400 }
      );
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(tempPassword, 12);

    // Créer l'employé avec tous les champs nécessaires
    const employee = await prisma.user.create({
      data: {
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        password: hashedPassword,
        role: data.role,
        status: data.status || "ACTIVE",
        companyId: data.companyId,

        // Informations supplémentaires
        nationality: data.nationality,
        department: data.department,
        position: data.position,
        salary: data.salary ? Number.parseFloat(data.salary) : undefined,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        employeeNotes: data.notes,
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
        nationality: true,
        department: true,
        position: true,
        salary: true,
        hireDate: true,
        createdAt: true,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_ADDED",
        description: `Employé ${employee.name} ajouté avec le numéro ${data.countryCode} ${data.phone}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: data.companyId,
        metadata: {
          employeeId: employee.id,
          employeeRole: data.role,
          phone: `${data.countryCode} ${data.phone}`,
        },
      },
    });

    return NextResponse.json({
      ...employee,
      tempPassword, // Retourner le mot de passe temporaire pour information
      message:
        "Employé créé avec succès. Il peut maintenant se connecter avec son numéro de téléphone et un code d'accès.",
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
