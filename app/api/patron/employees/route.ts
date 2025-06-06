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

    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ["MANAGER", "CASHIER"] },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the data for the frontend
    const formattedEmployees = employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status || "ACTIVE",
      hireDate: employee.createdAt.toISOString(),
      lastLogin: employee.lastLogin?.toISOString(),
    }));

    return NextResponse.json(formattedEmployees);
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
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
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
        password: data.password, // Note: In a real app, this should be hashed
        role: data.role,
        companyId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      id: newEmployee.id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      status: newEmployee.status || "ACTIVE",
      hireDate: newEmployee.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
