import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cinetpayService } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("CinetPay webhook received:", data);

    // Vérifier la signature si elle est fournie
    const signature = request.headers.get("x-cinetpay-signature");
    if (
      signature &&
      !cinetpayService.validateWebhookSignature(data, signature)
    ) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Extraire les données du webhook
    const { cpm_trans_id, cpm_site_id, cpm_trans_status } = data;

    if (!cpm_trans_id) {
      console.error("Missing transaction ID in webhook");
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    // Vérifier que le site ID correspond
    if (cpm_site_id !== process.env.CINETPAY_SITE_ID) {
      console.error("Invalid site ID in webhook");
      return NextResponse.json({ error: "Invalid site ID" }, { status: 403 });
    }

    // Vérifier le statut du paiement
    const isSuccessful = cpm_trans_status === "ACCEPTED";

    // Récupérer l'abonnement associé à cette transaction
    const subscription = await prisma.subscription.findFirst({
      where: { transactionId: cpm_trans_id },
      include: { company: true, user: true },
    });

    if (!subscription) {
      console.error("Subscription not found for transaction:", cpm_trans_id);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Double vérification avec l'API CinetPay
    const verificationResult = await cinetpayService.verifyPayment(
      cpm_trans_id
    );
    const paymentVerified =
      verificationResult.code === "00" &&
      verificationResult.data.status === "ACCEPTED";

    if (isSuccessful && paymentVerified) {
      // Calculer la date de fin d'abonnement
      const endDate = new Date();
      if (subscription.period === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.period === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Mettre à jour l'abonnement
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          endDate: endDate,
          paymentDate: new Date(),
          paymentReference: data.cpm_payment_date || "",
        },
      });

      // Mettre à jour l'entreprise
      await prisma.company.update({
        where: { id: subscription.companyId },
        data: {
          subscriptionTier: subscription.tier,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiry: endDate,
        },
      });

      // Enregistrer l'activité
      await prisma.activity.create({
        data: {
          type: "SUBSCRIPTION_ACTIVATED",
          description: `Abonnement ${subscription.tier} activé pour ${subscription.company.name}`,
          status: "SUCCESS",
          userId: subscription.userId,
          companyId: subscription.companyId,
          metadata: {
            tier: subscription.tier,
            period: subscription.period,
            amount: subscription.amount,
            transactionId: subscription.transactionId,
          },
        },
      });

      console.log(`Subscription ${subscription.id} activated successfully`);
    } else {
      // Marquer l'abonnement comme échoué
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "FAILED",
          paymentDate: new Date(),
          paymentReference: data.cpm_payment_date || "",
        },
      });

      // Enregistrer l'activité
      await prisma.activity.create({
        data: {
          type: "SUBSCRIPTION_FAILED",
          description: `Échec de l'abonnement ${subscription.tier} pour ${subscription.company.name}`,
          status: "ERROR",
          userId: subscription.userId,
          companyId: subscription.companyId,
          metadata: {
            tier: subscription.tier,
            period: subscription.period,
            amount: subscription.amount,
            transactionId: subscription.transactionId,
            reason: "Payment failed",
          },
        },
      });

      console.log(`Subscription ${subscription.id} payment failed`);
    }

    // Toujours renvoyer un succès à CinetPay pour éviter les retentatives
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing CinetPay webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
