import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      country,
      city,
      commune,
      address,
      companyName,
      companyDescription,
      companyEmail,
      companyPhone,
      companyAddress,
      licenseNumber,
      countryCode,
    } = await request.json();

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !companyName ||
      !companyEmail ||
      !licenseNumber
    ) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: {
        phone_countryCode: {
          phone,
          countryCode,
        },
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Ce numéro de téléphone est déjà utilisé" },
        { status: 409 }
      );
    }

    // Check if company email already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email: companyEmail },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Cet email d'entreprise est déjà utilisé" },
        { status: 409 }
      );
    }

    // Check if license number already exists
    const existingLicense = await prisma.company.findUnique({
      where: { licenseNumber },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: "Ce numéro de licence est déjà utilisé" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the patron user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
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

      // Create the company
      const company = await tx.company.create({
        data: {
          name: companyName,
          description: companyDescription,
          email: companyEmail,
          phone: companyPhone || phone,
          countryCode,
          address: companyAddress,
          country,
          city,
          commune,
          licenseNumber,
          ownerId: user.id,
          isVerified: false, // Requires admin verification
          isActive: false, // Activated after verification
        },
      });

      // Update user with company ID
      await tx.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      });

      return { user, company };
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.user;

    return NextResponse.json({
      user: userWithoutPassword,
      company: result.company,
      message:
        "Inscription réussie. Votre entreprise est en attente de vérification.",
    });
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
