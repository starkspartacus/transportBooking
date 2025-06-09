import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { ratelimit } from "@/lib/ratelimit"

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, country, method } = await request.json()

    // Rate limiting par IP
    const ip = request.ip ?? "127.0.0.1"
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Veuillez réessayer plus tard." },
        { status: 429 },
      )
    }

    // Validation des données
    if (!identifier || !password || !country) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    let user = null

    // Recherche par email ou téléphone avec vérification du pays
    if (method === "email") {
      user = await prisma.user.findFirst({
        where: {
          email: identifier,
          country: country,
          status: "ACTIVE",
        },
        include: {
          ownedCompanies: true,
          employeeAt: true,
        },
      })
    } else if (method === "phone") {
      // Extraire le code pays et le numéro
      const phoneRegex = /^(\+\d{1,4})\s*(.+)$/
      const match = identifier.match(phoneRegex)

      if (!match) {
        return NextResponse.json({ error: "Format de numéro de téléphone invalide" }, { status: 400 })
      }

      const [, countryCode, phone] = match

      user = await prisma.user.findFirst({
        where: {
          phone: phone.replace(/\s/g, ""),
          countryCode: countryCode,
          country: country,
          status: "ACTIVE",
        },
        include: {
          ownedCompanies: true,
          employeeAt: true,
        },
      })
    }

    if (!user) {
      // Enregistrer la tentative échouée
      await prisma.activity.create({
        data: {
          type: "USER_LOGIN",
          description: `Tentative de connexion échouée - utilisateur non trouvé: ${identifier} (${country})`,
          status: "ERROR",
          companyId: "system",
          metadata: {
            identifier,
            country,
            method,
            ip,
            reason: "user_not_found",
          },
        },
      })

      return NextResponse.json({ error: "Identifiants incorrects ou pays non correspondant" }, { status: 401 })
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password || "")

    if (!isPasswordValid) {
      // Enregistrer la tentative échouée
      await prisma.activity.create({
        data: {
          type: "USER_LOGIN",
          description: `Tentative de connexion échouée - mot de passe incorrect: ${user.email || user.phone} (${country})`,
          status: "ERROR",
          userId: user.id,
          companyId: user.companyId || "system",
          metadata: {
            identifier,
            country,
            method,
            ip,
            reason: "invalid_password",
          },
        },
      })

      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    // Connexion réussie - enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "USER_LOGIN",
        description: `Connexion sécurisée réussie depuis ${country}: ${user.name || "Utilisateur"} (${user.role})`,
        status: "SUCCESS",
        userId: user.id,
        companyId: user.companyId || "system",
        metadata: {
          loginMethod: method,
          country,
          ip,
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      },
    })

    // Mettre à jour les statistiques de connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
      },
    })
  } catch (error) {
    console.error("Secure login error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
