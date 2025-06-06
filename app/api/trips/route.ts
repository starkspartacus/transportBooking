import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        route: {
          include: {
            departure: true,
            arrival: true,
          },
        },
        bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
            amenities: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            rating: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.log(error);
    return NextResponse.error();
  }
}
