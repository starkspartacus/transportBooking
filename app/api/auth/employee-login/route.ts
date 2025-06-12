import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode, code } = body;

    // Validation des données
    if (!phone || !countryCode || !code) {
      return NextResponse.json(
        { error: "Téléphone, code pays et code d'authentification requis" },
        { status: 400 }
      );
    }

    // Vérifier le code d'authentification
    const authCode = await prisma.employeeAuthCode.findFirst({
      where: {
        code: code,
        phone: phone,
        countryCode: countryCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!authCode) {
      return NextResponse.json(
        {
          error: "Code invalide, expiré ou déjà utilisé",
        },
        { status: 401 }
      );
    }

    const employee = authCode.employee;

    // Vérifier que l'employé est actif
    if (employee.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Compte employé suspendu",
        },
        { status: 401 }
      );
    }

    // Vérifier que l'entreprise est active
    if (employee.company?.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: "Entreprise non approuvée",
        },
        { status: 401 }
      );
    }

    // Marquer le code comme utilisé
    await prisma.employeeAuthCode.update({
      where: { id: authCode.id },
      data: {
        isUsed: true,
        updatedAt: new Date(),
      },
    });

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: employee.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    // Créer le token JWT
    const token = sign(
      {
        userId: employee.id,
        role: employee.role,
        companyId: employee.companyId,
        type: "employee",
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "8h" }
    );

    // Enregistrer l'activité de connexion
    await prisma.activity.create({
      data: {
        type: "USER_LOGIN",
        description: `Connexion employé: ${employee.name}`,
        status: "SUCCESS",
        userId: employee.id,
        companyId: employee.companyId,
        metadata: {
          loginMethod: "employee_code",
          phone: `${countryCode} ${phone}`,
        },
      },
    });

    // Créer la réponse avec le token
    const response = NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        companyId: employee.companyId,
        company: employee.company,
      },
      message: "Connexion réussie",
    });

    // Définir le token dans un cookie httpOnly
    response.cookies.set("employee-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 8 heures
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
