import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isActive } = await request.json()
    const employeeId = params.id

    const employee = await prisma.user.update({
      where: { id: employeeId },
      data: { isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Update employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id

    await prisma.user.delete({
      where: { id: employeeId },
    })

    return NextResponse.json({ message: "Employee deleted successfully" })
  } catch (error) {
    console.error("Delete employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
