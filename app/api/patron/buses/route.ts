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

    const buses = await prisma.bus.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    // Format the data for the frontend
    const formattedBuses = buses.map((bus) => ({
      id: bus.id,
      plateNumber: bus.plateNumber,
      model: bus.model,
      capacity: bus.capacity,
      status: bus.status || "ACTIVE",
      lastMaintenance:
        bus.lastMaintenance?.toISOString() || new Date().toISOString(),
      nextMaintenance:
        bus.nextMaintenance?.toISOString() ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      totalKm: bus.totalKm || 0,
    }));

    return NextResponse.json(formattedBuses);
  } catch (error) {
    console.error("Error fetching buses:", error);
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
    if (!data.plateNumber || !data.model || !data.capacity) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Check if plate number already exists
    const existingBus = await prisma.bus.findFirst({
      where: { plateNumber: data.plateNumber },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: "Ce numéro d'immatriculation est déjà utilisé" },
        { status: 400 }
      );
    }

    // Create new bus
    const newBus = await prisma.bus.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: Number.parseInt(data.capacity),
        status: "ACTIVE",
        companyId,
        totalKm: data.totalKm || 0,
        lastMaintenance: data.lastMaintenance
          ? new Date(data.lastMaintenance)
          : new Date(),
        nextMaintenance: data.nextMaintenance
          ? new Date(data.nextMaintenance)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      id: newBus.id,
      plateNumber: newBus.plateNumber,
      model: newBus.model,
      capacity: newBus.capacity,
      status: newBus.status,
      lastMaintenance: newBus.lastMaintenance.toISOString(),
      nextMaintenance: newBus.nextMaintenance.toISOString(),
      totalKm: newBus.totalKm,
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
