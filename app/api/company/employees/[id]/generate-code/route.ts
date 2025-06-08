import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmployeeAuthService } from "@/lib/employee-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier l'authentification
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier le rôle (seuls les patrons peuvent générer des codes)
    if (session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Awaiter les params avant d'accéder à id
    const { id: employeeId } = await params;

    console.log("Generating code for employee:", employeeId);

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        employeeAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    console.log(
      "Employee found:",
      employee.name,
      "Company:",
      employee.companyId
    );

    // Vérifier que l'employé appartient à une entreprise du patron
    if (!employee.companyId) {
      return NextResponse.json(
        { error: "L'employé n'est associé à aucune entreprise" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: employee.companyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Cet employé n'appartient pas à l'une de vos entreprises" },
        { status: 403 }
      );
    }

    // Générer un nouveau code
    const code = await EmployeeAuthService.generateEmployeeCode(
      employeeId,
      employee.companyId
    );
    console.log("Generated code:", code);

    // Stocker le code dans la table Activity
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    // Enregistrer l'activité avec le code - inclure l'ID de l'employé dans la description
    const activity = await prisma.activity.create({
      data: {
        type: "EMPLOYEE_ADDED", // Utiliser un type plus approprié
        description: `Code d'authentification généré: ${code} pour employé ${
          employee.id
        } (${employee.name}) - expire le ${expiresAt.toLocaleDateString()}`,
        status: "SUCCESS",
        userId: employee.id, // Associer à l'employé, pas au patron
        companyId: employee.companyId,
        metadata: {
          code: code,
          employeeId: employee.id,
          expiresAt: expiresAt.toISOString(),
          generatedBy: session.user.id,
        },
      },
    });

    console.log("Activity created:", activity.id);

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        countryCode: employee.countryCode,
      },
      message: "Code généré avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la génération du code:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du code",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
