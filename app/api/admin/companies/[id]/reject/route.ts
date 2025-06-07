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

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = params.id;
    const body = await request.json();
    const { reason = "Votre demande ne répond pas à nos critères." } = body;

    // Vérifier si l'entreprise existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut de l'entreprise
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        status: "REJECTED",
        isVerified: false,
      },
    });

    // Créer une notification pour le propriétaire
    await prisma.notification.create({
      data: {
        title: "Entreprise rejetée",
        message: `Votre entreprise ${company.name} a été rejetée. Raison: ${reason}`,
        type: "COMPANY_NEWS",
        priority: "HIGH",
        userId: company.owner.id,
        relatedEntityType: "COMPANY",
        relatedEntityId: company.id,
        metadata: {
          reason,
        },
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_SUSPENDED",
        description: `L'entreprise ${
          company.name
        } a été rejetée par l'administrateur ${
          session.user.name || session.user.email
        }`,
        status: "WARNING",
        userId: session.user.id,
        companyId: "system", // Utiliser un ID système pour les activités admin
        metadata: {
          companyId: company.id,
          companyName: company.name,
          adminId: session.user.id,
          adminName: session.user.name || session.user.email,
          reason,
        },
      },
    });

    // Créer une alerte système
    await prisma.systemAlert.create({
      data: {
        type: "COMPANY_REJECTION",
        title: "Entreprise rejetée",
        description: `L'entreprise ${company.name} a été rejetée par ${
          session.user.name || session.user.email
        }`,
        severity: "MEDIUM",
        resolved: true,
      },
    });

    return NextResponse.json({
      success: true,
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        status: updatedCompany.status,
      },
    });
  } catch (error) {
    console.error("Error rejecting company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
