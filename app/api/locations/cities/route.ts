import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");

    if (!country) {
      return NextResponse.json(
        { error: "Country parameter is required" },
        { status: 400 }
      );
    }

    const departureCities = await prisma.route.findMany({
      distinct: ["departureLocation"],
      select: {
        departureLocation: true,
      },
      where: {
        departureCountry: country,
        departureLocation: {
          not: "",
        },
      },
    });

    const arrivalCities = await prisma.route.findMany({
      distinct: ["arrivalLocation"],
      select: {
        arrivalLocation: true,
      },
      where: {
        arrivalCountry: country,
        arrivalLocation: {
          not: "",
        },
      },
    });

    const allCities = [
      ...departureCities.map((c) => c.departureLocation),
      ...arrivalCities.map((c) => c.arrivalLocation),
    ];

    const uniqueCities = Array.from(new Set(allCities)).sort();

    return NextResponse.json({ cities: uniqueCities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
