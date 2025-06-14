import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { getSocketIO } from "@/lib/socket"; // Import getSocketIO
import QRCode from "qrcode"; // Import qrcode library

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const {
      tripId,
      selectedSeats, // Now an array of { seatNumber: string; name: string; phone: string; countryCode: string; email?: string; }
      paymentMethod,
    } = await request.json();

    // Validate input
    if (
      !tripId ||
      !selectedSeats ||
      !Array.isArray(selectedSeats) ||
      selectedSeats.length === 0 ||
      !paymentMethod
    ) {
      return NextResponse.json(
        { error: "Missing required fields or invalid seat selection" },
        { status: 400 }
      );
    }

    if (selectedSeats.length > 2) {
      return NextResponse.json(
        { error: "Maximum 2 tickets allowed per reservation." },
        { status: 400 }
      );
    }

    // Use a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get trip details
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          route: true,
          bus: {
            select: { capacity: true, plateNumber: true }, // Select plateNumber as well
          },
          company: true,
          reservations: {
            where: {
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] }, // Check for pending/confirmed reservations
            },
            select: { seatNumbers: true },
          },
        },
      });

      if (!trip) {
        throw new Error("Trip not found");
      }

      // Determine already occupied seats from existing reservations
      const occupiedSeatNumbers = trip.reservations.flatMap((res) =>
        res.seatNumbers.map((s) => s.toString())
      );

      const seatsToReserve = selectedSeats.map((s) => s.seatNumber);

      // Check if selected seats exist and are available
      for (const seatInfo of selectedSeats) {
        const seatNumberInt = Number.parseInt(seatInfo.seatNumber, 10);
        if (
          isNaN(seatNumberInt) ||
          seatNumberInt <= 0 ||
          seatNumberInt > trip.bus.capacity
        ) {
          throw new Error(
            `Seat ${seatInfo.seatNumber} is invalid for this bus capacity.`
          );
        }
        if (occupiedSeatNumbers.includes(seatInfo.seatNumber)) {
          throw new Error(`Seat ${seatInfo.seatNumber} is already reserved.`);
        }
        if (
          seatsToReserve.filter((s) => s === seatInfo.seatNumber).length > 1
        ) {
          throw new Error(
            `Seat ${seatInfo.seatNumber} selected multiple times in this booking.`
          );
        }
      }

      // Calculate total amount
      const totalAmount = trip.currentPrice * selectedSeats.length;
      const reservationCode = nanoid(8).toUpperCase();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Determine userId based on session or guest data
      const userId = session?.user?.id || null;
      const mainPassengerName =
        selectedSeats[0]?.name || session?.user?.name || "N/A";
      const mainPassengerPhone =
        selectedSeats[0]?.phone || session?.user?.phone || "N/A";
      const mainPassengerEmail =
        selectedSeats[0]?.email || session?.user?.email || null;
      const mainPassengerCountryCode =
        selectedSeats[0]?.countryCode || session?.user?.countryCode || null;

      // Prepare passengerDetails JSON object
      const passengerDetails = {
        mainPassenger: {
          name: mainPassengerName,
          phone: mainPassengerPhone,
          email: mainPassengerEmail,
          countryCode: mainPassengerCountryCode,
        },
        otherPassengers: selectedSeats.slice(1).map((p) => ({
          seatNumber: p.seatNumber,
          name: p.name,
          phone: p.phone,
          email: p.email,
          countryCode: p.countryCode,
        })),
      };

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          reservationNumber: reservationCode,
          userId: userId, // Use determined userId
          tripId: trip.id,
          companyId: trip.companyId,
          totalAmount: totalAmount,
          seatNumbers: selectedSeats.map((s) =>
            Number.parseInt(s.seatNumber, 10)
          ), // Store selected seat numbers as array of ints
          expiresAt,
          status: paymentMethod === "CASH" ? "CONFIRMED" : "PENDING", // Cash payments are confirmed immediately
          paymentMethod,
          passengerCount: selectedSeats.length,
          passengerName: mainPassengerName, // Primary booker's name (direct field)
          passengerPhone: mainPassengerPhone, // Primary booker's phone (direct field)
          passengerEmail: mainPassengerEmail, // Primary booker's email (direct field)
          passengerCountryCode: mainPassengerCountryCode, // New: Direct field for main passenger's country code
          passengerDetails: passengerDetails, // Store all passenger details as JSON
        },
        include: {
          trip: {
            include: {
              route: true, // Include route for socket emission
              bus: true, // Include bus for socket emission
            },
          },
          user: true,
          tickets: true,
        },
      });

      const ticketsCreated = [];
      // Create individual tickets for each selected seat
      for (const seatInfo of selectedSeats) {
        const ticketCode = nanoid(10).toUpperCase();
        // Create QR Code data
        const qrData = {
          ticketId: ticketCode, // Using ticketCode as a unique ID for QR data
          ticketNumber: ticketCode,
          passengerName: seatInfo.name,
          passengerPhone: seatInfo.phone,
          tripId: trip.id,
          seatNumber: seatInfo.seatNumber,
          departureLocation: trip.route.departureLocation,
          arrivalLocation: trip.route.arrivalLocation,
          departureTime: trip.departureTime,
          busPlateNumber: trip.bus.plateNumber,
          companyId: trip.companyId,
          companyName: trip.company.name,
          price: trip.currentPrice,
          status: paymentMethod === "CASH" ? "VALID" : "RESERVED",
          issueDate: new Date(),
          // Note: For a real security hash, you'd need a consistent secret and a more robust hashing mechanism.
          // For now, we'll use a simple hash based on ticketCode.
          hash: nanoid(16), // Simple hash for now
        };

        // Generate QR Code Data URL
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: ticketCode,
            qrCode: qrCodeDataURL, // Store the actual data URL
            qrHash: qrData.hash, // Store the hash
            reservationId: reservation.id,
            userId: userId, // Use determined userId
            tripId: trip.id,
            companyId: trip.companyId,
            seatNumber: Number.parseInt(seatInfo.seatNumber, 10),
            passengerName: seatInfo.name,
            passengerPhone: seatInfo.phone,
            passengerEmail: seatInfo.email, // Store passenger email directly on ticket
            passengerCountryCode: seatInfo.countryCode, // New: Store country code directly on ticket
            price: trip.currentPrice, // Price per ticket
            status: paymentMethod === "CASH" ? "VALID" : "RESERVED", // Use RESERVED for pending payment tickets
          },
        });
        ticketsCreated.push(ticket);
      }

      // Create payment record
      await tx.payment.create({
        data: {
          amount: totalAmount,
          method: paymentMethod,
          status: paymentMethod === "CASH" ? "PAID" : "PENDING", // Cash payments are PAID immediately
          reservationId: reservation.id,
          userId: userId, // Use determined userId
          companyId: trip.companyId,
        },
      });

      // Update available seats for the trip
      await tx.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: { decrement: selectedSeats.length },
        },
      });

      // After transaction, emit real-time event
      const io = getSocketIO();
      if (io) {
        io.to(`company-${trip.companyId}`).emit("new-reservation", {
          reservation: {
            id: reservation.id,
            reservationNumber: reservation.reservationNumber,
            tripId: trip.id,
            companyId: trip.companyId,
            totalAmount: reservation.totalAmount,
            seatNumbers: reservation.seatNumbers,
            passengerName: reservation.passengerName, // Primary booker's name
            passengerPhone: reservation.passengerPhone, // Primary booker's phone
            status: reservation.status,
            paymentMethod: reservation.paymentMethod,
            createdAt: reservation.createdAt,
            // Include essential trip details for cashier view
            trip: {
              departureTime: trip.departureTime,
              arrivalTime: trip.arrivalTime,
              route: {
                name: trip.route.name,
                departureLocation: trip.route.departureLocation,
                arrivalLocation: trip.route.arrivalLocation,
              },
              bus: {
                plateNumber: trip.bus.plateNumber,
              },
            },
          },
          tickets: ticketsCreated.map((t) => ({
            // Include ticket details
            id: t.id,
            ticketNumber: t.ticketNumber,
            passengerName: t.passengerName,
            seatNumber: t.seatNumber,
            qrCode: t.qrCode, // Now contains the data URL
            status: t.status,
          })),
        });
        console.log(`new-reservation emitted for company-${trip.companyId}`);
      }

      return {
        reservation,
        tickets: ticketsCreated,
        paymentRequired: paymentMethod !== "CASH",
        message:
          paymentMethod === "CASH"
            ? "Réservation confirmée. Payez à la gare."
            : "Réservation créée. Procédez au paiement via CinetPay.",
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const whereClause: any = {};

    // Role-based filtering
    if (session.user.role === "CLIENT") {
      whereClause.userId = session.user.id;
    } else if (
      ["PATRON", "GESTIONNAIRE", "CAISSIER"].includes(session.user.role)
    ) {
      if (companyId) {
        whereClause.companyId = companyId;
      }
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            route: {},
            bus: {
              select: {
                plateNumber: true, // Select plateNumber
                model: true,
                brand: true,
                capacity: true,
              },
            },
          },
        },
        user: true,
        tickets: {
          // Removed 'payment' as it's not a direct relation on Ticket
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
