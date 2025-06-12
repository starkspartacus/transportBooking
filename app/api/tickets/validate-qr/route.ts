import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![
        "ADMIN",
        "PATRON",
        "GESTIONNAIRE",
        "CAISSIER",
        "DRIVER",
        "CONDUCTOR",
      ].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json({ error: "QR Data required" }, { status: 400 });
    }

    let parsedData;
    try {
      parsedData = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid QR Code format" },
        { status: 400 }
      );
    }

    const { ticketId, hash } = parsedData;

    // Get ticket from database
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            company: true,
          },
        },
        user: true,
        reservation: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify security hash
    const expectedHash = generateTicketHash(ticket);
    if (hash !== expectedHash) {
      return NextResponse.json(
        { error: "Invalid or tampered ticket" },
        { status: 400 }
      );
    }

    // Check ticket status
    if (ticket.status === "USED") {
      return NextResponse.json(
        {
          error: "Ticket already used",
          usedAt: ticket.usedAt,
          usedBy: ticket.usedBy,
        },
        { status: 400 }
      );
    }

    if (ticket.status === "CANCELLED") {
      return NextResponse.json({ error: "Ticket cancelled" }, { status: 400 });
    }

    if (ticket.status !== "VALID") {
      return NextResponse.json(
        { error: "Invalid ticket status" },
        { status: 400 }
      );
    }

    // Check if trip is today (optional - you may want different logic)
    const tripDate = new Date(ticket.trip.departureTime);
    const today = new Date();
    const diffTime = Math.abs(tripDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Mark ticket as used
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "USED",
        usedAt: new Date(),
        usedBy: session.user.id,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "TICKET_VALIDATED",
        description: `Billet validé: ${ticket.passengerName} - Siège ${ticket.seatNumber}`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: ticket.companyId,
        metadata: {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          validatedBy: session.user.name,
          validatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket validated successfully",
      ticket: {
        ticketNumber: ticket.ticketNumber,
        passengerName: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        route: `${ticket.trip.route.departureLocation} → ${ticket.trip.route.arrivalLocation}`,
        departureTime: ticket.trip.departureTime,
        busPlateNumber: ticket.trip.bus.plateNumber,
        validatedAt: updatedTicket.usedAt,
        validatedBy: session.user.name,
      },
    });
  } catch (error) {
    console.error("Ticket validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate security hash
function generateTicketHash(ticket: any): string {
  const crypto = require("crypto");
  const data = `${ticket.id}${ticket.ticketNumber}${ticket.passengerPhone}${ticket.seatNumber}${ticket.tripId}`;
  return crypto
    .createHash("sha256")
    .update(data + process.env.NEXTAUTH_SECRET)
    .digest("hex")
    .substring(0, 16);
}
