import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode, code, role } = body;

    // Validation des données
    if (!phone || !countryCode || !code) {
      return NextResponse.json(
        { error: "Téléphone, code pays et code d'authentification requis" },
        { status: 400 }
      );
    }

    // Chercher l'employé par téléphone et rôle
    const employee = await prisma.user.findFirst({
      where: {
        phone: phone,
        countryCode: countryCode,
        role: role || { in: ["GESTIONNAIRE", "CAISSIER"] },
        status: "ACTIVE",
      },
      include: {
        employeeAt: true,
      },
    });

    if (!employee || !employee.companyId) {
      return NextResponse.json(
        { error: "Employé non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Chercher le code dans les activités récentes (derniers 30 jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const codeActivity = await prisma.activity.findFirst({
      where: {
        description: {
          contains: code,
        },
        companyId: employee.companyId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        userId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!codeActivity) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 401 }
      );
    }

    // Vérifier que l'activité contient bien le code de l'employé
    if (!codeActivity.description.includes(employee.id)) {
      return NextResponse.json(
        { error: "Code non valide pour cet employé" },
        { status: 401 }
      );
    }

    // Enregistrer la tentative de connexion
    await prisma.activity.create({
      data: {
        type: "COMPANY_UPDATED",
        description: `Vérification code réussie: ${employee.name} (${employee.phone}) - Code: ${code}`,
        status: "SUCCESS",
        userId: employee.id,
        companyId: employee.companyId,
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
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du code:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
