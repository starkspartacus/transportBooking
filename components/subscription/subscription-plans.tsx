"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, UserPlus } from "lucide-react";
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PRICES,
  SUBSCRIPTION_COLORS,
  SUBSCRIPTION_BUTTON_COLORS,
} from "@/constants/company";

interface SubscriptionPlansProps {
  currentTier?: string;
  companyId: string;
  isAuthenticated: boolean;
  hasCompany: boolean;
}

export function SubscriptionPlans({
  currentTier,
  companyId,
  isAuthenticated,
  hasCompany,
}: SubscriptionPlansProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = async (tier: string) => {
    // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription
    if (!isAuthenticated) {
      router.push("/auth/signup");
      return;
    }

    // Si l'utilisateur n'a pas d'entreprise, rediriger vers la création d'entreprise
    if (!hasCompany) {
      router.push("/patron/companies/new");
      return;
    }

    try {
      setLoading(tier);

      const response = await fetch("/api/subscription/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          period,
          companyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      if (data.redirectUrl) {
        // Pour les abonnements gratuits, redirection directe
        toast({
          title: "Abonnement activé",
          description: "Votre abonnement gratuit a été activé avec succès.",
          variant: "success",
        });
        router.push(data.redirectUrl);
      } else if (data.paymentUrl) {
        // Pour les abonnements payants, redirection vers CinetPay
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  const getButtonText = (tier: string) => {
    if (!isAuthenticated) {
      return "Créer un compte";
    }
    if (!hasCompany) {
      return "Créer une entreprise";
    }
    if (currentTier === tier) {
      return "Abonnement actuel";
    }
    return "S'abonner";
  };

  const getButtonIcon = (tier: string) => {
    if (!isAuthenticated || !hasCompany) {
      return <UserPlus className="mr-2 h-4 w-4" />;
    }
    if (loading === tier) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }
    return null;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Choisissez votre abonnement
        </h1>
        <p className="text-muted-foreground mt-2">
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </p>
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-2 bg-blue-50 p-3 rounded-lg">
            💡 Créez un compte gratuit pour commencer avec notre plan BASIC
          </p>
        )}
      </div>

      <Tabs defaultValue="monthly" className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="monthly" onClick={() => setPeriod("monthly")}>
              Mensuel
            </TabsTrigger>
            <TabsTrigger value="yearly" onClick={() => setPeriod("yearly")}>
              Annuel{" "}
              <Badge
                variant="outline"
                className="ml-2 bg-green-100 text-green-800"
              >
                -17%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
              <SubscriptionCard
                key={tier}
                tier={tier}
                features={
                  SUBSCRIPTION_FEATURES[
                    tier as keyof typeof SUBSCRIPTION_FEATURES
                  ]
                }
                price={
                  SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES]
                    .monthly
                }
                currency={
                  SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES]
                    .currency
                }
                period="mensuel"
                color={
                  SUBSCRIPTION_COLORS[tier as keyof typeof SUBSCRIPTION_COLORS]
                }
                buttonColor={
                  SUBSCRIPTION_BUTTON_COLORS[
                    tier as keyof typeof SUBSCRIPTION_BUTTON_COLORS
                  ]
                }
                isCurrent={currentTier === tier}
                loading={loading === tier}
                buttonText={getButtonText(tier)}
                buttonIcon={getButtonIcon(tier)}
                onSubscribe={() => handleSubscribe(tier)}
                isAuthenticated={isAuthenticated}
                hasCompany={hasCompany}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
              <SubscriptionCard
                key={tier}
                tier={tier}
                features={
                  SUBSCRIPTION_FEATURES[
                    tier as keyof typeof SUBSCRIPTION_FEATURES
                  ]
                }
                price={
                  SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES]
                    .yearly
                }
                currency={
                  SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES]
                    .currency
                }
                period="annuel"
                color={
                  SUBSCRIPTION_COLORS[tier as keyof typeof SUBSCRIPTION_COLORS]
                }
                buttonColor={
                  SUBSCRIPTION_BUTTON_COLORS[
                    tier as keyof typeof SUBSCRIPTION_BUTTON_COLORS
                  ]
                }
                isCurrent={currentTier === tier}
                loading={loading === tier}
                buttonText={getButtonText(tier)}
                buttonIcon={getButtonIcon(tier)}
                onSubscribe={() => handleSubscribe(tier)}
                isAuthenticated={isAuthenticated}
                hasCompany={hasCompany}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Comparaison des fonctionnalités
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Fonctionnalité</th>
                {Object.keys(SUBSCRIPTION_TIERS).map((tier) => (
                  <th key={tier} className="p-4 text-center">
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">Nombre d'entreprises</td>
                <td className="p-4 text-center">1</td>
                <td className="p-4 text-center">3</td>
                <td className="p-4 text-center">10</td>
                <td className="p-4 text-center">Illimité</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Nombre d'employés</td>
                <td className="p-4 text-center">5</td>
                <td className="p-4 text-center">20</td>
                <td className="p-4 text-center">50</td>
                <td className="p-4 text-center">Illimité</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Nombre de bus</td>
                <td className="p-4 text-center">10</td>
                <td className="p-4 text-center">30</td>
                <td className="p-4 text-center">100</td>
                <td className="p-4 text-center">Illimité</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Réservations</td>
                <td className="p-4 text-center">Limitées</td>
                <td className="p-4 text-center">Illimitées</td>
                <td className="p-4 text-center">Illimitées</td>
                <td className="p-4 text-center">Illimitées</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Support</td>
                <td className="p-4 text-center">Email</td>
                <td className="p-4 text-center">Prioritaire</td>
                <td className="p-4 text-center">24/7</td>
                <td className="p-4 text-center">Dédié</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Rapports</td>
                <td className="p-4 text-center">Basiques</td>
                <td className="p-4 text-center">Standard</td>
                <td className="p-4 text-center">Avancés</td>
                <td className="p-4 text-center">Sur mesure</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">API</td>
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
              <tr className="border-b">
                <td className="p-4">Tableau de bord personnalisé</td>
                <td className="p-4 text-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Intégrations sur mesure</td>
                <td className="p-4 text-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Prêt à commencer ?</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre compte gratuitement et commencez avec notre plan BASIC
              sans engagement.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/auth/signup")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Créer un compte gratuit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubscriptionCardProps {
  tier: string;
  features: string[];
  price: number;
  currency: string;
  period: string;
  color: string;
  buttonColor: string;
  isCurrent?: boolean;
  loading?: boolean;
  buttonText: string;
  buttonIcon: React.ReactNode;
  onSubscribe: () => void;
  isAuthenticated: boolean;
  hasCompany: boolean;
}

function SubscriptionCard({
  tier,
  features,
  price,
  currency,
  period,
  color,
  buttonColor,
  isCurrent,
  loading,
  buttonText,
  buttonIcon,
  onSubscribe,
  isAuthenticated,
  hasCompany,
}: SubscriptionCardProps) {
  const isDisabled = loading || (isCurrent && isAuthenticated && hasCompany);

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isCurrent ? "border-2 border-primary" : ""
      } ${
        tier === "BASIC" && !isAuthenticated
          ? "ring-2 ring-blue-500 ring-opacity-50"
          : ""
      }`}
    >
      <div className={`${color} p-1`}></div>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {tier}
          {isCurrent && (
            <Badge variant="outline" className="bg-primary/20">
              Actuel
            </Badge>
          )}
          {tier === "BASIC" && !isAuthenticated && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Recommandé
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {tier === "BASIC"
            ? "Pour démarrer"
            : tier === "STANDARD"
            ? "Pour les petites entreprises"
            : tier === "PREMIUM"
            ? "Pour les entreprises en croissance"
            : "Pour les grandes entreprises"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-3xl font-bold">
            {price === 0
              ? "Gratuit"
              : `${new Intl.NumberFormat("fr-FR").format(price)} ${currency}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground">/{period}</span>
          )}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${buttonColor}`}
          onClick={onSubscribe}
          disabled={isDisabled}
        >
          {buttonIcon}
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
