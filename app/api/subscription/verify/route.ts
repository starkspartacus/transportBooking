import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cinetpayService } from "@/lib/cinetpay"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = session.user.id
    const transactionId = request.nextUrl.searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "ID de transaction manquant" }, { status: 400 })
    }

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findFirst({
      where: {
        transactionId: transactionId,
        userId: userId,
      },
      include: {
        company: {
          select: {
            name: true,
            subscriptionStatus: true,
            subscriptionTier: true,
            subscriptionExpiryDate: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Abonnement non trouvé" }, { status: 404 })
    }

    // Si l'abonnement est déjà actif, on renvoie directement les informations
    if (subscription.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        subscription,
      })
    }

    // Vérifier le statut du paiement avec CinetPay
    const verificationResult = await cinetpayService.verifyPayment(transactionId)
    const paymentVerified = verificationResult.code === "00" && verificationResult.data.status === "ACCEPTED"

    if (paymentVerified) {
      // Calculer la date de fin d'abonnement si elle n'est pas déjà définie
      let endDate = subscription.endDate
      if (!endDate) {
        endDate = new Date()
        if (subscription.period === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (subscription.period === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }
      }

      // Mettre à jour l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          endDate: endDate,
          paymentDate: new Date(),
          paymentReference: verificationResult.data.operator_id || "",
        },
        include: {
          company: {
            select: {
              name: true,
              subscriptionStatus: true,
              subscriptionTier: true,
              subscriptionExpiryDate: true,
            },
          },
        },
      })

      // Mettre à jour l'entreprise
      await prisma.company.update({
        where: { id: subscription.companyId },
        data: {
          subscriptionTier: subscription.tier,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiryDate: endDate,
        },
      })

      // Enregistrer l'activité
      await prisma.activity.create({
        data: {
          type: "SUBSCRIPTION_ACTIVATED",
          description: `Abonnement ${subscription.tier} activé pour ${subscription.company.name}`,
          status: "SUCCESS",
          userId: userId,
          companyId: subscription.companyId,
          metadata: {
            tier: subscription.tier,
            period: subscription.period,
            amount: subscription.amount,
            transactionId: subscription.transactionId,
          },
        },
      })

      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
      })
    } else {
      // Le paiement n'est pas encore confirmé ou a échoué
      return NextResponse.json({
        success: false,
        error: "Le paiement n'a pas encore été confirmé ou a échoué",
        subscription,
      })
    }
  } catch (error) {
    console.error("Error verifying subscription:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification de l'abonnement",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
