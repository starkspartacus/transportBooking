import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Number.parseInt(url.searchParams.get("limit") || "100");
    const offset = Number.parseInt(url.searchParams.get("offset") || "0");

    // Build query
    const where = status ? { status } : {};

    // Get companies
    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: true,
            trips: true,
          },
        },
        trips: {
          select: {
            reservations: {
              select: {
                payment: {
                  select: {
                    amount: true,
                  },
                },
              },
              where: {
                payment: {
                  status: "COMPLETED",
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Format the data for the frontend
    const formattedCompanies = companies.map((company) => {
      // Calculate total revenue
      const totalRevenue = company.trips.reduce((sum, trip) => {
        return (
          sum +
          trip.reservations.reduce((tripSum, reservation) => {
            return tripSum + (reservation.payment?.amount || 0);
          }, 0)
        );
      }, 0);

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        country: company.country,
        city: company.city,
        status: company.status,
        createdAt: company.createdAt.toISOString(),
        totalEmployees: company._count.employees,
        totalTrips: company._count.trips,
        totalRevenue,
      };
    });

    return NextResponse.json(formattedCompanies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
