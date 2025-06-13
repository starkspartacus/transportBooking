import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departureCountries = await prisma.route.findMany({
      distinct: ["departureCountry"],
      select: {
        departureCountry: true,
      },
      where: {
        departureCountry: {
          not: "",
        },
      },
    });

    const arrivalCountries = await prisma.route.findMany({
      distinct: ["arrivalCountry"],
      select: {
        arrivalCountry: true,
      },
      where: {
        arrivalCountry: {
          not: "",
        },
      },
    });

    const allCountries = [
      ...departureCountries.map((c) => c.departureCountry),
      ...arrivalCountries.map((c) => c.arrivalCountry),
    ];

    const uniqueCountries = Array.from(new Set(allCountries)).sort();

    return NextResponse.json({ countries: uniqueCountries });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
