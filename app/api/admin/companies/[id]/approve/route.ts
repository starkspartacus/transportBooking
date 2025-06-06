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

    // Update company status
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { status: "APPROVED" },
    });

    // Create system alert for the approval
    await prisma.systemAlert.create({
      data: {
        type: "COMPANY_APPROVAL",
        title: "Entreprise approuvée",
        description: `L'entreprise ${updatedCompany.name} a été approuvée par ${session.user.name}`,
        severity: "LOW",
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
    console.error("Error approving company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
