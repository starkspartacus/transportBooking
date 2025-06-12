import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const data = await request.json();

    // Mise à jour du profil utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name:
          data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
        country: data.country,
        city: data.city,
        commune: data.commune,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        nationality: data.nationality,
        language: data.language,
        theme: data.theme,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        country: true,
        city: true,
        commune: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        language: true,
        theme: true,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "USER_UPDATED",
        description: "Profil utilisateur mis à jour",
        status: "SUCCESS",
        userId: session.user.id,
        metadata: {
          updatedFields: Object.keys(data),
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
