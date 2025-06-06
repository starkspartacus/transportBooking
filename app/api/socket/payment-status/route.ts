import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSocket } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !["PATRON", "MANAGER", "CASHIER", "CLIENT"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.paymentId || !data.success) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        reservation: {
          include: {
            trip: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: data.paymentId },
      data: { status: data.success ? "COMPLETED" : "FAILED" },
    });

    // If payment successful, update reservation status
    if (data.success) {
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { status: "CONFIRMED" },
      });

      // Create ticket if payment successful
      const ticket = await prisma.ticket.create({
        data: {
          reservationId: payment.reservationId,
          ticketCode: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
          qrCode: `${payment.reservationId}-${Date.now()}`,
          status: "ACTIVE",
        },
      });
    }

    // Send notification via socket
    const io = getSocket();

    // Notify company staff
    if (payment.reservation.trip.companyId) {
      io.to(`company:${payment.reservation.trip.companyId}`).emit(
        "payment-processed",
        {
          paymentId: payment.id,
          success: data.success,
          amount: payment.amount,
          reservationId: payment.reservationId,
          reservationCode: payment.reservation.reservationCode,
        }
      );
    }

    // Notify user if exists
    if (payment.reservation.userId) {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          type: data.success ? "PAYMENT_COMPLETED" : "PAYMENT_FAILED",
          title: data.success ? "Paiement confirmé" : "Échec du paiement",
          message: data.success
            ? `Votre paiement de ${payment.amount} FCFA a été confirmé`
            : `Le paiement de ${payment.amount} FCFA a échoué`,
          userId: payment.reservation.userId,
          read: false,
          data: {
            paymentId: payment.id,
            success: data.success,
            amount: payment.amount,
            reservationId: payment.reservationId,
          },
        },
      });

      // Send personal notification
      io.to(`user:${payment.reservation.userId}`).emit("notification", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
        read: notification.read,
        data: notification.data,
      });

      // Send payment event
      io.to(`user:${payment.reservation.userId}`).emit("payment-processed", {
        paymentId: payment.id,
        success: data.success,
        amount: payment.amount,
        reservationId: payment.reservationId,
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
      },
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
