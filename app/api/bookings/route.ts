import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId, seatNumber, paymentMethod } = await request.json()

    // Validate input
    if (!tripId || !seatNumber || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: {
          include: { seats: true },
        },
        company: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if seat exists and is available
    const seat = await prisma.seat.findFirst({
      where: {
        busId: trip.busId,
        number: seatNumber,
      },
    })

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 })
    }

    // Check if seat is already reserved
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        tripId,
        seatId: seat.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    })

    if (existingReservation) {
      return NextResponse.json({ error: "Seat already reserved" }, { status: 409 })
    }

    // Create reservation
    const reservationCode = nanoid(8).toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    const reservation = await prisma.reservation.create({
      data: {
        reservationCode,
        userId: session.user.id,
        tripId,
        seatId: seat.id,
        companyId: trip.companyId,
        totalAmount: trip.route.price,
        expiresAt,
        status: paymentMethod === "CASH" ? "CONFIRMED" : "PENDING",
      },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departure: true,
                arrival: true,
              },
            },
          },
        },
        seat: true,
        user: true,
      },
    })

    // If cash payment, create ticket immediately
    if (paymentMethod === "CASH") {
      const ticketCode = nanoid(10).toUpperCase()
      const qrCode = nanoid(16)

      const ticket = await prisma.ticket.create({
        data: {
          ticketCode,
          qrCode,
          reservationId: reservation.id,
          userId: session.user.id,
          tripId,
          seatId: seat.id,
          companyId: trip.companyId,
        },
      })

      await prisma.payment.create({
        data: {
          amount: trip.route.price,
          method: paymentMethod,
          status: "PENDING",
          ticketId: ticket.id,
        },
      })

      // Update available seats
      await prisma.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: { decrement: 1 },
        },
      })

      return NextResponse.json({
        reservation,
        ticket,
        paymentRequired: false,
        message: "Réservation confirmée. Payez à la gare.",
      })
    }

    return NextResponse.json({
      reservation,
      paymentRequired: true,
      message: "Réservation créée. Procédez au paiement.",
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    const whereClause: any = {}

    // Role-based filtering
    if (session.user.role === "CLIENT") {
      whereClause.userId = session.user.id
    } else if (["PATRON", "GESTIONNAIRE", "CAISSIER"].includes(session.user.role)) {
      if (companyId) {
        whereClause.companyId = companyId
      }
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            route: {
              include: {
                departure: true,
                arrival: true,
              },
            },
            bus: true,
          },
        },
        seat: true,
        user: true,
        ticket: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
