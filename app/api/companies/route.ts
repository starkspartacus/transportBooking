import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        logo: true,
        country: true,
        city: true,
        commune: true,
        rating: true,
        // ADDED: Include a count of active trips for each company
        _count: {
          select: {
            trips: {
              where: {
                status: { in: ["SCHEDULED", "BOARDING"] }, // Only count trips that are scheduled or boarding
                isArchived: false, // Exclude archived trips
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Map the result to include totalTrips directly
    const companiesWithTripCount = companies.map((company) => ({
      ...company,
      totalTrips: company._count.trips, // Assign the counted trips
    }));

    return NextResponse.json(companiesWithTripCount);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not fetch companies" },
      { status: 500 }
    );
  }
}
