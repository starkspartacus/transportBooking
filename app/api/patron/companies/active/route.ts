import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer l'entreprise active du patron
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeCompanyId: true },
    });

    if (!user?.activeCompanyId) {
      // Si aucune entreprise active, trouver la première entreprise du patron
      const firstCompany = await prisma.company.findFirst({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
      });

      if (firstCompany) {
        // Définir cette entreprise comme active
        await prisma.user.update({
          where: { id: userId },
          data: { activeCompanyId: firstCompany.id },
        });

        return NextResponse.json(firstCompany);
      }

      return NextResponse.json(null);
    }

    const activeCompany = await prisma.company.findUnique({
      where: { id: user.activeCompanyId },
    });

    return NextResponse.json(activeCompany);
  } catch (error) {
    console.error("Error fetching active company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Changer l'entreprise active du patron
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "ID d'entreprise requis" },
        { status: 400 }
      );
    }

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

    // Mettre à jour l'entreprise active
    await prisma.user.update({
      where: { id: userId },
      data: { activeCompanyId: companyId },
    });

    return NextResponse.json({
      message: "Entreprise active mise à jour",
      company,
    });
  } catch (error) {
    console.error("Error updating active company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
