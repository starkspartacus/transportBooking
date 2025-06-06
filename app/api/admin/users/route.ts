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
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const limit = Number.parseInt(url.searchParams.get("limit") || "100");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");

    // Build query
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Format the data for the frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || "ACTIVE",
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      company: user.company
        ? {
            name: user.company.name,
          }
        : undefined,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
