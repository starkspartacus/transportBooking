import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Get recent activities
    const activities = await prisma.activity.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the data for the frontend
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      user: activity.user?.name,
      status: activity.status || "INFO",
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.description) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Create new activity
    const newActivity = await prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        status: data.status || "INFO",
        companyId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: newActivity.id,
      type: newActivity.type,
      description: newActivity.description,
      timestamp: newActivity.createdAt.toISOString(),
      user: session.user.name,
      status: newActivity.status,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
