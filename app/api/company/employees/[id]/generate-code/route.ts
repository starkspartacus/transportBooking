import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;

    // Vérifier que l'employé existe et récupérer ses informations
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        phone: true,
        countryCode: true,
        role: true,
        status: true,
        companyId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    if (!employee.phone || !employee.countryCode) {
      return NextResponse.json(
        {
          error: "Numéro de téléphone manquant pour cet employé",
        },
        { status: 400 }
      );
    }

    if (employee.status !== "ACTIVE") {
      return NextResponse.json({ error: "Employé inactif" }, { status: 400 });
    }

    // Supprimer les anciens codes non utilisés pour cet employé
    await prisma.employeeAuthCode.deleteMany({
      where: {
        employeeId: employee.id,
        OR: [{ isUsed: true }, { expiresAt: { lt: new Date() } }],
      },
    });

    // Générer un nouveau code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 heures

    // Créer le nouveau code d'authentification
    const authCode = await prisma.employeeAuthCode.create({
      data: {
        code,
        phone: employee.phone,
        countryCode: employee.countryCode,
        employeeId: employee.id,
        expiresAt,
        isUsed: false,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_CODE_GENERATED",
        description: `Code d'accès généré pour ${employee.name}`,
        status: "SUCCESS",
        userId: employee.id,
        companyId: employee.companyId,
        metadata: {
          codeId: authCode.id,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      code: authCode.code,
      expiresAt: authCode.expiresAt,
      phone: `${employee.countryCode} ${employee.phone}`,
      employee: {
        name: employee.name,
        role: employee.role,
      },
      message: "Code d'accès généré avec succès",
    });
  } catch (error) {
    console.error("Error generating employee code:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
