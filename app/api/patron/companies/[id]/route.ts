import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les détails d'une entreprise
export async function GET(
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

    console.log("Fetching company details for:", { userId, companyId });

    // D'abord, vérifier si l'entreprise existe
    const companyExists = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, ownerId: true, name: true },
    });

    console.log("Company exists check:", companyExists);

    if (!companyExists) {
      return NextResponse.json(
        { error: "Entreprise non trouvée dans la base de données" },
        { status: 404 }
      );
    }

    // Vérifier que l'entreprise appartient au patron
    if (companyExists.ownerId !== userId) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette entreprise" },
        { status: 403 }
      );
    }

    // Récupérer les détails complets
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            employees: true,
            buses: true,
            routes: true,
            trips: true,
            reservations: true,
          },
        },
        employees: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employeeRole: true,
            createdAt: true,
          },
        },
        buses: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
            status: true,
            isActive: true,
          },
        },
        routes: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            departureLocation: true,
            arrivalLocation: true,
            distance: true,
            estimatedDuration: true,
            status: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des détails" },
        { status: 500 }
      );
    }

    // Statistiques avec gestion d'erreur
    let stats = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeTrips: 0,
      completedTrips: 0,
    };

    try {
      const [totalRevenue, monthlyRevenue, activeTrips, completedTrips] =
        await Promise.all([
          // Revenus totaux
          prisma.reservation
            .aggregate({
              where: {
                companyId: companyId,
                status: "CONFIRMED",
              },
              _sum: {
                totalAmount: true,
              },
            })
            .catch(() => ({ _sum: { totalAmount: 0 } })),

          // Revenus du mois
          prisma.reservation
            .aggregate({
              where: {
                companyId: companyId,
                status: "CONFIRMED",
                createdAt: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
              _sum: {
                totalAmount: true,
              },
            })
            .catch(() => ({ _sum: { totalAmount: 0 } })),

          // Voyages actifs
          prisma.trip
            .count({
              where: {
                companyId: companyId,
                status: "SCHEDULED",
              },
            })
            .catch(() => 0),

          // Voyages terminés
          prisma.trip
            .count({
              where: {
                companyId: companyId,
                status: "COMPLETED",
              },
            })
            .catch(() => 0),
        ]);

      stats = {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        activeTrips,
        completedTrips,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Garder les stats par défaut
    }

    const companyWithStats = {
      ...company,
      stats,
    };

    console.log("Returning company data:", {
      id: company.id,
      name: company.name,
    });
    return NextResponse.json(companyWithStats);
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
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
