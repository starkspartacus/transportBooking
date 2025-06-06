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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // Si pas de companyId fourni, utiliser l'entreprise active de l'utilisateur
    let targetCompanyId = companyId;

    if (!targetCompanyId) {
      // Récupérer la première entreprise du patron
      const userCompany = await prisma.company.findFirst({
        where: {
          ownerId: session.user.id,
        },
        select: { id: true },
      });

      if (!userCompany) {
        return NextResponse.json(
          { error: "Aucune entreprise trouvée" },
          { status: 404 }
        );
      }

      targetCompanyId = userCompany.id;
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: targetCompanyId,
        ownerId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les statistiques en parallèle
    const [
      totalRevenue,
      totalReservations,
      totalTrips,
      totalBuses,
      totalRoutes,
      totalEmployees,
      totalSeats,
      occupiedSeats,
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where: {
          companyId: targetCompanyId,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      // Total reservations
      prisma.reservation.count({
        where: { companyId: targetCompanyId },
      }),
      // Total trips
      prisma.trip.count({
        where: { companyId: targetCompanyId },
      }),
      // Total buses
      prisma.bus.count({
        where: { companyId: targetCompanyId },
      }),
      // Total routes
      prisma.route.count({
        where: { companyId: targetCompanyId },
      }),
      // Total employees
      prisma.user.count({
        where: { companyId: targetCompanyId },
      }),
      // Total seats available
      prisma.trip.aggregate({
        where: { companyId: targetCompanyId },
        _sum: { availableSeats: true },
      }),
      // Occupied seats (reservations)
      prisma.reservation.aggregate({
        where: {
          companyId: targetCompanyId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        _sum: { passengerCount: true },
      }),
    ]);

    // Calculer les statistiques récentes (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRevenue, recentReservations, recentTrips] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          companyId: targetCompanyId,
          status: "COMPLETED",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      }),
      prisma.reservation.count({
        where: {
          companyId: targetCompanyId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.trip.count({
        where: {
          companyId: targetCompanyId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Calculer le taux d'occupation
    const totalAvailableSeats = totalSeats._sum.availableSeats || 0;
    const totalOccupiedSeats = occupiedSeats._sum.passengerCount || 0;
    const occupancyRate =
      totalAvailableSeats > 0
        ? (totalOccupiedSeats / totalAvailableSeats) * 100
        : 0;

    const stats = {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalReservations: totalReservations,
      totalTrips: totalTrips,
      totalBuses: totalBuses,
      totalRoutes: totalRoutes,
      totalEmployees: totalEmployees,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      recentStats: {
        revenue: recentRevenue._sum.amount || 0,
        reservations: recentReservations,
        trips: recentTrips,
      },
      // Données pour les graphiques
      monthlyRevenue: [], // À implémenter si nécessaire
      weeklyReservations: [], // À implémenter si nécessaire
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching patron stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
