import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
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
            type: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();

    // Vérifier que l'entreprise appartient à l'utilisateur
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'email ou le numéro de licence existe déjà (sauf pour cette entreprise)
    const duplicateCompany = await prisma.company.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [{ email: data.email }, { licenseNumber: data.licenseNumber }],
          },
        ],
      },
    });

    if (duplicateCompany) {
      return NextResponse.json(
        {
          error:
            "Une autre entreprise avec cet email ou ce numéro de licence existe déjà",
        },
        { status: 400 }
      );
    }

    const company = await prisma.company.update({
      where: { id: params.id },
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
        operatingCountries: {
          deleteMany: {},
          create:
            data.operatingCountries?.map((country: any) => ({
              countryCode: country.code,
              countryName: country.name,
              isMainCountry: country.isMainCountry || false,
            })) || [],
        },
        galleryImages: {
          deleteMany: {},
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
        type: "COMPANY_UPDATED",
        description: `Entreprise "${company.name}" modifiée`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: company.id,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            tickets: true,
            reservations: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier qu'aucun ticket ou réservation n'existe
    if (company._count.tickets > 0 || company._count.reservations > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer une entreprise avec des tickets ou réservations existants",
        },
        { status: 400 }
      );
    }

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Entreprise supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
