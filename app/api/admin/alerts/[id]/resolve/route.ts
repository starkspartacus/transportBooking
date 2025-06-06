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

    const alertId = params.id;

    // Update alert status
    const updatedAlert = await prisma.systemAlert.update({
      where: { id: alertId },
      data: { resolved: true },
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: updatedAlert.id,
        title: updatedAlert.title,
        resolved: updatedAlert.resolved,
      },
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
