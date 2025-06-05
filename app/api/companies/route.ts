import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const isVerified = searchParams.get("isVerified");

    const whereClause: any = {};

    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }

    if (isVerified !== null) {
      whereClause.isVerified = isVerified === "true";
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        logo: true,
        country: true,
        city: true,
        commune: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
