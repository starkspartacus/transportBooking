import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName, phone, age, role, country, city, commune, password, countryCode, companyId } =
      await request.json()

    // Validate required fields
    if (!firstName || !lastName || !phone || !age || !role || !country || !city || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        phone_countryCode: {
          phone,
          countryCode,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Ce numéro de téléphone est déjà utilisé" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create employee
    const employee = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        countryCode,
        password: hashedPassword,
        role: role as "GESTIONNAIRE" | "CAISSIER",
        country,
        city,
        commune,
        companyId,
        // Additional fields for employee
        age: Number.parseInt(age),
      },
    })

    // Remove password from response
    const { password: _, ...employeeWithoutPassword } = employee

    return NextResponse.json(employeeWithoutPassword)
  } catch (error) {
    console.error("Employee creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        countryCode: true,
        role: true,
        country: true,
        city: true,
        commune: true,
        age: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Get employees error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
