import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      tripId,
      customerName,
      customerPhone,
      customerEmail,
      seatNumber,
      amountPaid,
      paymentMethod = "CASH",
    } = body;

    // Validate required fields
    if (
      !tripId ||
      !customerName ||
      !customerPhone ||
      !seatNumber ||
      !amountPaid
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
        reservations: {
          include: {
            user: true,
            payments: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if seat is available
    const bookedSeats = trip.reservations.flatMap((r) => r.seatNumbers);
    if (bookedSeats.includes(Number.parseInt(seatNumber))) {
      return NextResponse.json(
        { error: "Seat already taken" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amountPaid < trip.currentPrice) {
      return NextResponse.json(
        { error: "Insufficient payment amount" },
        { status: 400 }
      );
    }

    // Create or find customer
    let customer = await prisma.user.findFirst({
      where: {
        OR: [{ phone: customerPhone }, { email: customerEmail || undefined }],
      },
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          role: "CLIENT",
          firstName: customerName.split(" ")[0],
          lastName: customerName.split(" ").slice(1).join(" ") || "",
        },
      });
    }

    // Create reservation and payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          passengerName: customerName,
          passengerPhone: customerPhone,
          passengerEmail: customerEmail,
          userId: customer.id,
          tripId: trip.id,
          seatNumbers: [Number.parseInt(seatNumber)],
          totalAmount: amountPaid,
          status: "CONFIRMED",
          paymentStatus: "COMPLETED",
          companyId: trip.companyId,
        },
        include: {
          user: true,
          trip: {
            include: {
              route: true,
            },
          },
        },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: amountPaid,
          method: paymentMethod,
          status: "COMPLETED",
          companyId: trip.companyId, // Ajout du champ requis
        },
      });

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber: `TK-${Date.now()}-${seatNumber}`,
          passengerName: customerName,
          passengerPhone: customerPhone,
          passengerEmail: customerEmail,
          seatNumber: Number.parseInt(seatNumber),
          price: amountPaid,
          status: "VALID",
          userId: customer.id,
          tripId: trip.id,
          companyId: trip.companyId,
          reservationId: reservation.id,
        },
      });

      // Create activity log with cashier information
      await tx.activity.create({
        data: {
          type: "TICKET_SALE", // Type valide
          description: `Vente directe de billet: ${customerName} - ${trip.route.departureLocation} → ${trip.route.arrivalLocation}`,
          status: "SUCCESS",
          userId: session.user.id,
          companyId: trip.companyId,
          metadata: {
            action: "CASH_COLLECTION",
            cashierId: session.user.id,
            cashierName: session.user.name,
            amount: amountPaid,
            paymentMethod,
            customerName,
            seatNumber: Number.parseInt(seatNumber),
            paymentId: payment.id,
            ticketId: ticket.id,
            timestamp: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });

      return { reservation, payment, ticket };
    });

    return NextResponse.json({
      success: true,
      reservation: result.reservation,
      payment: result.payment,
      ticket: result.ticket,
      message: "Ticket sold successfully",
    });
  } catch (error) {
    console.error("Sell ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
