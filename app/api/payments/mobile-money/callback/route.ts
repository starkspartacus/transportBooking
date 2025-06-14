import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cinetpayService } from "@/lib/cinetpay";
import { getSocketIO } from "@/lib/socket";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cpm_site_id,
      cpm_trans_id,
      cpm_amount,
      cpm_currency,
      cpm_payid,
      cpm_payment_date,
      cpm_payment_time,
      cpm_error_message,
      cpm_result,
      cpm_trans_status,
      cpm_custom, // This contains our stringified metadata
      signature,
    } = body;

    console.log("CinetPay Callback received:", {
      cpm_trans_id,
      cpm_trans_status,
      cpm_result,
    });

    // Verify the signature
    if (!cinetpayService.validateWebhookSignature(body, signature)) {
      console.error("Invalid signature for transaction:", cpm_trans_id);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata: any = {};
    try {
      if (cpm_custom) {
        metadata = JSON.parse(cpm_custom);
      }
    } catch (parseError) {
      console.error("Error parsing cpm_custom metadata:", parseError);
      // Continue without metadata if parsing fails, but log it
    }

    const {
      reservationId,
      tripId,
      companyId,
      userId,
      seatNumbers,
      passengerDetails,
    } = metadata;

    if (!reservationId) {
      console.error(
        "Reservation ID missing in CinetPay callback metadata for transaction:",
        cpm_trans_id
      );
      return NextResponse.json(
        { error: "Reservation ID manquant" },
        { status: 400 }
      );
    }

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            company: true,
          },
        },
      },
    });

    if (!reservation) {
      console.error(
        "Reservation not found for ID:",
        reservationId,
        "Transaction:",
        cpm_trans_id
      );
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Prevent double processing
    if (
      reservation.paymentStatus === "PAID" &&
      reservation.status === "CONFIRMED"
    ) {
      console.warn("Transaction already processed:", cpm_trans_id);
      return NextResponse.json({
        success: true,
        message: "Transaction déjà traitée",
      });
    }

    if (cpm_result === "00" && cpm_trans_status === "ACCEPTED") {
      // Payment successful
      console.log("Payment successful for transaction:", cpm_trans_id);

      await prisma.$transaction(async (tx) => {
        // Update reservation status
        const updatedReservation = await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paidAt: new Date(),
            paymentReference: cpm_trans_id,
            metadata: {
              ...(reservation.metadata as object), // Keep existing metadata
              cinetpay: {
                paymentDate: cpm_payment_date,
                paymentTime: cpm_payment_time,
                processorId: cpm_payid,
              },
            },
          },
        });

        // Create tickets (if not already created by a previous attempt)
        const existingTickets = await tx.ticket.findMany({
          where: { reservationId: reservation.id },
        });

        const ticketsCreated = [];
        if (existingTickets.length === 0) {
          const parsedPassengerDetails =
            typeof passengerDetails === "string"
              ? JSON.parse(passengerDetails)
              : passengerDetails;
          const parsedSeatNumbers =
            typeof seatNumbers === "string"
              ? JSON.parse(seatNumbers)
              : seatNumbers;

          for (const seatNum of parsedSeatNumbers) {
            const passengerInfo = parsedPassengerDetails.find(
              (p: any) => p.seatNumber === seatNum.toString()
            );

            if (!passengerInfo) {
              console.error(
                `Passenger details not found for seat ${seatNum} in reservation ${reservation.id}`
              );
              continue; // Skip this ticket if passenger info is missing
            }

            const ticketCode = nanoid(10).toUpperCase();
            const qrData = {
              ticketId: ticketCode,
              ticketNumber: ticketCode,
              passengerName: passengerInfo.name,
              passengerPhone: passengerInfo.phone,
              tripId: reservation.tripId,
              seatNumber: seatNum,
              departureLocation: reservation.trip.route.departureLocation,
              arrivalLocation: reservation.trip.route.arrivalLocation,
              departureTime: reservation.trip.departureTime,
              busPlateNumber: reservation.trip.bus.plateNumber,
              companyId: reservation.companyId,
              companyName: reservation.trip.company.name,
              price: reservation.totalAmount / reservation.passengerCount, // Price per ticket
              status: "VALID", // Ticket is valid after successful payment
              issueDate: new Date(),
              hash: nanoid(16),
            };

            const qrCodeDataURL = await QRCode.toDataURL(
              JSON.stringify(qrData)
            );

            const ticket = await tx.ticket.create({
              data: {
                ticketNumber: ticketCode,
                qrCode: qrCodeDataURL,
                qrHash: qrData.hash,
                reservationId: reservation.id,
                userId: reservation.userId,
                tripId: reservation.tripId,
                companyId: reservation.companyId,
                seatNumber: seatNum,
                passengerName: passengerInfo.name,
                passengerPhone: passengerInfo.phone,
                passengerEmail: passengerInfo.email,
                passengerCountryCode: passengerInfo.countryCode,
                price: qrData.price,
                status: "VALID",
              },
            });
            ticketsCreated.push(ticket);
          }
        } else {
          // Tickets already exist, use them
          ticketsCreated.push(...existingTickets);
        }

        // Create payment record (if not already created)
        const existingPayment = await tx.payment.findFirst({
          where: { reservationId: reservation.id, status: "PAID" },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              amount: Number.parseFloat(cpm_amount),
              method: "MOBILE_MONEY",
              status: "PAID",
              reservationId: reservation.id,
              userId: reservation.userId,
              companyId: reservation.companyId,
              transactionId: cpm_trans_id,
            },
          });
        } else {
          // Update existing payment if status is not PAID
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: "PAID",
              transactionId: cpm_trans_id,
            },
          });
        }

        // Enregistrer l'activité
        await tx.activity.create({
          data: {
            type: "PAYMENT_COMPLETED",
            description: `Paiement mobile money réussi pour la réservation #${reservation.reservationNumber}`,
            status: "SUCCESS",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              transactionId: cpm_trans_id,
              amount: Number.parseFloat(cpm_amount),
              reservationId: reservation.id,
            },
          },
        });

        // Emit socket event for cashier dashboard and user
        const io = getSocketIO();
        if (io) {
          io.to(`company-${reservation.companyId}`).emit(
            "reservation-confirmed",
            {
              reservation: {
                id: updatedReservation.id,
                reservationNumber: updatedReservation.reservationNumber,
                tripId: updatedReservation.tripId,
                companyId: updatedReservation.companyId,
                totalAmount: updatedReservation.totalAmount,
                seatNumbers: updatedReservation.seatNumbers,
                passengerName: updatedReservation.passengerName,
                passengerPhone: updatedReservation.passengerPhone,
                status: updatedReservation.status,
                paymentMethod: updatedReservation.paymentMethod,
                createdAt: updatedReservation.createdAt,
                trip: {
                  departureTime: reservation.trip.departureTime,
                  arrivalTime: reservation.trip.arrivalTime,
                  route: {
                    name: reservation.trip.route.name,
                    departureLocation: reservation.trip.route.departureLocation,
                    arrivalLocation: reservation.trip.route.arrivalLocation,
                  },
                  bus: {
                    plateNumber: reservation.trip.bus.plateNumber,
                  },
                },
              },
              tickets: ticketsCreated.map((t) => ({
                id: t.id,
                ticketNumber: t.ticketNumber,
                passengerName: t.passengerName,
                seatNumber: t.seatNumber,
                qrCode: t.qrCode,
                status: t.status,
              })),
            }
          );
          if (reservation.userId) {
            io.to(`user-${reservation.userId}`).emit("payment-completed", {
              reservationId: reservation.id,
              message:
                "Votre paiement a été confirmé et vos billets sont prêts !",
              tickets: ticketsCreated.map((t) => ({
                ticketNumber: t.ticketNumber,
                qrCode: t.qrCode,
              })),
            });
          }
          console.log(
            `reservation-confirmed and payment-completed emitted for transaction ${cpm_trans_id}`
          );
        }
      });

      return NextResponse.json({
        success: true,
        message: "Paiement et réservation confirmés",
      });
    } else {
      // Payment failed or rejected
      console.log(
        "Payment failed for transaction:",
        cpm_trans_id,
        "Error:",
        cpm_error_message
      );

      await prisma.$transaction(async (tx) => {
        // Update reservation status to FAILED
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED", // Mark reservation as cancelled if payment fails
            metadata: {
              ...(reservation.metadata as object),
              cinetpay: {
                error: cpm_error_message || "Paiement échoué",
                result: cpm_result,
                status: cpm_trans_status,
              },
            },
          },
        });

        // Revert available seats for the trip
        await tx.trip.update({
          where: { id: reservation.tripId },
          data: {
            availableSeats: { increment: reservation.seatNumbers.length },
          },
        });

        // Update payment record (if exists) or create a failed one
        const existingPayment = await tx.payment.findFirst({
          where: { reservationId: reservation.id },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: "FAILED",
              transactionId: cpm_trans_id,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              amount: Number.parseFloat(cpm_amount),
              method: "MOBILE_MONEY",
              status: "FAILED",
              reservationId: reservation.id,
              userId: reservation.userId,
              companyId: reservation.companyId,
              transactionId: cpm_trans_id,
            },
          });
        }

        // Enregistrer l'activité
        await tx.activity.create({
          data: {
            type: "PAYMENT_FAILED",
            description: `Échec du paiement mobile money pour la réservation #${
              reservation.reservationNumber
            }: ${cpm_error_message || "Inconnu"}`,
            status: "ERROR",
            userId: reservation.userId,
            companyId: reservation.companyId,
            metadata: {
              transactionId: cpm_trans_id,
              amount: Number.parseFloat(cpm_amount),
              error: cpm_error_message,
              reservationId: reservation.id,
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
    console.error("Error in CinetPay callback:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
