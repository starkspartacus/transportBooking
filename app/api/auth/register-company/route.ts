import { NextResponse, type NextRequest } from "next/server"
import { hash } from "bcrypt"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Define a schema for input validation
const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().min(1, "Code pays requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, countryCode, phone } = schema.parse(body)

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    })
    if (existingUserByEmail) {
      return NextResponse.json({ user: null, message: "Email déjà utilisé" }, { status: 409 })
    }

    // Check if phone number already exists
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone_countryCode: { phone: phone, countryCode: countryCode } },
    })
    if (existingUserByPhone) {
      return NextResponse.json({ user: null, message: "Numéro de téléphone déjà utilisé" }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)

    // Create a new user with role PATRON
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        countryCode,
        password: hashedPassword,
        role: "PATRON",
      },
    })

    // Create a new company associated with the patron
    const newCompany = await prisma.company.create({
      data: {
        name: `${name} Transport`,
        email: email,
        phone: phone,
        countryCode: countryCode,
        address: "Adresse à définir",
        country: "Pays à définir",
        city: "Ville à définir",
        ownerId: newUser.id,
        subscriptionTier: "BASIC",
        subscriptionStatus: "PENDING",
      },
    })

    // Update the user to set the active company and connect the company
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        activeCompanyId: newCompany.id,
        employeeAt: {
          connect: {
            id: newCompany.id,
          },
        },
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "COMPANY_CREATED",
        description: `Nouvelle entreprise créée: ${newCompany.name}`,
        status: "SUCCESS",
        userId: newUser.id,
        companyId: newCompany.id,
        metadata: {
          companyName: newCompany.name,
          userEmail: email,
        },
      },
    })

    const { password: newUserPassword, ...rest } = newUser

    return NextResponse.json(
      {
        user: rest,
        company: newCompany,
        message: "Entreprise créée avec succès",
        redirectUrl: `/subscription?companyId=${newCompany.id}&welcome=true`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration Error:", error)
    return NextResponse.json({ message: "Une erreur s'est produite", error }, { status: 500 })
  }
}
