import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cinetpayService } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("CinetPay webhook received:", body);

    const {
      cpm_trans_id: transactionId,
      cpm_trans_status: status,
      cpm_amount: amount,
      signature,
    } = body;

    // Validate webhook signature
    if (!cinetpayService.validateWebhookSignature(body, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Find the reservation
    const reservation = await prisma.reservation.findFirst({
      where: { paymentReference: transactionId },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            company: true,
          },
        },
        user: true,
      },
    });

    if (!reservation) {
      console.error("Reservation not found for transaction:", transactionId);
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (status === "ACCEPTED") {
      // Payment successful
      await prisma.$transaction(async (tx) => {
        // Update reservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
          },
        });

        // Create payment record
        const payment = await tx.payment.create({
          data: {
            reservationId: reservation.id,
            amount: Number.parseFloat(amount),
            method: "MOBILE_MONEY",
            status: "PAID",
            reference: transactionId,
            companyId: reservation.companyId,
          },
        });

        // Generate QR code data
        const qrData = {
          ticketId: `TK-${Date.now()}-${reservation.seatNumbers[0]}`,
          reservationId: reservation.id,
          tripId: reservation.tripId,
          seatNumber: reservation.seatNumbers[0],
          timestamp: Date.now(),
        };
        const qrHash = cinetpayService.generateHash(JSON.stringify(qrData));

        // Create ticket
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: qrData.ticketId,
            passengerName: reservation.passengerName,
            passengerPhone: reservation.passengerPhone,
            passengerEmail: reservation.passengerEmail,
            seatNumber: reservation.seatNumbers[0],
            price: Number.parseFloat(amount),
            status: "VALID",
            qrCode: JSON.stringify(qrData),
            qrHash: qrHash,
            userId: reservation.userId,
            tripId: reservation.tripId,
            companyId: reservation.companyId,
            reservationId: reservation.id,
          },
        });

        // Update activity
        await tx.activity.create({
          data: {
            type: "PAYMENT_COMPLETED",
            description: `Paiement mobile money réussi: ${reservation.passengerName} - ${amount} FCFA`,
            status: "SUCCESS",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              reservationId: reservation.id,
              paymentId: payment.id,
              ticketId: ticket.id,
              transactionId: transactionId,
              amount: Number.parseFloat(amount),
              paymentMethod: "MOBILE_MONEY",
            },
          },
        });

        // Send notification (you can implement email/SMS here)
        console.log(
          `Ticket created for ${reservation.passengerName}: ${ticket.ticketNumber}`
        );
      });
    } else {
      // Payment failed
      await prisma.$transaction(async (tx) => {
        // Update reservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
          },
        });

        // Log failed payment
        await tx.activity.create({
          data: {
            type: "PAYMENT_FAILED",
            description: `Paiement mobile money échoué: ${reservation.passengerName} - ${amount} FCFA`,
            status: "FAILED",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              reservationId: reservation.id,
              transactionId: transactionId,
              amount: Number.parseFloat(amount),
              paymentMethod: "MOBILE_MONEY",
              reason: "Payment rejected by provider",
            },
          },
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
