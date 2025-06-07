import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const bus = await prisma.bus.findFirst({
      where: {
        id: params.id,
        company: {
          ownerId: session.user.id,
        },
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!bus) {
      return NextResponse.json({ error: "Bus non trouvé" }, { status: 404 });
    }

    // Formatage avec le schéma actuel + valeurs par défaut
    const formattedBus = {
      id: bus.id,
      plateNumber: bus.plateNumber,
      brand: "Mercedes", // Valeur par défaut temporaire
      model: bus.model,
      year: bus.year || new Date().getFullYear(),
      capacity: bus.capacity,
      color: "Blanc", // Valeur par défaut temporaire
      fuelType: "DIESEL", // Valeur par défaut temporaire
      status: bus.status,
      totalKm: bus.mileage || 0,
      insuranceExpiry: bus.insuranceExpiry?.toISOString(),
      technicalInspectionExpiry: bus.technicalControlExpiry?.toISOString(),
      lastMaintenance: bus.lastMaintenance?.toISOString(),
      nextMaintenance: bus.nextMaintenance?.toISOString(),
      equipment: [], // Valeur par défaut temporaire
      company: bus.company,
    };

    return NextResponse.json(formattedBus);
  } catch (error) {
    console.error("Erreur lors de la récupération du bus:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du bus" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      plateNumber,
      brand,
      model,
      year,
      capacity,
      color,
      fuelType,
      status,
      totalKm,
      insuranceExpiry,
      technicalInspectionExpiry,
      lastMaintenance,
      nextMaintenance,
      equipment,
    } = body;

    // Vérifier que le bus appartient à l'utilisateur
    const existingBus = await prisma.bus.findFirst({
      where: {
        id: params.id,
        company: {
          ownerId: session.user.id,
        },
      },
    });

    if (!existingBus) {
      return NextResponse.json({ error: "Bus non trouvé" }, { status: 404 });
    }

    // Vérifier si le numéro d'immatriculation existe déjà (sauf pour ce bus)
    if (plateNumber && plateNumber !== existingBus.plateNumber) {
      const duplicateBus = await prisma.bus.findFirst({
        where: {
          plateNumber: plateNumber,
          id: { not: params.id },
        },
      });

      if (duplicateBus) {
        return NextResponse.json(
          { error: "Ce numéro d'immatriculation existe déjà" },
          { status: 409 }
        );
      }
    }

    // Mettre à jour avec les champs existants seulement
    const updateData: any = {};

    if (plateNumber) updateData.plateNumber = plateNumber;
    if (model) updateData.model = model;
    if (year) updateData.year = Number.parseInt(year);
    if (capacity) updateData.capacity = Number.parseInt(capacity);
    if (status) updateData.status = status;
    if (totalKm !== undefined) updateData.mileage = Number.parseInt(totalKm);
    if (insuranceExpiry) updateData.insuranceExpiry = new Date(insuranceExpiry);
    if (technicalInspectionExpiry)
      updateData.technicalControlExpiry = new Date(technicalInspectionExpiry);
    if (lastMaintenance) updateData.lastMaintenance = new Date(lastMaintenance);
    if (nextMaintenance) updateData.nextMaintenance = new Date(nextMaintenance);

    const updatedBus = await prisma.bus.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedBus.id,
      plateNumber: updatedBus.plateNumber,
      model: updatedBus.model,
      capacity: updatedBus.capacity,
      status: updatedBus.status,
      message: "Bus mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du bus:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du bus" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le bus appartient à l'utilisateur
    const existingBus = await prisma.bus.findFirst({
      where: {
        id: params.id,
        company: {
          ownerId: session.user.id,
        },
      },
    });

    if (!existingBus) {
      return NextResponse.json({ error: "Bus non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des voyages actifs avec ce bus
    const activeTrips = await prisma.trip.findMany({
      where: {
        busId: params.id,
        status: { in: ["SCHEDULED", "BOARDING", "DEPARTED", "IN_TRANSIT"] },
      },
    });

    if (activeTrips.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer ce bus car il a des voyages actifs" },
        { status: 409 }
      );
    }

    // Supprimer le bus
    await prisma.bus.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Bus supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du bus:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du bus" },
      { status: 500 }
    );
  }
}
