import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocket } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.title || !data.message || !data.userId) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        companyId: data.companyId,
        read: false,
        data: data.data || {},
      },
    });

    // Send notification via socket
    const io = getSocket();
    io.to(`user:${data.userId}`).emit("notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      read: notification.read,
      data: notification.data,
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
