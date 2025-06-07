import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = params.id;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            createdAt: true,
          },
        },
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employeeRole: true,
          },
        },
        buses: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
            status: true,
          },
        },
        routes: {
          select: {
            id: true,
            name: true,
            departureLocation: true,
            arrivalLocation: true,
            status: true,
          },
        },
        trips: {
          take: 5,
          orderBy: {
            departureTime: "desc",
          },
          select: {
            id: true,
            departureTime: true,
            arrivalTime: true,
            status: true,
            availableSeats: true,
            _count: {
              select: {
                reservations: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            fileUrl: true,
            isVerified: true,
            expiryDate: true,
          },
        },
        _count: {
          select: {
            employees: true,
            buses: true,
            routes: true,
            trips: true,
            reservations: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Calculer les statistiques supplémentaires
    const stats = await prisma.$transaction([
      // Total des revenus
      prisma.payment.aggregate({
        where: {
          companyId: companyId,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      }),
      // Réservations par statut
      prisma.reservation.groupBy({
        by: ["status"],
        where: {
          companyId: companyId,
        },
        orderBy: {
          status: "asc",
        },
        _count: {
          _all: true,
        },
      }),
      // Activités récentes
      prisma.activity.findMany({
        where: {
          companyId: companyId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          type: true,
          description: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const [revenue, reservationsByStatus, recentActivities] = stats;

    return NextResponse.json({
      ...company,
      stats: {
        totalRevenue: revenue._sum.amount || 0,
        reservationsByStatus,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companyId = params.id;
    const body = await request.json();

    // Vérifier si l'entreprise existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'entreprise
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: body.name,
        description: body.description,
        email: body.email,
        phone: body.phone,
        countryCode: body.countryCode,
        address: body.address,
        country: body.country,
        city: body.city,
        commune: body.commune,
        website: body.website,
        postalCode: body.postalCode,
        licenseNumber: body.licenseNumber,
        taxId: body.taxId,
        foundedYear: body.foundedYear,
        size: body.size,
        isVerified: body.isVerified,
        isActive: body.isActive,
        status: body.status,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_UPDATED",
        description: `L'entreprise ${
          company.name
        } a été mise à jour par l'administrateur ${
          session.user.name || session.user.email
        }`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: "system",
        metadata: {
          companyId: company.id,
          companyName: company.name,
          adminId: session.user.id,
          adminName: session.user.name || session.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
