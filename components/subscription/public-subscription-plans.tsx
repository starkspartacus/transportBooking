"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, ArrowRight, Star } from "lucide-react"
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PRICES,
  SUBSCRIPTION_COLORS,
  SUBSCRIPTION_BUTTON_COLORS,
} from "@/constants/company"

export function PublicSubscriptionPlans() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly")
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/auth/signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-10 px-4">
        {/* Alerte d'information */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Créez votre compte gratuitement</strong> pour accéder à nos plans d'abonnement et commencer à gérer
            votre entreprise de transport.
          </AlertDescription>
        </Alert>

        {/* En-tête */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Choisissez votre plan d'abonnement</h1>
          <p className="text-xl text-gray-600 mb-6">
            Des solutions adaptées à toutes les tailles d'entreprises de transport
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Essai gratuit • Sans engagement • Support inclus</span>
          </div>
        </div>

        <Tabs defaultValue="monthly" className="w-full max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="monthly" onClick={() => setPeriod("monthly")}>
                Mensuel
              </TabsTrigger>
              <TabsTrigger value="yearly" onClick={() => setPeriod("yearly")}>
                Annuel{" "}
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                  -17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
                <PublicSubscriptionCard
                  key={tier}
                  tier={tier}
                  features={SUBSCRIPTION_FEATURES[tier]}
                  price={SUBSCRIPTION_PRICES[tier].monthly}
                  currency={SUBSCRIPTION_PRICES[tier].currency}
                  period="mensuel"
                  color={SUBSCRIPTION_COLORS[tier]}
                  buttonColor={SUBSCRIPTION_BUTTON_COLORS[tier]}
                  onGetStarted={handleGetStarted}
                  isRecommended={tier === "BASIC"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
                <PublicSubscriptionCard
                  key={tier}
                  tier={tier}
                  features={SUBSCRIPTION_FEATURES[tier]}
                  price={SUBSCRIPTION_PRICES[tier].yearly}
                  currency={SUBSCRIPTION_PRICES[tier].currency}
                  period="annuel"
                  color={SUBSCRIPTION_COLORS[tier]}
                  buttonColor={SUBSCRIPTION_BUTTON_COLORS[tier]}
                  onGetStarted={handleGetStarted}
                  isRecommended={tier === "STANDARD"}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Section Call-to-Action */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Prêt à commencer ?</h2>
          <p className="text-lg text-gray-600 mb-6">
            Créez votre compte gratuitement et choisissez le plan qui vous convient
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Créer mon compte gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">Aucune carte de crédit requise • Configuration en 2 minutes</p>
        </div>

        {/* Comparaison des fonctionnalités */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Comparaison détaillée</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                    {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
                      <th key={tier} className="p-4 text-center font-semibold">
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-4 font-medium">Nombre d'entreprises</td>
                    <td className="p-4 text-center">1</td>
                    <td className="p-4 text-center">3</td>
                    <td className="p-4 text-center">10</td>
                    <td className="p-4 text-center">Illimité</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">Nombre d'employés</td>
                    <td className="p-4 text-center">5</td>
                    <td className="p-4 text-center">20</td>
                    <td className="p-4 text-center">50</td>
                    <td className="p-4 text-center">Illimité</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Nombre de véhicules</td>
                    <td className="p-4 text-center">10</td>
                    <td className="p-4 text-center">30</td>
                    <td className="p-4 text-center">100</td>
                    <td className="p-4 text-center">Illimité</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">Réservations</td>
                    <td className="p-4 text-center">Limitées</td>
                    <td className="p-4 text-center">Illimitées</td>
                    <td className="p-4 text-center">Illimitées</td>
                    <td className="p-4 text-center">Illimitées</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Support client</td>
                    <td className="p-4 text-center">Email</td>
                    <td className="p-4 text-center">Prioritaire</td>
                    <td className="p-4 text-center">24/7</td>
                    <td className="p-4 text-center">Dédié</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">Rapports et analyses</td>
                    <td className="p-4 text-center">Basiques</td>
                    <td className="p-4 text-center">Standard</td>
                    <td className="p-4 text-center">Avancés</td>
                    <td className="p-4 text-center">Sur mesure</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">API d'intégration</td>
                    <td className="p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Témoignages */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Ce que disent nos clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Une solution complète qui nous a permis de digitaliser notre entreprise de transport en quelques
                  jours."
                </p>
                <div className="font-semibold">Marie Kouassi</div>
                <div className="text-sm text-gray-500">Transport Express Abidjan</div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Le support client est exceptionnel et les fonctionnalités répondent parfaitement à nos besoins."
                </p>
                <div className="font-semibold">Jean-Baptiste Traoré</div>
                <div className="text-sm text-gray-500">Voyages Sahel</div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Grâce à cette plateforme, nous avons augmenté nos réservations de 40% en 3 mois."
                </p>
                <div className="font-semibold">Amadou Diallo</div>
                <div className="text-sm text-gray-500">Transport Inter-États</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PublicSubscriptionCardProps {
  tier: string
  features: string[]
  price: number
  currency: string
  period: string
  color: string
  buttonColor: string
  isRecommended?: boolean
  onGetStarted: () => void
}

function PublicSubscriptionCard({
  tier,
  features,
  price,
  currency,
  period,
  color,
  buttonColor,
  isRecommended,
  onGetStarted,
}: PublicSubscriptionCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-xl relative ${
        isRecommended ? "border-2 border-blue-500 scale-105" : ""
      }`}
    >
      {isRecommended && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">Recommandé</Badge>
        </div>
      )}
      <div className={`${color} p-1`}></div>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">{tier}</CardTitle>
        <CardDescription className="text-sm">
          {tier === "BASIC"
            ? "Parfait pour débuter"
            : tier === "STANDARD"
              ? "Idéal pour les PME"
              : tier === "PREMIUM"
                ? "Pour les entreprises en croissance"
                : "Solution enterprise"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <span className="text-4xl font-bold">
            {price === 0 ? "Gratuit" : `${new Intl.NumberFormat("fr-FR").format(price)}`}
          </span>
          {price > 0 && (
            <>
              <span className="text-lg text-gray-600"> {currency}</span>
              <span className="text-sm text-gray-500">/{period}</span>
            </>
          )}
        </div>
        <ul className="space-y-3 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className={`w-full ${buttonColor} text-white font-semibold py-3`} onClick={onGetStarted}>
          {tier === "BASIC" ? "Commencer gratuitement" : "Choisir ce plan"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
