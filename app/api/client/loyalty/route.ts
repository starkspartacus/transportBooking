import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer ou créer les données de fidélité
    let loyalty = await prisma.clientLoyalty.findUnique({
      where: { userId: session.user.id },
    });

    if (!loyalty) {
      loyalty = await prisma.clientLoyalty.create({
        data: {
          userId: session.user.id,
          points: 0,
          level: "BRONZE",
          totalSpent: 0,
          totalTrips: 0,
        },
      });
    }

    // Récupérer les récompenses disponibles
    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
    });

    // Récupérer l'historique des voyages récents
    const recentTrips = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculer les points pour le prochain niveau
    const levelThresholds = {
      BRONZE: 0,
      SILVER: 1000,
      GOLD: 2500,
      PLATINUM: 5000,
    };

    const currentLevel = loyalty.level as keyof typeof levelThresholds;
    const levels = Object.keys(levelThresholds) as Array<
      keyof typeof levelThresholds
    >;
    const currentLevelIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentLevelIndex + 1];
    const nextLevelPoints = nextLevel ? levelThresholds[nextLevel] : 0;

    const tripHistory = recentTrips.map((reservation) => ({
      id: reservation.id,
      date: reservation.createdAt.toISOString(),
      route: `${reservation.trip.route.departureLocation} → ${reservation.trip.route.arrivalLocation}`,
      amount: reservation.totalAmount,
      status: reservation.status,
      pointsEarned: Math.floor(reservation.totalAmount / 1000), // 1 point par 1000 FCFA
    }));

    return NextResponse.json({
      points: loyalty.points,
      level: loyalty.level,
      totalSpent: loyalty.totalSpent,
      totalTrips: loyalty.totalTrips,
      nextLevelPoints: nextLevelPoints,
      rewards: rewards,
      recentTrips: tripHistory,
    });
  } catch (error) {
    console.error("Error fetching loyalty data:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
