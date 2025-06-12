"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Crown,
  Building2,
  TrendingUp,
  Users,
  Bus,
  Calendar,
  Star,
  ArrowUpRight,
  CheckCircle,
  Loader2,
  Zap,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxCompanies: number;
  maxEmployees: number;
  maxBuses: number;
  current: boolean;
  popular?: boolean;
}

export default function PatronSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [stats, setStats] = useState({
    companies: 0,
    employees: 0,
    buses: 0,
    monthlyRevenue: 0,
    currentPlan: "starter",
  });

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "starter",
      name: "Starter",
      monthlyPrice: 25000,
      yearlyPrice: 250000,
      features: ["1 entreprise", "5 employés", "3 bus", "Support email"],
      maxCompanies: 1,
      maxEmployees: 5,
      maxBuses: 3,
      current: stats.currentPlan === "starter",
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: 50000,
      yearlyPrice: 500000,
      features: [
        "3 entreprises",
        "15 employés",
        "10 bus",
        "Support prioritaire",
        "Analyses avancées",
      ],
      maxCompanies: 3,
      maxEmployees: 15,
      maxBuses: 10,
      current: stats.currentPlan === "professional",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 100000,
      yearlyPrice: 1000000,
      features: [
        "Entreprises illimitées",
        "Employés illimités",
        "Bus illimités",
        "Support 24/7",
        "API personnalisée",
        "Intégrations avancées",
      ],
      maxCompanies: -1,
      maxEmployees: -1,
      maxBuses: -1,
      current: stats.currentPlan === "enterprise",
    },
  ];

  const currentPlan = subscriptionPlans.find((plan) => plan.current);

  const handleUpgrade = async (planId: string) => {
    if (currentPlan?.id === planId) {
      toast.error("Vous êtes déjà sur ce plan");
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à niveau");
      }

      if (data.paymentUrl) {
        toast.success("Redirection vers le paiement...");
        // Rediriger vers CinetPay
        window.location.href = data.paymentUrl;
      } else {
        toast.success("Mise à niveau initiée avec succès");
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à niveau"
      );
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0; // Illimité
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-orange-500";
    return "text-green-500";
  };

  const getSavingsPercentage = () => {
    if (!currentPlan) return 0;
    const monthlyTotal = currentPlan.monthlyPrice * 12;
    const yearlyPrice = currentPlan.yearlyPrice;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/patron/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header avec période */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  Plans d'abonnement
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Choisissez le plan qui correspond à vos besoins
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1">
              <Button
                variant={period === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("monthly")}
                className="text-sm"
              >
                Mensuel
              </Button>
              <Button
                variant={period === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("yearly")}
                className="text-sm"
              >
                Annuel
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-100 text-green-800 text-xs"
                >
                  -{getSavingsPercentage()}%
                </Badge>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Plans d'abonnement */}
      <div className="grid md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => {
          const price =
            period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const isLoading = loading === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.current
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                  : plan.popular
                  ? "border-purple-300 shadow-lg"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1">
                    Plan actuel
                  </Badge>
                </div>
              )}
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  {plan.name}
                  {plan.popular && <Zap className="h-4 w-4 text-yellow-500" />}
                </CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(price)}
                    <span className="text-sm font-normal text-gray-600">
                      {" "}
                      FCFA
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    /{period === "yearly" ? "an" : "mois"}
                  </div>
                  {period === "yearly" && (
                    <div className="text-xs text-green-600 font-medium">
                      Économisez{" "}
                      {formatPrice(plan.monthlyPrice * 12 - plan.yearlyPrice)}{" "}
                      FCFA/an
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.current || isLoading}
                  className={`w-full ${
                    plan.current
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : plan.current ? (
                    "Plan actuel"
                  ) : (
                    <>
                      Passer à {plan.name}
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Utilisation des ressources */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Utilisation actuelle</CardTitle>
              <CardDescription>
                Suivi de vos ressources par rapport à votre plan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Entreprises */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Entreprises</span>
                </div>
                <span
                  className={`text-sm font-medium ${getUsageColor(
                    getUsagePercentage(
                      stats.companies,
                      currentPlan?.maxCompanies || 1
                    )
                  )}`}
                >
                  {stats.companies}/
                  {currentPlan?.maxCompanies === -1
                    ? "∞"
                    : currentPlan?.maxCompanies}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(
                  stats.companies,
                  currentPlan?.maxCompanies || 1
                )}
                className="h-2"
              />
            </div>

            {/* Employés */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Employés</span>
                </div>
                <span
                  className={`text-sm font-medium ${getUsageColor(
                    getUsagePercentage(
                      stats.employees,
                      currentPlan?.maxEmployees || 5
                    )
                  )}`}
                >
                  {stats.employees}/
                  {currentPlan?.maxEmployees === -1
                    ? "∞"
                    : currentPlan?.maxEmployees}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(
                  stats.employees,
                  currentPlan?.maxEmployees || 5
                )}
                className="h-2"
              />
            </div>

            {/* Bus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Véhicules</span>
                </div>
                <span
                  className={`text-sm font-medium ${getUsageColor(
                    getUsagePercentage(stats.buses, currentPlan?.maxBuses || 3)
                  )}`}
                >
                  {stats.buses}/
                  {currentPlan?.maxBuses === -1 ? "∞" : currentPlan?.maxBuses}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(
                  stats.buses,
                  currentPlan?.maxBuses || 3
                )}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques mensuelles */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Performance mensuelle</CardTitle>
              <CardDescription>
                Vos revenus et statistiques du mois en cours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(stats.monthlyRevenue)}
              </div>
              <div className="text-sm text-gray-600">FCFA ce mois</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {stats.companies}
              </div>
              <div className="text-sm text-gray-600">Entreprises actives</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {stats.employees}
              </div>
              <div className="text-sm text-gray-600">Employés totaux</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {stats.buses}
              </div>
              <div className="text-sm text-gray-600">Véhicules en service</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
