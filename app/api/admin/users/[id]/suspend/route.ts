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

    const userId = params.id;

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED" },
    });

    // Create system alert for the suspension
    await prisma.systemAlert.create({
      data: {
        type: "USER_SUSPENSION",
        title: "Utilisateur suspendu",
        description: `L'utilisateur ${updatedUser.name} a été suspendu par ${session.user.name}`,
        severity: "MEDIUM",
        resolved: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
