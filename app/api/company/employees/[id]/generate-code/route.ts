import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params: { id: employeeId } }: { params: { id: string } }
) {
  try {
    // Attendre la session avant d'utiliser les paramètres
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier les rôles autorisés (ajout de ADMIN pour plus de flexibilité)
    if (!["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)) {
      return NextResponse.json(
        {
          error: "Non autorisé pour cette action",
          role: session.user.role,
        },
        { status: 403 }
      );
    }

    // Utiliser params.id de manière sûre (params est déjà disponible, pas besoin d'attendre)
    console.log(`Generating code for employee ID: ${employeeId}`);

    // Récupérer l'employé avec ses informations
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

    console.log("Employee data:", JSON.stringify(employee, null, 2));

    if (!employee) {
      return NextResponse.json(
        {
          error: "Employé non trouvé",
          code: "EMPLOYEE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Vérifier l'accès pour les patrons (ils doivent être propriétaires de l'entreprise)
    if (session.user.role === "PATRON") {
      // Vérifier que l'entreprise appartient au patron
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId as string,
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json(
          {
            error: "Vous n'avez pas accès à cet employé",
            code: "ACCESS_DENIED",
          },
          { status: 403 }
        );
      }
    }

    // Essayer de récupérer les données du body si présentes
    let phoneData = {};
    try {
      const body = await request.json().catch(() => ({}));
      if (body && typeof body === "object") {
        phoneData = body;
      }
    } catch (e) {
      // Pas de body ou format invalide, on continue avec les données existantes
      console.log("No valid body data:", e);
    }

    // Mise à jour du téléphone si fourni dans la requête
    if (phoneData && "phone" in phoneData && "countryCode" in phoneData) {
      await prisma.user.update({
        where: { id: employee.id },
        data: {
          phone: phoneData.phone as string,
          countryCode: phoneData.countryCode as string,
        },
      });

      // Mettre à jour les données en mémoire
      employee.phone = phoneData.phone as string;
      employee.countryCode = phoneData.countryCode as string;

      console.log("Updated phone data:", phoneData);
    }

    // Validation du téléphone
    if (!employee.phone || employee.phone.trim() === "") {
      return NextResponse.json(
        {
          error: "Numéro de téléphone manquant",
          details:
            "L'employé doit avoir un numéro de téléphone valide pour générer un code d'accès",
          code: "MISSING_PHONE",
          employeeId: employee.id,
          name: employee.name,
        },
        { status: 400 }
      );
    }

    if (!employee.countryCode || employee.countryCode.trim() === "") {
      return NextResponse.json(
        {
          error: "Indicatif pays manquant",
          details: "L'employé doit avoir un indicatif pays valide",
          code: "MISSING_COUNTRY_CODE",
          employeeId: employee.id,
          name: employee.name,
        },
        { status: 400 }
      );
    }

    if (employee.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Employé inactif",
          details:
            "Seuls les employés actifs peuvent recevoir des codes d'accès",
          code: "INACTIVE_EMPLOYEE",
          employeeId: employee.id,
          name: employee.name,
          status: employee.status,
        },
        { status: 400 }
      );
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
        userId: session.user.id,
        companyId: employee.companyId,
        metadata: {
          employeeId: employee.id,
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
        id: employee.id,
        name: employee.name,
        role: employee.role,
      },
      message: "Code d'accès généré avec succès",
    });
  } catch (error) {
    console.error("Error generating employee code:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue s'est produite",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Endpoint pour mettre à jour le téléphone d'un employé
export async function PATCH(
  request: NextRequest,
  { params: { id: employeeId } }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Élargir les rôles autorisés
    if (!["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();

    if (!body || !body.phone || !body.countryCode) {
      return NextResponse.json(
        {
          error: "Données manquantes",
          details: "Le numéro de téléphone et l'indicatif pays sont requis",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        companyId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'accès pour les patrons
    if (session.user.role === "PATRON") {
      // Vérifier que l'entreprise appartient au patron
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId as string,
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Accès non autorisé à cet employé" },
          { status: 403 }
        );
      }
    }

    // Mettre à jour le téléphone
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        phone: body.phone,
        countryCode: body.countryCode,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        countryCode: true,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_UPDATED",
        description: `Téléphone mis à jour pour ${employee.name}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: employee.companyId,
        metadata: {
          employeeId: employee.id,
          updatedFields: ["phone", "countryCode"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: "Téléphone mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating employee phone:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
