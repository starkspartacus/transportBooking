import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reservationId, paymentMethod, cashierId } = await request.json()

    // Get reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
        seat: true,
        user: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json({ error: "Reservation already processed" }, { status: 409 })
    }

    // Create ticket
    const ticketCode = nanoid(10).toUpperCase()
    const qrCode = nanoid(16)

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        qrCode,
        reservationId: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        companyId: reservation.companyId,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: reservation.totalAmount,
        method: paymentMethod,
        status: "COMPLETED",
        ticketId: ticket.id,
      },
    })

    // Update reservation status
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    })

    // Update trip available seats
    await prisma.trip.update({
      where: { id: reservation.tripId },
      data: {
        availableSeats: { decrement: 1 },
      },
    })

    return NextResponse.json({
      ticket,
      reservation,
      message: "Payment processed successfully",
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
