import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const employeeId = params.id;

    // Récupérer l'employé avec ses informations
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        countryCode: true,
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
          error:
            "L'employé doit avoir un numéro de téléphone et un indicatif pays pour générer un code",
        },
        { status: 400 }
      );
    }

    // Supprimer les anciens codes non utilisés
    await prisma.employeeAuthCode.deleteMany({
      where: {
        employeeId: employeeId,
        OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
      },
    });

    // Générer un nouveau code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Créer le nouveau code d'authentification
    const authCode = await prisma.employeeAuthCode.create({
      data: {
        code,
        phone: employee.phone,
        countryCode: employee.countryCode,
        employeeId: employee.id,
        expiresAt,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_ADDED",
        description: `Code d'accès généré pour ${employee.name}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: employee.companyId,
        metadata: {
          employeeId: employee.id,
          codeGenerated: true,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      code: authCode.code,
      expiresAt: authCode.expiresAt,
      phone: `${employee.countryCode} ${employee.phone}`,
      message: `Code généré pour ${employee.name}. Valide pendant 8 heures.`,
    });
  } catch (error) {
    console.error("Error generating employee code:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
