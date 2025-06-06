import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define Activity type since Prisma client might not be updated yet
interface Activity {
  id: string;
  type: string;
  description: string;
  status: string;
  userId?: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string | null;
  } | null;
}

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

    // Use raw query as fallback if Activity model is not available
    let activities: Activity[] = [];

    try {
      // Try to use the Activity model
      activities = await (prisma as any).activity.findMany({
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
    } catch (error) {
      // Fallback to raw SQL query
      console.log("Using raw SQL query for activities");
      const rawActivities = (await prisma.$queryRaw`
        SELECT 
          a.id,
          a.type,
          a.description,
          a.status,
          a."userId",
          a."companyId",
          a."createdAt",
          a."updatedAt",
          u.name as "userName"
        FROM "Activity" a
        LEFT JOIN "User" u ON a."userId" = u.id
        WHERE a."companyId" = ${companyId}
        ORDER BY a."createdAt" DESC
        LIMIT 20
      `) as any[];

      activities = rawActivities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        status: activity.status,
        userId: activity.userId,
        companyId: activity.companyId,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        user: activity.userName ? { name: activity.userName } : null,
      }));
    }

    // Format the data for the frontend
    const formattedActivities = activities.map((activity: Activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      user: activity.user?.name || "Système",
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

    let newActivity: Activity;

    try {
      // Try to use the Activity model
      newActivity = await (prisma as any).activity.create({
        data: {
          type: data.type,
          description: data.description,
          status: data.status || "INFO",
          companyId,
          userId: session.user.id,
        },
      });
    } catch (error) {
      // Fallback to raw SQL query
      console.log("Using raw SQL query to create activity");
      const id = `activity_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await prisma.$executeRaw`
        INSERT INTO "Activity" (id, type, description, status, "userId", "companyId", "createdAt", "updatedAt")
        VALUES (${id}, ${data.type}, ${data.description}, ${
        data.status || "INFO"
      }, ${session.user.id}, ${companyId}, NOW(), NOW())
      `;

      newActivity = {
        id,
        type: data.type,
        description: data.description,
        status: data.status || "INFO",
        userId: session.user.id,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

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
