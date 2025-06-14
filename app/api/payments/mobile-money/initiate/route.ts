import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cinetpayService } from "@/lib/cinetpay"; // Corrected import to cinetpayService

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      tripId,
      passengerName,
      passengerPhone,
      passengerEmail,
      seatNumbers,
      totalAmount,
      companyId,
      passengerDetails,
    } = body;

    // Validation
    if (
      !tripId ||
      !passengerName ||
      !passengerPhone ||
      !totalAmount ||
      !companyId ||
      !seatNumbers ||
      !Array.isArray(seatNumbers) ||
      seatNumbers.length === 0
    ) {
      return NextResponse.json(
        { error: "Données manquantes pour l'initialisation du paiement." },
        { status: 400 }
      );
    }

    // Vérifier la disponibilité du voyage
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
        company: true,
        reservations: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          },
          select: { seatNumbers: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Voyage non trouvé" }, { status: 404 });
    }

    // Check for already occupied seats
    const occupiedSeatNumbers = trip.reservations.flatMap((res) =>
      res.seatNumbers.map((s) => s.toString())
    );
    const requestedSeatStrings = seatNumbers.map((s: number) => s.toString());

    for (const seat of requestedSeatStrings) {
      if (occupiedSeatNumbers.includes(seat)) {
        return NextResponse.json(
          { error: `Le siège ${seat} est déjà réservé.` },
          { status: 400 }
        );
      }
    }

    if (trip.availableSeats < seatNumbers.length) {
      return NextResponse.json(
        { error: "Sièges non disponibles" },
        { status: 400 }
      );
    }

    // Générer une référence unique pour CinetPay
    const paymentReference = cinetpayService.generateTransactionId("BOOK");

    // Create reservation in PENDING state
    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: paymentReference, // Use paymentReference as reservation number for now
        userId: session?.user?.id || null,
        tripId,
        companyId,
        totalAmount,
        seatNumbers: seatNumbers, // Store as numbers
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes to complete payment
        status: "PENDING", // Reservation is pending until payment confirmed
        paymentStatus: "PENDING",
        paymentMethod: "MOBILE_MONEY",
        passengerCount: seatNumbers.length,
        passengerName: passengerName,
        passengerPhone: passengerPhone,
        passengerEmail: passengerEmail,
        passengerCountryCode: passengerDetails[0]?.countryCode || null, // Assuming first passenger is main
        passengerDetails: passengerDetails, // Store full details for ticket creation in callback
      },
    });

    // Update available seats for the trip immediately to prevent double booking
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        availableSeats: { decrement: seatNumbers.length },
      },
    });

    // Initier le paiement CinetPay
    const paymentData = {
      amount: totalAmount,
      currency: "XOF", // Assuming XOF as currency
      transactionId: paymentReference,
      description: `Réservation de billets pour ${trip.route.departureLocation} - ${trip.route.arrivalLocation}`,
      customerName: passengerName,
      customerEmail: passengerEmail || `${passengerPhone}@temp.com`,
      customerPhone: passengerPhone,
      notifyUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/mobile-money/callback`, // CinetPay will call this
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/client/reservations?status=pending&ref=${paymentReference}`, // User redirected here after CinetPay
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/client/reservations?status=cancelled&ref=${paymentReference}`, // User redirected here if payment cancelled
      channels: "MOBILE_MONEY",
      metadata: {
        reservationId: reservation.id,
        tripId: trip.id,
        companyId: companyId,
        userId: session?.user?.id || null,
        seatNumbers: JSON.stringify(seatNumbers), // Pass as stringified JSON
        passengerDetails: JSON.stringify(passengerDetails), // Pass as stringified JSON
      },
    };

    const paymentResponse = await cinetpayService.initializePayment(
      paymentData
    );

    if (paymentResponse.code !== "201") {
      // CinetPay success code for initialization
      // If CinetPay initiation fails, revert reservation and seats
      await prisma.reservation.delete({ where: { id: reservation.id } });
      await prisma.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: { increment: seatNumbers.length },
        },
      });
      return NextResponse.json(
        {
          error:
            paymentResponse.message ||
            "Erreur lors de l'initialisation du paiement CinetPay",
        },
        { status: 500 }
      );
    }

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "PAYMENT_INITIATED",
        description: `Paiement mobile money initié pour ${totalAmount} FCFA (Réservation #${reservation.reservationNumber})`,
        status: "INFO",
        userId: session?.user?.id || null,
        companyId,
        metadata: {
          reservationId: reservation.id,
          paymentReference,
          amount: totalAmount,
          method: "MOBILE_MONEY",
        },
      },
    });

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      paymentUrl: paymentResponse.data?.payment_url,
      paymentReference,
      message: "Paiement initié avec succès. Redirection vers CinetPay...",
    });
  } catch (error) {
    console.error("Erreur initiation paiement mobile money:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
