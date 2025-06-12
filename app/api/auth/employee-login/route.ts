import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode, code } = await request.json();

    if (!phone || !countryCode || !code) {
      return NextResponse.json(
        { error: "Téléphone, indicatif pays et code requis" },
        { status: 400 }
      );
    }

    // Rechercher le code d'authentification valide
    const authCode = await prisma.employeeAuthCode.findFirst({
      where: {
        code,
        phone,
        countryCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!authCode) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 401 }
      );
    }

    // Récupérer les informations de l'employé
    const employee = await prisma.user.findUnique({
      where: { id: authCode.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        status: true,
        employeeAt: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!employee || employee.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Employé non trouvé ou inactif" },
        { status: 401 }
      );
    }

    if (!employee.employeeAt || employee.employeeAt.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Entreprise non approuvée" },
        { status: 401 }
      );
    }

    // Marquer le code comme utilisé
    await prisma.employeeAuthCode.update({
      where: { id: authCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Enregistrer l'activité de connexion
    await prisma.activity.create({
      data: {
        type: "USER_LOGIN",
        description: `Connexion employé via code d'accès: ${employee.name}`,
        status: "SUCCESS",
        userId: employee.id,
        companyId: employee.companyId,
        metadata: {
          loginMethod: "employee_code",
          phone: `${countryCode} ${phone}`,
        },
      },
    });

    // Mettre à jour les statistiques de connexion
    await prisma.user.update({
      where: { id: employee.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        companyId: employee.companyId,
        company: employee.employeeAt,
      },
      message: "Connexion réussie",
    });
  } catch (error) {
    console.error("Error in employee login:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
