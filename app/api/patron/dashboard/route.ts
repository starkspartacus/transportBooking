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

    const userId = session.user.id;

    // Récupérer toutes les entreprises du patron
    const companies = await prisma.company.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        logo: true,
        isActive: true,
        isVerified: true,
      },
    });

    const companyIds = companies.map((company) => company.id);

    // Obtenir les statistiques globales
    const [
      totalRevenue,
      totalTrips,
      totalBuses,
      totalEmployees,
      totalReservations,
      recentActivities,
    ] = await Promise.all([
      // Total des revenus
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          companyId: { in: companyIds },
        },
      }),

      // Total des voyages
      prisma.trip.count({
        where: {
          companyId: { in: companyIds },
        },
      }),

      // Total des bus
      prisma.bus.count({
        where: {
          companyId: { in: companyIds },
        },
      }),

      // Total des employés
      prisma.user.count({
        where: {
          companyId: { in: companyIds },
          role: { in: ["GESTIONNAIRE", "CAISSIER"] },
        },
      }),

      // Total des réservations
      prisma.reservation.count({
        where: {
          companyId: { in: companyIds },
        },
      }),

      // Activités récentes
      prisma.activity.findMany({
        where: {
          companyId: { in: companyIds },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          company: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Statistiques par entreprise
    const companyStats = await Promise.all(
      companies.map(async (company) => {
        const [revenue, trips, buses, employees, reservations] =
          await Promise.all([
            prisma.payment.aggregate({
              _sum: { amount: true },
              where: {
                status: "COMPLETED",
                companyId: company.id,
              },
            }),
            prisma.trip.count({ where: { companyId: company.id } }),
            prisma.bus.count({ where: { companyId: company.id } }),
            prisma.user.count({
              where: {
                companyId: company.id,
                role: { in: ["GESTIONNAIRE", "CAISSIER"] },
              },
            }),
            prisma.reservation.count({ where: { companyId: company.id } }),
          ]);

        return {
          id: company.id,
          name: company.name,
          logo: company.logo,
          isActive: company.isActive,
          isVerified: company.isVerified,
          stats: {
            revenue: revenue._sum.amount || 0,
            trips,
            buses,
            employees,
            reservations,
          },
        };
      })
    );

    // Préparer la réponse
    const dashboard = {
      globalStats: {
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTrips,
        totalBuses,
        totalEmployees,
        totalReservations,
        totalCompanies: companies.length,
      },
      companies: companyStats,
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        status: activity.status,
        companyName: activity.company.name,
        createdAt: activity.createdAt,
      })),
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Error fetching patron dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
