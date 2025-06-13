import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  type PaymentMethod,
  ReservationStatus,
  TicketStatus,
} from "@prisma/client";
import QRCode from "qrcode";
import { generateTicketHash } from "@/app/api/tickets/generate-qr/route"; // Import the helper

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      tripId,
      customerName,
      customerPhone,
      customerEmail,
      numberOfTickets,
      amountPaid,
      paymentMethod,
    } = await request.json();

    if (
      !tripId ||
      !numberOfTickets ||
      numberOfTickets <= 0 ||
      !amountPaid ||
      amountPaid <= 0 ||
      !customerPhone || // Phone is now required for ticket generation
      !customerName
    ) {
      return NextResponse.json(
        { error: "Missing required fields or invalid values" },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    // Find the trip and check available seats
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        route: true,
        company: true,
        tickets: {
          select: { seatNumber: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (!trip.bus) {
      return NextResponse.json(
        { error: "Bus information missing for trip" },
        { status: 500 }
      );
    }

    const bookedSeats = trip.tickets.map((ticket) => ticket.seatNumber);
    const availableSeatsCount = trip.bus.capacity - bookedSeats.length;

    if (numberOfTickets > availableSeatsCount) {
      return NextResponse.json(
        {
          error: `Not enough seats available. Only ${availableSeatsCount} left.`,
        },
        { status: 400 }
      );
    }

    // Find available seat numbers
    const assignedSeatNumbers: number[] = [];
    for (
      let i = 1;
      i <= trip.bus.capacity && assignedSeatNumbers.length < numberOfTickets;
      i++
    ) {
      if (!bookedSeats.includes(i)) {
        assignedSeatNumbers.push(i);
      }
    }

    if (assignedSeatNumbers.length !== numberOfTickets) {
      return NextResponse.json(
        { error: "Could not assign all requested seats. Please try again." },
        { status: 500 }
      );
    }

    const pricePerTicket = amountPaid / numberOfTickets;

    // Create a single reservation for all tickets
    const reservation = await prisma.reservation.create({
      data: {
        tripId: trip.id,
        companyId: companyId,
        passengerName: customerName,
        passengerPhone: customerPhone,
        passengerEmail: customerEmail,
        seatNumbers: assignedSeatNumbers,
        totalAmount: amountPaid,
        paymentMethod: paymentMethod as PaymentMethod,
        status: ReservationStatus.CONFIRMED, // Assuming direct sale is confirmed
        bookingSource: "CASHIER_DESK",
        // userId: session.user.id, // Link to cashier if needed, or leave null for anonymous client
      },
    });

    const generatedQrCodesData: {
      ticketId: string;
      qrCodeUrl: string;
      qrData: any;
    }[] = [];

    for (const seatNumber of assignedSeatNumbers) {
      const ticketNumber = `TICKET-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      const ticket = await prisma.ticket.create({
        data: {
          tripId: trip.id,
          companyId: companyId,
          reservationId: reservation.id,
          ticketNumber: ticketNumber,
          passengerName: customerName,
          passengerPhone: customerPhone,
          passengerEmail: customerEmail,
          seatNumber: seatNumber,
          price: pricePerTicket,
          status: TicketStatus.VALID,
        },
      });

      // Generate QR Code data
      const qrData = {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        passengerName: ticket.passengerName,
        passengerPhone: ticket.passengerPhone,
        tripId: ticket.tripId,
        seatNumber: ticket.seatNumber,
        departureLocation: trip.route.departureLocation,
        arrivalLocation: trip.route.arrivalLocation,
        departureTime: trip.departureTime,
        busPlateNumber: trip.bus.plateNumber,
        companyId: ticket.companyId,
        companyName: trip.company.name,
        price: ticket.price,
        status: ticket.status,
        issueDate: ticket.createdAt,
        hash: generateTicketHash(ticket),
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "M",
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 256,
      });

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          qrCode: qrCodeDataURL as string,
        },
      });

      generatedQrCodesData.push({
        ticketId: ticket.id,
        qrCodeUrl: qrCodeDataURL as string,
        qrData: qrData,
      });
    }

    // Update trip available seats
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        availableSeats: {
          decrement: numberOfTickets,
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "TICKET_SALE",
        description: `Vente directe de ${numberOfTickets} billet(s) pour ${customerName} - ${trip.route.departureLocation} → ${trip.route.arrivalLocation}`,
        entityType: "Ticket",
        entityId: reservation.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tickets sold successfully",
      qrCodesData: generatedQrCodesData, // Return array of QR codes
      reservationId: reservation.id,
    });
  } catch (error) {
    console.error("Error selling ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
