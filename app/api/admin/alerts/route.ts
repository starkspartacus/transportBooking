import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const resolved = url.searchParams.get("resolved") === "true";
    const severity = url.searchParams.get("severity");
    const limit = Number.parseInt(url.searchParams.get("limit") || "50");

    // Build query
    const where: any = {};
    if (resolved !== null) where.resolved = resolved;
    if (severity) where.severity = severity;

    // Get alerts
    const alerts = await prisma.systemAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Format the data for the frontend
    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      timestamp: alert.createdAt.toISOString(),
      resolved: alert.resolved,
    }));

    return NextResponse.json(formattedAlerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.description || !data.type || !data.severity) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Create new alert
    const newAlert = await prisma.systemAlert.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        severity: data.severity,
        resolved: false,
      },
    });

    return NextResponse.json({
      id: newAlert.id,
      type: newAlert.type,
      title: newAlert.title,
      description: newAlert.description,
      severity: newAlert.severity,
      timestamp: newAlert.createdAt.toISOString(),
      resolved: newAlert.resolved,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
