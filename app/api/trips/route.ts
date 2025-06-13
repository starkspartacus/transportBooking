import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@prisma/client"; // Import TripStatus enum

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const companyId = searchParams.get("company");
    const sortBy = searchParams.get("sortBy") || "departure"; // Default sort by departure time
    const departureCountry = searchParams.get("departureCountry");
    const arrivalCountry = searchParams.get("arrivalCountry");

    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const where: any = {
      status: TripStatus.SCHEDULED, // Only show active trips by default
    };

    // Build route filter conditions
    const routeWhere: any = {};
    if (from) {
      routeWhere.departureLocation = {
        contains: from,
        mode: "insensitive",
      };
    }
    if (to) {
      routeWhere.arrivalLocation = {
        contains: to,
        mode: "insensitive",
      };
    }
    if (departureCountry) {
      routeWhere.departureCountry = departureCountry;
    }
    if (arrivalCountry) {
      routeWhere.arrivalCountry = arrivalCountry;
    }

    if (Object.keys(routeWhere).length > 0) {
      where.route = routeWhere;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.departureTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (minPrice) {
      where.price = {
        gte: Number.parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: Number.parseFloat(maxPrice),
      };
    }

    if (companyId && companyId !== "all") {
      where.companyId = companyId;
    }

    let orderBy: any = {};
    switch (sortBy) {
      case "price":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "departure":
        orderBy = { departureTime: "asc" };
        break;
      case "duration":
        orderBy = { route: { estimatedDuration: "asc" } };
        break;
      default:
        orderBy = { departureTime: "asc" };
        break;
    }

    const [trips, totalCount] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        include: {
          route: {
            select: {
              id: true,
              name: true,
              departureLocation: true,
              arrivalLocation: true,
              basePrice: true,
              estimatedDuration: true,
              distance: true,
            },
          },
          bus: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              capacity: true,
              brand: true,
              features: true, // Ensure features are selected
            },
          },
          company: {
            select: {
              id: true,
              name: true, // Ensure company name is selected
              logo: true,
              rating: true,
            },
          },
          _count: {
            select: {
              reservations: true,
              tickets: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    // Calculate available seats for each trip
    const tripsWithAvailableSeats = trips.map((trip) => ({
      ...trip,
      availableSeats: trip.bus.capacity - (trip._count?.reservations || 0),
    }));

    return NextResponse.json({ trips: tripsWithAvailableSeats, totalCount });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}
