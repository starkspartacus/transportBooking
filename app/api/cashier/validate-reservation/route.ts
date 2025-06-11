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
    const { reservationId, validationCode, paymentMethod = "CASH" } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID required" },
        { status: 400 }
      );
    }

    // Get reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        trip: {
          include: {
            route: true,
            company: true,
          },
        },
        user: true,
        payments: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if already paid
    const existingPayment = reservation.payments.find(
      (p) => p.status === "COMPLETED"
    );
    if (existingPayment) {
      return NextResponse.json(
        { error: "Reservation already paid" },
        { status: 400 }
      );
    }

    // Validate company access
    if (reservation.trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized access to this reservation" },
        { status: 403 }
      );
    }

    // Generate validation code if not provided
    const finalValidationCode =
      validationCode ||
      `VAL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 4)
        .toUpperCase()}`;

    // Update reservation and create payment
    const result = await prisma.$transaction(async (tx) => {
      // Update reservation status
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "COMPLETED",
        },
        include: {
          trip: {
            include: {
              route: true,
            },
          },
          user: true,
        },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: reservation.totalAmount,
          method: paymentMethod,
          status: "COMPLETED",
          companyId: reservation.companyId, // Ajout du champ requis
        },
      });

      // Create or update tickets
      const tickets = await Promise.all(
        reservation.seatNumbers.map(async (seatNumber) => {
          return tx.ticket.create({
            data: {
              ticketNumber: `TK-${Date.now()}-${seatNumber}`,
              passengerName: reservation.passengerName,
              passengerPhone: reservation.passengerPhone,
              passengerEmail: reservation.passengerEmail,
              seatNumber: seatNumber,
              price: reservation.totalAmount / reservation.seatNumbers.length,
              status: "VALID",
              userId: reservation.userId,
              tripId: reservation.tripId,
              companyId: reservation.companyId,
              reservationId: reservation.id,
              verificationCode: finalValidationCode,
            },
          });
        })
      );

      // Create reservation validation activity log
      await tx.activity.create({
        data: {
          type: "PAYMENT_COMPLETED", // Type valide
          description: `Validation et encaissement: ${reservation.user.name} - Code: ${finalValidationCode}`,
          status: "SUCCESS",
          userId: session.user.id,
          companyId: reservation.trip.companyId,
          metadata: {
            reservationId,
            validationCode: finalValidationCode,
            customerName: reservation.user.name,
            amount: reservation.totalAmount,
            paymentMethod,
            paymentId: payment.id,
            ticketIds: tickets.map((t) => t.id),
            cashierId: session.user.id,
            cashierName: session.user.name,
            timestamp: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });

      // Create security audit log
      await tx.activity.create({
        data: {
          type: "TICKET_SALE", // Type valide
          description: `Encaissement sécurisé - Caissier: ${session.user.name} - Montant: ${reservation.totalAmount} FCFA`,
          status: "SUCCESS",
          userId: session.user.id,
          companyId: reservation.trip.companyId,
          metadata: {
            action: "CASH_COLLECTION",
            cashierId: session.user.id,
            cashierName: session.user.name,
            amount: reservation.totalAmount,
            reservationId,
            customerName: reservation.user.name,
            paymentId: payment.id,
            validationCode: finalValidationCode,
            timestamp: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });

      return { reservation: updatedReservation, payment, tickets };
    });

    return NextResponse.json({
      success: true,
      reservation: result.reservation,
      payment: result.payment,
      tickets: result.tickets,
      validationCode: finalValidationCode,
      message: "Reservation validated and payment processed successfully",
    });
  } catch (error) {
    console.error("Validate reservation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
