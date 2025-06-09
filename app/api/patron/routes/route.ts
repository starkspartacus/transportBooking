import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer toutes les routes d'une entreprise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    // Si pas de companyId fourni, utiliser l'entreprise active de l'utilisateur
    let targetCompanyId = companyId

    if (!targetCompanyId) {
      // Récupérer la première entreprise du patron
      const userCompany = await prisma.company.findFirst({
        where: {
          ownerId: session.user.id,
        },
        select: { id: true },
      })

      if (!userCompany) {
        return NextResponse.json({ error: "Aucune entreprise trouvée" }, { status: 404 })
      }

      targetCompanyId = userCompany.id
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: targetCompanyId,
        ownerId: session.user.id,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    const routes = await prisma.route.findMany({
      where: {
        companyId: targetCompanyId,
      },
      include: {
        stops: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transformer les données pour inclure totalTrips et duration (pour compatibilité)
    const routesWithStats = routes.map((route) => ({
      ...route,
      totalTrips: route._count.trips,
      duration: route.estimatedDuration, // Utiliser estimatedDuration comme alias pour duration
      departure: route.departureLocation, // Alias pour compatibilité
      arrival: route.arrivalLocation, // Alias pour compatibilité
      price: route.basePrice, // Utiliser basePrice comme alias pour price
    }))

    return NextResponse.json(routesWithStats)
  } catch (error) {
    console.error("Error fetching routes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle route
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PATRON") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("Route creation data received:", data)

    // Validation des données - adapter aux nouveaux champs
    const requiredFields = ["name", "origin", "destination", "distance", "estimatedDuration", "basePrice"]

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        console.error(`Missing required field: ${field}`)
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 })
      }
    }

    // Récupérer l'entreprise active du patron
    let companyId = data.companyId
    if (!companyId) {
      const userCompany = await prisma.company.findFirst({
        where: {
          ownerId: session.user.id,
        },
        select: { id: true },
      })

      if (!userCompany) {
        return NextResponse.json({ error: "Aucune entreprise trouvée" }, { status: 404 })
      }

      companyId = userCompany.id
    }

    // Vérifier que l'entreprise appartient au patron
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: session.user.id,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 })
    }

    // Créer la route avec les nouveaux champs
    const route = await prisma.route.create({
      data: {
        name: data.name,
        departureLocation: data.origin,
        arrivalLocation: data.destination,
        departureCountry: data.departureCountry || "Côte d'Ivoire",
        arrivalCountry: data.arrivalCountry || "Côte d'Ivoire",
        distance: Number(data.distance),
        estimatedDuration: Number(data.estimatedDuration),
        basePrice: Number(data.basePrice),
        description: data.description || "",
        isInternational: data.isInternational || false,
        status: data.status || "ACTIVE",
        companyId: companyId,
      },
    })

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "ROUTE_CREATED",
        description: `Route ${route.name} créée`,
        status: "SUCCESS",
        userId: session.user.id,
        companyId: companyId,
      },
    })

    return NextResponse.json({
      id: route.id,
      name: route.name,
      origin: route.departureLocation,
      destination: route.arrivalLocation,
      departureCountry: route.departureCountry,
      arrivalCountry: route.arrivalCountry,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      basePrice: route.basePrice,
      description: route.description,
      isInternational: route.isInternational,
      status: route.status,
      totalTrips: 0,
    })
  } catch (error) {
    console.error("Error creating route:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
