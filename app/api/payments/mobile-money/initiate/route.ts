import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      cpm_trans_id,
      cpm_site_id,
      signature,
      cpm_amount,
      cpm_currency,
      cpm_payid,
      cpm_payment_date,
      cpm_payment_time,
      cpm_error_message,
      cpm_result,
      cpm_trans_status,
      cpm_designation,
      cpm_phone_prefixe,
      cpm_phone_num,
      cpm_custom,
    } = body;

    // Vérifier la signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CINETPAY_SECRET_KEY!)
      .update(
        cpm_site_id +
          cpm_trans_id +
          cpm_amount +
          cpm_currency +
          process.env.CINETPAY_SECRET_KEY
      )
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Signature invalide:", { signature, expectedSignature });
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    // Trouver la réservation
    const reservation = await prisma.reservation.findFirst({
      where: { paymentReference: cpm_trans_id },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            company: true,
          },
        },
        company: true,
      },
    });

    if (!reservation) {
      console.error("Réservation non trouvée:", cpm_trans_id);
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    if (cpm_result === "00" && cpm_trans_status === "ACCEPTED") {
      // Paiement réussi
      await prisma.$transaction(async (tx) => {
        // Mettre à jour la réservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paidAmount: Number.parseFloat(cpm_amount),
          },
        });

        // Mettre à jour les sièges disponibles
        await tx.trip.update({
          where: { id: reservation.tripId },
          data: {
            availableSeats: {
              decrement: reservation.seatNumbers.length,
            },
            bookedSeats: {
              push: reservation.seatNumbers,
            },
          },
        });

        // Créer le paiement
        await tx.payment.create({
          data: {
            amount: Number.parseFloat(cpm_amount),
            currency: cpm_currency,
            status: "PAID",
            method: "MOBILE_MONEY",
            reference: cpm_trans_id,
            processorId: cpm_payid,
            userId: reservation.userId,
            companyId: reservation.companyId,
            reservationId: reservation.id,
            metadata: {
              phone: `${cpm_phone_prefixe}${cpm_phone_num}`,
              paymentDate: cpm_payment_date,
              paymentTime: cpm_payment_time,
            },
          },
        });

        // Générer les tickets
        for (let i = 0; i < reservation.seatNumbers.length; i++) {
          const seatNumber = reservation.seatNumbers[i];
          const ticketNumber = `TKT_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 6)}`;

          // Générer QR Code sécurisé
          const qrData = {
            ticketNumber,
            tripId: reservation.tripId,
            seatNumber,
            passengerName: reservation.passengerName,
            timestamp: Date.now(),
          };

          const qrString = JSON.stringify(qrData);
          const qrHash = crypto
            .createHash("sha256")
            .update(qrString + process.env.NEXTAUTH_SECRET)
            .digest("hex");

          await tx.ticket.create({
            data: {
              ticketNumber,
              passengerName: reservation.passengerName,
              passengerPhone: reservation.passengerPhone,
              passengerEmail: reservation.passengerEmail,
              seatNumber,
              price: reservation.totalAmount / reservation.seatNumbers.length,
              status: "VALID",
              qrCode: Buffer.from(qrString).toString("base64"),
              qrHash,
              userId: reservation.userId,
              tripId: reservation.tripId,
              companyId: reservation.companyId,
              reservationId: reservation.id,
            },
          });
        }

        // Enregistrer l'activité
        await tx.activity.create({
          data: {
            type: "PAYMENT_COMPLETED",
            description: `Paiement mobile money confirmé pour ${cpm_amount} ${cpm_currency}`,
            status: "SUCCESS",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              reservationId: reservation.id,
              paymentReference: cpm_trans_id,
              amount: Number.parseFloat(cpm_amount),
              method: "MOBILE_MONEY",
              processorId: cpm_payid,
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Paiement confirmé avec succès",
      });
    } else {
      // Paiement échoué
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancellationReason: cpm_error_message || "Paiement échoué",
          },
        });

        await tx.activity.create({
          data: {
            type: "PAYMENT_FAILED",
            description: `Paiement mobile money échoué: ${cpm_error_message}`,
            status: "FAILED",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              reservationId: reservation.id,
              paymentReference: cpm_trans_id,
              error: cpm_error_message,
              result: cpm_result,
            },
          },
        });
      });

      return NextResponse.json({
        success: false,
        message: "Paiement échoué",
        error: cpm_error_message,
      });
    }
  } catch (error) {
    console.error("Erreur callback paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
