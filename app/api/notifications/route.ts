import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");
    const unreadOnly = url.searchParams.get("unread") === "true";

    // Build query
    const where: any = { userId: session.user.id };
    if (unreadOnly) where.read = false;

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Format the data for the frontend
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      read: notification.read,
      data: notification.data,
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Mark notification as read
    if (data.id) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: data.id },
      });

      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Notification non trouvée" },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: data.id },
        data: { read: true },
      });
    } else if (data.all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id },
        data: { read: true },
      });
    } else {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const all = url.searchParams.get("all") === "true";

    if (id) {
      // Delete single notification
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Notification non trouvée" },
          { status: 404 }
        );
      }

      await prisma.notification.delete({
        where: { id },
      });
    } else if (all) {
      // Delete all notifications
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      });
    } else {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
