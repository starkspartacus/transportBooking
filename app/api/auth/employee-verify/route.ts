import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode, code } = await request.json();

    if (!phone || !countryCode || !code) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si le code existe et est valide
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
        role: true,
        employeeAt: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      employee: {
        name: employee.name,
        role: employee.role,
        company: employee.employeeAt?.name || "Entreprise inconnue",
      },
      expiresAt: authCode.expiresAt,
    });
  } catch (error) {
    console.error("Error verifying employee code:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
