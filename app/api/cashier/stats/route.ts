import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get daily stats
    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        reservation: {
          include: {
            trip: true,
          },
        },
      },
    });

    const totalSales = payments.length;
    const totalAmount = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const cashSales = payments.filter((p) => p.method === "CASH").length;
    const cardSales = payments.filter((p) => p.method === "CREDIT_CARD").length;
    const mobileSales = payments.filter(
      (p) => p.method === "MOBILE_MONEY"
    ).length;

    return NextResponse.json({
      totalSales,
      totalAmount,
      cashSales,
      cardSales,
      mobileSales,
    });
  } catch (error) {
    console.error("Get cashier stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
