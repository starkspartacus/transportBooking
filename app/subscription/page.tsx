import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SubscriptionPlans } from "@/components/subscription/subscription-plans"
import { PublicSubscriptionPlans } from "@/components/subscription/public-subscription-plans"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Info } from "lucide-react"

interface SubscriptionPageProps {
  searchParams: {
    companyId?: string
    welcome?: string
    canceled?: string
  }
}

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const session = await getServerSession(authOptions)
  const { companyId, welcome, canceled } = searchParams

  // Si l'utilisateur n'est pas connecté, afficher les plans publics
  if (!session || !session.user) {
    return <PublicSubscriptionPlans />
  }

  const userId = session.user.id

  // Déterminer quelle entreprise utiliser
  let targetCompanyId = companyId
  let company = null

  if (targetCompanyId) {
    // Vérifier que l'entreprise appartient à l'utilisateur
    company = await prisma.company.findFirst({
      where: {
        id: targetCompanyId,
        ownerId: userId,
      },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (!company) {
      redirect("/patron/companies")
    }
  } else {
    // Utiliser l'entreprise active de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activeCompany: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    })

    if (!user?.activeCompany) {
      redirect("/patron/companies")
    }

    company = user.activeCompany
    targetCompanyId = company.id
  }

  const currentSubscription = company.subscriptions[0]
  const currentTier = currentSubscription?.tier || company.subscriptionTier

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        {/* Messages d'alerte */}
        {welcome && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Félicitations ! Votre entreprise <strong>{company.name}</strong> a été créée avec succès. Choisissez
              maintenant votre plan d'abonnement pour commencer à utiliser toutes les fonctionnalités.
            </AlertDescription>
          </Alert>
        )}

        {canceled && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Le paiement a été annulé. Vous pouvez réessayer à tout moment.
            </AlertDescription>
          </Alert>
        )}

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Plans d'abonnement</h1>
          <p className="text-xl text-gray-600 mb-2">
            Choisissez le plan parfait pour <strong>{company.name}</strong>
          </p>
          {currentTier && (
            <p className="text-sm text-gray-500">
              Plan actuel : <span className="font-semibold text-blue-600">{currentTier}</span>
            </p>
          )}
        </div>

        {/* Plans d'abonnement */}
        <SubscriptionPlans currentTier={currentTier} companyId={targetCompanyId} />

        {/* Section d'aide */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Besoin d'aide ?</h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous accompagner dans le choix de votre abonnement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@transportbooking.com"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Contacter le support
            </a>
            <a
              href="/help/subscription"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Guide d'abonnement
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
