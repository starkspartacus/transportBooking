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
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        isArchived: !existingCompany.isArchived,
      },
    });

    // Créer une activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_UPDATED",
        description: `Entreprise "${company.name}" ${
          company.isArchived ? "archivée" : "désarchivée"
        }`,
        status: "INFO",
        userId: session.user.id,
        companyId: company.id,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error archiving company:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'archivage" },
      { status: 500 }
    );
  }
}
