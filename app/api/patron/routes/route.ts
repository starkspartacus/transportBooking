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

    const routes = await prisma.route.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { trips: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the data for the frontend
    const formattedRoutes = routes.map((route) => ({
      id: route.id,
      name: route.name,
      departure: route.departureLocation,
      arrival: route.arrivalLocation,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      price: route.price,
      status: route.status || "ACTIVE",
      totalTrips: route._count.trips,
    }));

    return NextResponse.json(formattedRoutes);
  } catch (error) {
    console.error("Error fetching routes:", error);
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
    if (!data.name || !data.departure || !data.arrival || !data.price) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Create new route
    const newRoute = await prisma.route.create({
      data: {
        name: data.name,
        departureLocation: data.departure,
        arrivalLocation: data.arrival,
        distance: data.distance || 0,
        estimatedDuration: data.estimatedDuration || 0,
        price: Number.parseFloat(data.price),
        status: "ACTIVE",
        companyId,
      },
    });

    return NextResponse.json({
      id: newRoute.id,
      name: newRoute.name,
      departure: newRoute.departureLocation,
      arrival: newRoute.arrivalLocation,
      distance: newRoute.distance,
      estimatedDuration: newRoute.estimatedDuration,
      price: newRoute.price,
      status: newRoute.status,
      totalTrips: 0,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
