import { NextResponse, type NextRequest } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Define a schema for input validation
const schema = z.object({
  // Données du responsable
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().min(1, "Code pays requis"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),

  // Données de l'entreprise
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  companyDescription: z.string().optional(),
  companyEmail: z.string().email("Email de l'entreprise invalide"),
  companyAddress: z.string().min(5, "Adresse de l'entreprise requise"),
  licenseNumber: z.string().min(3, "Numéro de licence requis"),

  // Localisation
  country: z.string().min(1, "Pays requis"),
  city: z.string().min(1, "Ville requise"),
  commune: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);

    const {
      email,
      password,
      name,
      countryCode,
      phone,
      companyName,
      companyDescription,
      companyEmail,
      companyAddress,
      licenseNumber,
      country,
      city,
      commune,
      address,
    } = validatedData;

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Email déjà utilisé" },
        { status: 409 }
      );
    }

    // Check if phone number already exists
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone_countryCode: { phone: phone, countryCode: countryCode } },
    });
    if (existingUserByPhone) {
      return NextResponse.json(
        { user: null, message: "Numéro de téléphone déjà utilisé" },
        { status: 409 }
      );
    }

    // Check if company email already exists
    const existingCompanyByEmail = await prisma.company.findUnique({
      where: { email: companyEmail },
    });
    if (existingCompanyByEmail) {
      return NextResponse.json(
        { user: null, message: "Email de l'entreprise déjà utilisé" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    // Create a new user with role PATRON
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        countryCode,
        password: hashedPassword,
        role: "PATRON",
        country,
        city,
        commune,
        address,
      },
    });

    // Create a new company associated with the patron
    const newCompany = await prisma.company.create({
      data: {
        name: companyName,
        email: companyEmail,
        phone: phone, // Utilise le téléphone du responsable
        countryCode: countryCode,
        address: companyAddress,
        country: country,
        city: city,
        description: companyDescription,
        licenseNumber: licenseNumber,
        ownerId: newUser.id,
        subscriptionTier: "BASIC",
        subscriptionStatus: "PENDING",
      },
    });

    // Update the user to set the active company
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        activeCompanyId: newCompany.id,
        companyId: newCompany.id, // Définit l'entreprise employeur
      },
    });

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
          licenseNumber: licenseNumber,
        },
      },
    });

    const { password: newUserPassword, ...rest } = newUser;

    return NextResponse.json(
      {
        user: rest,
        company: newCompany,
        message: "Entreprise créée avec succès",
        redirectUrl: `/subscription?companyId=${newCompany.id}&welcome=true`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Données invalides",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Une erreur s'est produite", error },
      { status: 500 }
    );
  }
}
