import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Supprimer un voyage
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const tripId = params.id;

    // Vérifier que le voyage appartient à l'entreprise du patron
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        company: {
          ownerId: session.user.id,
        },
      },
      include: {
        _count: {
          select: {
            reservations: true,
            tickets: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Voyage non trouvé" }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas de réservations ou tickets
    if (trip._count.reservations > 0 || trip._count.tickets > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce voyage car il a des réservations ou des tickets",
        },
        { status: 400 }
      );
    }

    // Supprimer le voyage
    await prisma.trip.delete({
      where: { id: tripId },
    });

    return NextResponse.json({ message: "Voyage supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
