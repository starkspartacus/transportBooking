import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const preferences = await request.json();

    // Sauvegarder les préférences de notification
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: preferences,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
