import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cinetpayService } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cmp_site_id,
      cpm_trans_id,
      cpm_amount,
      cpm_currency,
      cpm_payid,
      cpm_payment_date,
      cpm_payment_time,
      cpm_error_message,
      cpm_result,
      cpm_trans_status,
      cpm_custom,
      signature,
    } = body;

    console.log("Callback CinetPay reçu:", { cpm_trans_id, cpm_trans_status });

    // Vérifier la signature
    if (!cinetpayService.validateWebhookSignature(body, signature)) {
      console.error("Signature invalide pour la transaction:", cpm_trans_id);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    // Récupérer la transaction
    const transaction = await prisma.subscriptionTransaction.findUnique({
      where: { transactionId: cpm_trans_id },
      include: {
        user: true,
        company: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error("Transaction non trouvée:", cpm_trans_id);
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 }
      );
    }

    if (cpm_result === "00" && cpm_trans_status === "ACCEPTED") {
      // Paiement réussi
      console.log("Paiement réussi pour:", cpm_trans_id);

      await prisma.$transaction(async (tx) => {
        // Mettre à jour la transaction
        await tx.subscriptionTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
            processorId: cpm_payid,
            metadata: {
              paymentDate: cpm_payment_date,
              paymentTime: cpm_payment_time,
              processorId: cpm_payid,
            },
          },
        });

        // Calculer les dates d'abonnement
        const now = new Date();
        const endDate = new Date(now);
        if (transaction.period === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Créer ou mettre à jour l'abonnement
        const existingSubscription = await tx.subscription.findFirst({
          where: { companyId: transaction.companyId },
        });

        if (existingSubscription) {
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              tier: transaction.planId as any,
              status: "ACTIVE",
              startDate: now,
              endDate,
              amount: transaction.amount,
              currency: transaction.currency,
              period: transaction.period,
              paymentMethod: "CINETPAY",
              paymentDate: now,
              paymentReference: cpm_trans_id,
            },
          });
        } else {
          await tx.subscription.create({
            data: {
              companyId: transaction.companyId,
              userId: transaction.userId,
              tier: transaction.planId as any,
              status: "ACTIVE",
              startDate: now,
              endDate,
              amount: transaction.amount,
              currency: transaction.currency,
              period: transaction.period,
              paymentMethod: "CINETPAY",
              paymentDate: now,
              paymentReference: cpm_trans_id,
            },
          });
        }

        // Mettre à jour l'entreprise
        await tx.company.update({
          where: { id: transaction.companyId },
          data: {
            subscriptionTier: transaction.planId as any,
            subscriptionStatus: "ACTIVE",
            subscriptionExpiry: endDate,
          },
        });

        // Enregistrer l'activité
        await tx.activity.create({
          data: {
            type: "SUBSCRIPTION_ACTIVATED",
            description: `Abonnement ${transaction.planId} activé avec succès`,
            status: "SUCCESS",
            userId: transaction.userId,
            companyId: transaction.companyId,
            metadata: {
              transactionId: cpm_trans_id,
              amount: transaction.amount,
              period: transaction.period,
              planId: transaction.planId,
            },
          },
        });

        // Créer une notification
        await tx.notification.create({
          data: {
            title: "Abonnement activé",
            message: `Votre abonnement ${transaction.planId} a été activé avec succès`,
            type: "ACCOUNT_UPDATE",
            userId: transaction.userId,
            metadata: {
              transactionId: cpm_trans_id,
              planId: transaction.planId,
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Abonnement activé avec succès",
      });
    } else {
      // Paiement échoué
      console.log("Paiement échoué pour:", cpm_trans_id, cpm_error_message);

      await prisma.$transaction(async (tx) => {
        await tx.subscriptionTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            metadata: {
              error: cpm_error_message || "Paiement échoué",
              result: cpm_result,
              status: cpm_trans_status,
            },
          },
        });

        await tx.activity.create({
          data: {
            type: "SUBSCRIPTION_FAILED",
            description: `Échec du paiement pour l'abonnement ${transaction.planId}: ${cpm_error_message}`,
            status: "ERROR",
            userId: transaction.userId,
            companyId: transaction.companyId,
            metadata: {
              transactionId: cpm_trans_id,
              error: cpm_error_message,
              planId: transaction.planId,
            },
          },
        });
      });

      return NextResponse.json({
        success: false,
        message: "Paiement échoué",
        error: cpm_error_message,
      });
    }
  } catch (error) {
    console.error("Erreur callback subscription:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
