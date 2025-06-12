import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // Vérifier que l'utilisateur est propriétaire de l'entreprise
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

    const employees = await prisma.user.findMany({
      where: {
        companyId: companyId,
        role: {
          in: ["GESTIONNAIRE", "CAISSIER"],
        },
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
        companyId: true,
        image: true,
        address: true,
        country: true,
        city: true,
        commune: true,
        dateOfBirth: true,
        gender: true,
        idNumber: true,
        idType: true,
        idExpiryDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        emergencyRelation: true,
        employeeNotes: true,
        education: true,
        skills: true,
        languages: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      role,
      status,
      nationality,
      department,
      position,
      salary,
      hireDate,
      companyId,

      // Informations personnelles supplémentaires
      image,
      address,
      country,
      city,
      commune,
      dateOfBirth,
      gender,
      idNumber,
      idType,
      idExpiryDate,

      // Informations professionnelles supplémentaires
      education,
      skills,
      languages,

      // Informations bancaires
      bankName,
      bankAccountNumber,
      bankAccountName,

      // Contact d'urgence
      emergencyContact,
      emergencyPhone,
      emergencyRelation,

      // Notes
      employeeNotes,
    } = body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !role || !companyId) {
      return NextResponse.json(
        { error: "Prénom, nom, email, rôle et ID de l'entreprise sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de l'entreprise
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

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Préparer les données pour la création de l'employé
    const employeeData = {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || null,
      countryCode: countryCode || null,
      role: role as "GESTIONNAIRE" | "CAISSIER",
      status: (status as "ACTIVE" | "SUSPENDED") || "ACTIVE",
      nationality: nationality || null,
      department: department === "none" ? null : department,
      position: position || null,
      salary: salary ? Number.parseFloat(salary.toString()) : null,
      hireDate: hireDate ? new Date(hireDate) : null,
      companyId,

      // Informations personnelles supplémentaires
      image: image || null,
      address: address || null,
      country: country || null,
      city: city || null,
      commune: commune || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      idNumber: idNumber || null,
      idType: idType || null,
      idExpiryDate: idExpiryDate ? new Date(idExpiryDate) : null,

      // Informations professionnelles supplémentaires
      education: education || null,
      skills: Array.isArray(skills) ? skills : [],
      languages: Array.isArray(languages) ? languages : [],

      // Informations bancaires
      bankName: bankName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankAccountName: bankAccountName || null,

      // Contact d'urgence
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      emergencyRelation: emergencyRelation || null,

      // Notes
      employeeNotes: employeeNotes || null,
    };

    console.log(
      "Creating employee with data:",
      JSON.stringify(employeeData, null, 2)
    );

    // Créer l'employé
    const employee = await prisma.user.create({
      data: employeeData,
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
        companyId: true,
        image: true,
        address: true,
        country: true,
        city: true,
        commune: true,
        dateOfBirth: true,
        gender: true,
        idNumber: true,
        idType: true,
        idExpiryDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        emergencyRelation: true,
        employeeNotes: true,
        education: true,
        skills: true,
        languages: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        createdAt: true,
      },
    });

    console.log("Employee created:", JSON.stringify(employee, null, 2));

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_ADDED",
        description: `Nouvel employé créé: ${employee.name} (${employee.role})`,
        userId: session.user.id,
        companyId,
        metadata: {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
          tempPassword: tempPassword, // À des fins de débogage uniquement
        },
      },
    });

    return NextResponse.json({
      message: "Employé créé avec succès",
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        tempPassword, // Retourner le mot de passe temporaire pour information
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'employé" },
      { status: 500 }
    );
  }
}
