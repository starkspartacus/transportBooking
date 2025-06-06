import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            employees: true,
            buses: true,
            trips: true,
            tickets: true,
            reservations: true,
          },
        },
        operatingCountries: true,
        galleryImages: {
          select: {
            id: true,
            url: true,
            isPrimary: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Vérifier si l'email ou le numéro de licence existe déjà
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ email: data.email }, { licenseNumber: data.licenseNumber }],
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          error:
            "Une entreprise avec cet email ou ce numéro de licence existe déjà",
        },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: data.name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        address: data.address,
        country: data.country,
        city: data.city,
        commune: data.commune,
        website: data.website,
        licenseNumber: data.licenseNumber,
        taxId: data.taxId,
        foundedYear: data.foundedYear
          ? Number.parseInt(data.foundedYear)
          : null,
        size: data.size,
        slogan: data.slogan,
        operatingHours: data.operatingHours,
        specialties: data.specialties || [],
        logo: data.logo,
        coverImage: data.coverImage,
        ownerId: session.user.id,
        operatingCountries: {
          create:
            data.operatingCountries?.map((country: any) => ({
              countryCode: country.code,
              countryName: country.name,
              isMainCountry: country.isMainCountry || false,
            })) || [],
        },
        galleryImages: {
          create:
            data.galleryImages?.map((url: string, index: number) => ({
              url,
              type: "GALLERY",
              isPrimary: index === 0,
            })) || [],
        },
      },
      include: {
        _count: {
          select: {
            employees: true,
            buses: true,
            trips: true,
            tickets: true,
            reservations: true,
          },
        },
      },
    });

    // Créer une activité
    await prisma.activity.create({
      data: {
        type: "COMPANY_CREATED",
        description: `Entreprise "${company.name}" créée`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: company.id,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}
