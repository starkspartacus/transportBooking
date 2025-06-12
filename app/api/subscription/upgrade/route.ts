import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cinetpayService } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { planId, period = "monthly" } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur avec ses entreprises
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedCompanies: {
          where: { status: "APPROVED" },
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        employeeAt: {
          where: { status: "APPROVED" },
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Trouver l'entreprise active (propriétaire ou employé)
    let activeCompany = null;
    let currentSubscription = null;

    // Priorité aux entreprises possédées
    if (user.ownedCompanies.length > 0) {
      activeCompany = user.ownedCompanies[0];
      currentSubscription = activeCompany.subscriptions[0] || null;
    } else if (user.employeeAt) {
      activeCompany = user.employeeAt;
      currentSubscription = activeCompany.subscriptions[0] || null;
    }

    if (!activeCompany) {
      return NextResponse.json(
        { error: "Aucune entreprise active trouvée" },
        { status: 404 }
      );
    }

    // Définir les plans et prix
    const plans = {
      starter: { name: "BASIC", monthlyPrice: 25000, yearlyPrice: 250000 },
      professional: {
        name: "STANDARD",
        monthlyPrice: 50000,
        yearlyPrice: 500000,
      },
      enterprise: {
        name: "PREMIUM",
        monthlyPrice: 100000,
        yearlyPrice: 1000000,
      },
    };

    const selectedPlan = plans[planId as keyof typeof plans];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Vérifier si c'est un upgrade ou downgrade
    if (currentSubscription?.tier === selectedPlan.name) {
      return NextResponse.json(
        { error: "Vous êtes déjà sur ce plan" },
        { status: 400 }
      );
    }

    const amount =
      period === "yearly"
        ? selectedPlan.yearlyPrice
        : selectedPlan.monthlyPrice;
    const transactionId = cinetpayService.generateTransactionId("SUB");

    // Créer la demande de paiement CinetPay
    const paymentRequest = {
      amount,
      currency: "XOF",
      transactionId,
      description: `Abonnement ${selectedPlan.name} - ${
        period === "yearly" ? "Annuel" : "Mensuel"
      }`,
      customerName: user.name || "Utilisateur",
      customerEmail: user.email || "",
      customerPhone: user.phone || "",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/success?transaction_id=${transactionId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=patron`,
      channels: "MOBILE_MONEY,CREDIT_CARD",
      metadata: {
        userId: user.id,
        companyId: activeCompany.id,
        planId,
        period,
        upgradeType: "subscription_upgrade",
      },
    };

    const cinetpayResponse = await cinetpayService.initializePayment(
      paymentRequest
    );

    if (cinetpayResponse.code !== "201") {
      return NextResponse.json(
        {
          error: "Erreur lors de l'initialisation du paiement",
          details: cinetpayResponse.message,
        },
        { status: 500 }
      );
    }

    // Enregistrer la transaction en attente
    await prisma.subscriptionTransaction.create({
      data: {
        transactionId,
        userId: user.id,
        companyId: activeCompany.id,
        planId: selectedPlan.name,
        period,
        amount,
        currency: "XOF",
        status: "PENDING",
        paymentMethod: "CINETPAY",
        metadata: {
          upgradeFrom: currentSubscription?.tier || "FREE",
          upgradeTo: selectedPlan.name,
        },
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "SUBSCRIPTION_INITIATED",
        description: `Demande de changement d'abonnement vers ${selectedPlan.name}`,
        status: "PENDING",
        userId: user.id,
        companyId: activeCompany.id,
        metadata: {
          planId,
          amount,
          transactionId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: cinetpayResponse.data?.payment_url,
      transactionId,
      message: "Paiement initialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur upgrade subscription:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
