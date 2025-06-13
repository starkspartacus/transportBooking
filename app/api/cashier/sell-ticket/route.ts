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
    console.log("Received request body:", body);

    const {
      tripId,
      customerName,
      customerPhone,
      customerEmail,
      numberOfTickets, // Now expecting numberOfTickets
      amountPaid,
      paymentMethod = "CASH",
    } = body;

    // Validate required fields (seatNumber is no longer required from client)
    if (
      !tripId ||
      !customerName ||
      !customerPhone ||
      !numberOfTickets ||
      !amountPaid
    ) {
      console.log("Missing required fields:", {
        tripId: !tripId,
        customerName: !customerName,
        customerPhone: !customerPhone,
        numberOfTickets: !numberOfTickets,
        amountPaid: !amountPaid,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get trip details including bus capacity and existing reservations
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
        reservations: {
          select: {
            seatNumbers: true, // Only need seat numbers from existing reservations
          },
        },
      },
    });

    if (!trip) {
      console.log("Trip not found:", tripId);
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (!trip.bus) {
      console.log("Bus not found for trip:", tripId);
      return NextResponse.json(
        { error: "Bus details missing for trip" },
        { status: 500 }
      );
    }

    // Determine available seats
    const allSeats = Array.from({ length: trip.bus.capacity }, (_, i) => i + 1);
    const bookedSeats = trip.reservations.flatMap((r) => r.seatNumbers);
    const availableSeats = allSeats.filter(
      (seat) => !bookedSeats.includes(seat)
    );

    if (numberOfTickets > availableSeats.length) {
      console.log("Not enough seats available:", {
        requested: numberOfTickets,
        available: availableSeats.length,
      });
      return NextResponse.json(
        {
          error: `Not enough seats available. Only ${availableSeats.length} seats left.`,
        },
        { status: 400 }
      );
    }

    // Assign the first 'numberOfTickets' available seats
    const assignedSeatNumbers = availableSeats.slice(0, numberOfTickets);
    const pricePerTicket = amountPaid / numberOfTickets;

    // Validate amount (total amount for all tickets)
    if (amountPaid < trip.currentPrice * numberOfTickets) {
      console.log("Insufficient payment amount:", {
        amountPaid,
        expected: trip.currentPrice * numberOfTickets,
      });
      return NextResponse.json(
        { error: "Insufficient payment amount for all tickets" },
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

    // Create reservation, payment, and tickets in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          passengerName: customerName,
          passengerPhone: customerPhone,
          passengerEmail: customerEmail,
          userId: customer.id,
          tripId: trip.id,
          seatNumbers: assignedSeatNumbers, // Array of assigned seats
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

      // Create payment record for the total amount
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: amountPaid,
          method: paymentMethod,
          status: "COMPLETED",
          companyId: trip.companyId,
        },
      });

      // Create individual tickets for each assigned seat
      const tickets = [];
      for (const seat of assignedSeatNumbers) {
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: `TK-${Date.now()}-${seat}`, // Unique ticket number
            passengerName: customerName,
            passengerPhone: customerPhone,
            passengerEmail: customerEmail,
            seatNumber: seat,
            price: pricePerTicket, // Price per individual ticket
            status: "VALID",
            userId: customer.id,
            tripId: trip.id,
            companyId: trip.companyId,
            reservationId: reservation.id,
          },
        });
        tickets.push(ticket);
      }

      // Update available seats on the trip
      await tx.trip.update({
        where: { id: trip.id },
        data: {
          availableSeats: {
            decrement: numberOfTickets,
          },
        },
      });

      // Create activity log with cashier information
      await tx.activity.create({
        data: {
          type: "TICKET_SALE", // Changed to TICKET_SALE for clarity
          description: `Vente directe de ${numberOfTickets} billet(s) pour ${customerName} - ${trip.route.departureLocation} → ${trip.route.arrivalLocation}`,
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
            seatNumbers: assignedSeatNumbers,
            paymentId: payment.id,
            ticketIds: tickets.map((t) => t.id),
            timestamp: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });

      return { reservation, payment, tickets };
    });

    // Return QR code data for the first ticket (if multiple, client needs to handle displaying all)
    const firstTicketQrData =
      result.tickets.length > 0
        ? JSON.stringify({
            ticketId: result.tickets[0].id,
            ticketNumber: result.tickets[0].ticketNumber,
            tripId: result.tickets[0].tripId,
            seatNumber: result.tickets[0].seatNumber,
            passengerName: result.tickets[0].passengerName,
            companyId: result.tickets[0].companyId,
          })
        : null;

    return NextResponse.json({
      success: true,
      reservation: result.reservation,
      payment: result.payment,
      tickets: result.tickets,
      qrCodeData: firstTicketQrData, // Return QR data for the first ticket
      message: "Ticket(s) sold successfully",
    });
  } catch (error) {
    console.error("Sell ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
