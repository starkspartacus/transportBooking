import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "ID de l'entreprise requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée ou accès refusé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'entreprise active de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeCompanyId: companyId },
    });

    // Enregistrer l'activité en utilisant un type existant
    await prisma.activity.create({
      data: {
        type: "COMPANY_UPDATED",
        description: `Changement vers l'entreprise ${company.name}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: companyId,
      },
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo,
        isActive: company.isActive,
        isVerified: company.isVerified,
      },
    });
  } catch (error) {
    console.error("Error setting active company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
