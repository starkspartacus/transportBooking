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

    const companyId = params.id;
    const userId = session.user.id;

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Basculer le statut
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { isActive: !company.isActive },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_UPDATED",
        description: `Entreprise ${company.name} ${
          updatedCompany.isActive ? "activée" : "désactivée"
        }`,
        status: "SUCCESS",
        userId: userId,
        companyId: companyId,
      },
    });

    return NextResponse.json({
      company: updatedCompany,
      message: `Entreprise ${
        updatedCompany.isActive ? "activée" : "désactivée"
      } avec succès`,
    });
  } catch (error) {
    console.error("Error toggling company status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
