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
        totalTrips: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not fetch companies" },
      { status: 500 }
    );
  }
}
