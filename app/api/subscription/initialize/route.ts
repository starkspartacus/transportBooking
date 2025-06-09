import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cinetpayService } from "@/lib/cinetpay"
import { SUBSCRIPTION_PRICES, SUBSCRIPTION_TIERS } from "@/constants/company"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = session.user.id
    const { tier, period, companyId } = await request.json()

    // Validation
    if (!tier || !period || !companyId) {
      return NextResponse.json({ error: "Données d'abonnement incomplètes" }, { status: 400 })
    }

    // Vérifier que le tier est valide
    if (!Object.values(SUBSCRIPTION_TIERS).includes(tier)) {
      return NextResponse.json({ error: "Niveau d'abonnement invalide" }, { status: 400 })
    }

    // Vérifier que la période est valide
    if (period !== "monthly" && period !== "yearly") {
      return NextResponse.json({ error: "Période d'abonnement invalide" }, { status: 400 })
    }

    // Vérifier que l'entreprise existe et appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Entreprise non trouvée ou non autorisée" }, { status: 404 })
    }

    // Si c'est un abonnement gratuit (BASIC), on l'active directement
    if (tier === "BASIC") {
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 100) // Pratiquement sans expiration

      await prisma.subscription.create({
        data: {
          tier: tier,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: expiryDate,
          amount: 0,
          currency: "XOF",
          period: period,
          paymentMethod: "FREE",
          companyId: companyId,
          userId: userId,
        },
      })

      // Mettre à jour l'entreprise
      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiryDate: expiryDate,
        },
      })

      // Enregistrer l'activité
      await prisma.activity.create({
        data: {
          type: "SUBSCRIPTION_ACTIVATED",
          description: `Abonnement ${tier} activé pour ${company.name}`,
          status: "SUCCESS",
          userId: userId,
          companyId: companyId,
          metadata: {
            tier,
            period,
            amount: 0,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: "Abonnement gratuit activé avec succès",
        redirectUrl: "/patron/dashboard",
      })
    }

    // Pour les abonnements payants, on initialise le paiement CinetPay
    const price = SUBSCRIPTION_PRICES[tier][period]
    const currency = SUBSCRIPTION_PRICES[tier].currency

    // Générer un ID de transaction unique
    const transactionId = cinetpayService.generateTransactionId("SUB")

    // Créer un enregistrement d'abonnement en attente
    const subscription = await prisma.subscription.create({
      data: {
        tier: tier,
        status: "PENDING",
        startDate: new Date(),
        endDate: null, // Sera mis à jour après paiement
        amount: price,
        currency: currency,
        period: period,
        paymentMethod: "CINETPAY",
        transactionId: transactionId,
        companyId: companyId,
        userId: userId,
      },
    })

    // Initialiser le paiement CinetPay
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const paymentResponse = await cinetpayService.initializePayment({
      amount: price,
      currency: currency,
      transactionId: transactionId,
      description: `Abonnement ${tier} ${period} pour ${company.name}`,
      customerName: user.name || "Client",
      customerEmail: user.email || "",
      customerPhone: user.phone || "",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/success?transactionId=${transactionId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true&companyId=${companyId}`,
      metadata: {
        subscriptionId: subscription.id,
        companyId: companyId,
        userId: userId,
        tier: tier,
        period: period,
      },
    })

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "SUBSCRIPTION_INITIATED",
        description: `Abonnement ${tier} initié pour ${company.name}`,
        status: "PENDING",
        userId: userId,
        companyId: companyId,
        metadata: {
          tier,
          period,
          amount: price,
          transactionId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.data.payment_url,
      transactionId: transactionId,
    })
  } catch (error) {
    console.error("Error initializing subscription:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation de l'abonnement",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
