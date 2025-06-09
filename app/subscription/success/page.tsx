"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transactionId")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [subscription, setSubscription] = useState<any>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setStatus("error")
        setError("ID de transaction manquant")
        return
      }

      try {
        // Attendre quelques secondes pour laisser le temps au webhook de traiter le paiement
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Vérifier le statut du paiement
        const response = await fetch(`/api/subscription/verify?transactionId=${transactionId}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setSubscription(data.subscription)
        } else {
          setStatus("error")
          setError(data.error || "Une erreur est survenue lors de la vérification du paiement")
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setStatus("error")
        setError("Une erreur est survenue lors de la vérification du paiement")
      }
    }

    verifyPayment()
  }, [transactionId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Vérification du paiement..."}
            {status === "success" && "Paiement confirmé !"}
            {status === "error" && "Erreur de paiement"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Veuillez patienter pendant que nous vérifions votre paiement"}
            {status === "success" && "Votre abonnement a été activé avec succès"}
            {status === "error" && "Nous n'avons pas pu confirmer votre paiement"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="flex justify-center py-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abonnement</span>
                  <span className="font-medium">{subscription?.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Période</span>
                  <span className="font-medium">{subscription?.period === "monthly" ? "Mensuel" : "Annuel"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("fr-FR").format(subscription?.amount)} {subscription?.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date d'activation</span>
                  <span className="font-medium">{formatDate(subscription?.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date d'expiration</span>
                  <span className="font-medium">{formatDate(subscription?.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Référence</span>
                  <span className="font-medium">{subscription?.transactionId}</span>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/patron/dashboard")}>
            {status === "success" ? "Aller au tableau de bord" : "Retour au tableau de bord"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
