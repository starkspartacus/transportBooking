import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: employeeId } = await params;

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
        lastLogin: true,
        companyId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else if (session.user.companyId !== employee.companyId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();

    // Vérifier que l'employé existe
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Supprimer les champs qui ne sont pas dans le schéma
    const { age, employeeRole, ...validData } = body;

    // Mettre à jour l'employé
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        ...validData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: employeeId } = await params;

    // Vérifier que l'employé existe
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Supprimer l'employé
    await prisma.user.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
