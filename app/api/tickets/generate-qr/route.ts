import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID required" },
        { status: 400 }
      );
    }

    // Get ticket details
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

    // Create QR Code data
    const qrData = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      passengerName: ticket.passengerName,
      passengerPhone: ticket.passengerPhone,
      tripId: ticket.tripId,
      seatNumber: ticket.seatNumber,
      departureLocation: ticket.trip.route.departureLocation,
      arrivalLocation: ticket.trip.route.arrivalLocation,
      departureTime: ticket.trip.departureTime,
      busPlateNumber: ticket.trip.bus.plateNumber,
      companyId: ticket.companyId,
      companyName: ticket.trip.company.name,
      price: ticket.price,
      status: ticket.status,
      issueDate: ticket.createdAt,
      // Security hash to prevent tampering
      hash: generateTicketHash(ticket),
    };

    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });

    // Update ticket with QR code info
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        qrCode: qrCodeDataURL,
        qrCodeData: JSON.stringify(qrData),
      },
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl: qrCodeDataURL,
      qrData: qrData,
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
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
