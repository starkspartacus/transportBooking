import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Mettre à jour le statut d'un voyage
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const tripId = params.id;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 });
    }

    // Vérifier que le voyage appartient à l'entreprise du patron
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        company: {
          ownerId: session.user.id,
        },
      },
      include: {
        route: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Voyage non trouvé" }, { status: 404 });
    }

    // Mettre à jour le statut
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { status },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "TRIP_UPDATED",
        description: `Statut du voyage ${trip.route.name} mis à jour: ${status}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: trip.companyId,
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
