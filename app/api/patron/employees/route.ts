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

    // Fixed: Use correct UserRole enum values
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] }, // Fixed: Use correct enum values
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
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
    if (!data.name || !data.email || !data.role) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["GESTIONNAIRE", "CAISSIER"].includes(data.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Create new employee
    const newEmployee = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(newEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
