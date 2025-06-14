import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return new NextResponse("Company ID is required", { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: {
        id: id,
      },
      include: {
        employees: {
          where: {
            status: "ACTIVE", // Only fetch active employees for dashboard stats
          },
        },
        buses: {
          where: {
            status: "ACTIVE", // Only fetch active buses for dashboard stats
          },
        },
        routes: {
          where: {
            status: "ACTIVE", // Only fetch active routes for dashboard stats
          },
        },
        trips: {
          // Fetch all trips to calculate total revenue and scheduled trips
          include: {
            route: true,
            bus: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        // Include other relations if needed for the dashboard, e.g., documents, subscriptions
      },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    // Authorization check: Only the owner or an admin can view company details
    const isOwner = company.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Calculate computed properties for the dashboard
    const totalRevenue = company.trips.reduce(
      (sum, trip) => sum + trip.basePrice,
      0
    );
    const activeEmployeesCount = company.employees.length;
    const activeBusesCount = company.buses.length;
    const activeRoutesCount = company.routes.length;
    const scheduledTripsCount = company.trips.filter(
      (trip) => trip.status === "SCHEDULED"
    ).length;

    // Return a simplified company object with computed stats
    const companyWithStats = {
      ...company,
      totalRevenue,
      activeEmployees: activeEmployeesCount,
      activeBuses: activeBusesCount,
      activeRoutes: activeRoutesCount,
      scheduledTrips: scheduledTripsCount,
    };

    return NextResponse.json(companyWithStats);
  } catch (error) {
    console.error("Error fetching company details:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH - Mettre à jour une entreprise
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const companyId = params.id;
    const data = await request.json();

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par une autre entreprise
    if (data.email && data.email !== company.email) {
      const existingCompanyEmail = await prisma.company.findFirst({
        where: {
          email: data.email,
          id: { not: companyId },
        },
      });

      if (existingCompanyEmail) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par une autre entreprise" },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'entreprise
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        address: data.address,
        country: data.country,
        city: data.city,
        commune: data.commune,
        website: data.website,
        taxId: data.taxId,
        foundedYear: data.foundedYear
          ? Number.parseInt(data.foundedYear)
          : undefined,
        size: data.size,
        isActive: data.isActive,
      },
    });

    // Enregistrer l'activité
    try {
      await prisma.activity.create({
        data: {
          type: "COMPANY_UPDATED",
          description: `Entreprise ${updatedCompany.name} mise à jour`,
          status: "SUCCESS",
          userId: userId,
          companyId: companyId,
        },
      });
    } catch (error) {
      console.error("Error creating activity:", error);
      // Ne pas faire échouer la mise à jour pour ça
    }

    return NextResponse.json({
      company: updatedCompany,
      message: "Entreprise mise à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une entreprise
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const companyId = params.id;

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si c'est l'entreprise active du patron
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeCompanyId: true },
    });

    if (user?.activeCompanyId === companyId) {
      // Trouver une autre entreprise à définir comme active
      const anotherCompany = await prisma.company.findFirst({
        where: {
          ownerId: userId,
          id: { not: companyId },
        },
      });

      // Mettre à jour l'entreprise active
      await prisma.user.update({
        where: { id: userId },
        data: { activeCompanyId: anotherCompany?.id || null },
      });
    }

    // Supprimer l'entreprise (cascade delete géré par Prisma)
    await prisma.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({
      message: "Entreprise supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
