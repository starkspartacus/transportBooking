"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Star,
  Gift,
  Trophy,
  Crown,
  Sparkles,
  History,
  MapPin,
  Calendar,
  CreditCard,
  Award,
  Zap,
  Heart,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface LoyaltyData {
  points: number;
  level: string;
  totalSpent: number;
  totalTrips: number;
  nextLevelPoints: number;
  rewards: LoyaltyReward[];
  recentTrips: TripHistory[];
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercentage?: number;
  discountAmount?: number;
  validityDays: number;
  isActive: boolean;
}

interface TripHistory {
  id: string;
  date: string;
  route: string;
  amount: number;
  status: string;
  pointsEarned: number;
}

export default function ClientLoyaltySettings() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch("/api/client/loyalty");
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const response = await fetch("/api/client/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });

      if (response.ok) {
        toast({
          title: "🎉 Récompense récupérée !",
          description: "Votre récompense a été ajoutée à votre compte",
        });
        fetchLoyaltyData();
      } else {
        throw new Error("Erreur lors de la récupération");
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de récupérer la récompense",
        variant: "destructive",
      });
    }
  };

  const getLevelInfo = (level: string) => {
    const levels = {
      BRONZE: {
        name: "Bronze",
        color: "from-amber-600 to-orange-600",
        icon: Award,
        benefits: ["1 point par 1000 FCFA", "Réductions exclusives"],
      },
      SILVER: {
        name: "Argent",
        color: "from-gray-400 to-gray-600",
        icon: Star,
        benefits: [
          "1.5 points par 1000 FCFA",
          "Réductions VIP",
          "Support prioritaire",
        ],
      },
      GOLD: {
        name: "Or",
        color: "from-yellow-400 to-yellow-600",
        icon: Crown,
        benefits: [
          "2 points par 1000 FCFA",
          "Réductions premium",
          "Accès anticipé",
        ],
      },
      PLATINUM: {
        name: "Platine",
        color: "from-purple-400 to-purple-600",
        icon: Trophy,
        benefits: [
          "3 points par 1000 FCFA",
          "Réductions maximales",
          "Service VIP",
        ],
      },
    };
    return levels[level as keyof typeof levels] || levels.BRONZE;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Chargement de vos données de fidélité...
          </p>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Programme de fidélité</h3>
          <p className="text-gray-600 mb-4">
            Rejoignez notre programme pour gagner des points et des récompenses
            !
          </p>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Star className="h-4 w-4 mr-2" />
            Rejoindre maintenant
          </Button>
        </CardContent>
      </Card>
    );
  }

  const levelInfo = getLevelInfo(loyaltyData.level);
  const LevelIcon = levelInfo.icon;
  const progressToNext =
    loyaltyData.nextLevelPoints > 0
      ? (loyaltyData.points / loyaltyData.nextLevelPoints) * 100
      : 100;

  return (
    <div className="space-y-6">
      {/* Header avec statut de fidélité */}
      <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div
              className={`p-3 bg-gradient-to-r ${levelInfo.color} rounded-xl text-white`}
            >
              <LevelIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Programme de Fidélité
              </h2>
              <p className="text-sm text-gray-600 font-normal">
                Gagnez des points et débloquez des récompenses
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statut actuel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    className={`bg-gradient-to-r ${levelInfo.color} text-white px-4 py-2 text-lg font-bold`}
                  >
                    <LevelIcon className="h-5 w-5 mr-2" />
                    {levelInfo.name}
                  </Badge>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loyaltyData.points.toLocaleString()} points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Prochain niveau</p>
                  <p className="font-semibold">
                    {loyaltyData.nextLevelPoints > 0
                      ? `${
                          loyaltyData.nextLevelPoints - loyaltyData.points
                        } points restants`
                      : "Niveau maximum atteint"}
                  </p>
                </div>
              </div>

              {loyaltyData.nextLevelPoints > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression vers le niveau suivant</span>
                    <span>{Math.round(progressToNext)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">FCFA dépensés</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData.totalTrips}
                  </p>
                  <p className="text-sm text-gray-600">Voyages effectués</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData.level}
                  </p>
                  <p className="text-sm text-gray-600">Niveau actuel</p>
                </div>
              </div>
            </div>

            {/* Avantages du niveau */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Avantages {levelInfo.name}
              </h3>
              <ul className="space-y-3">
                {levelInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation des onglets */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className={
            activeTab === "overview"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : ""
          }
        >
          <Star className="h-4 w-4 mr-2" />
          Vue d'ensemble
        </Button>
        <Button
          variant={activeTab === "rewards" ? "default" : "ghost"}
          onClick={() => setActiveTab("rewards")}
          className={
            activeTab === "rewards"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : ""
          }
        >
          <Gift className="h-4 w-4 mr-2" />
          Récompenses
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          onClick={() => setActiveTab("history")}
          className={
            activeTab === "history"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : ""
          }
        >
          <History className="h-4 w-4 mr-2" />
          Historique
        </Button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comment gagner des points */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                  <Target className="h-5 w-5" />
                </div>
                Comment gagner des points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-500 rounded-full">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Réservez un voyage</p>
                  <p className="text-sm text-gray-600">
                    1 point par 1000 FCFA dépensés
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Laissez un avis</p>
                  <p className="text-sm text-gray-600">50 points par avis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-500 rounded-full">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Parrainez un ami</p>
                  <p className="text-sm text-gray-600">
                    200 points par parrainage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques détaillées */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Vos statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900">12</p>
                  <p className="text-xs text-gray-600">Voyages ce mois</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <Zap className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900">850</p>
                  <p className="text-xs text-gray-600">Points ce mois</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-600">Récompenses utilisées</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900">3j</p>
                  <p className="text-xs text-gray-600">Temps économisé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loyaltyData.rewards.map((reward) => (
            <Card
              key={reward.id}
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold text-lg">
                      {reward.pointsCost} points
                    </span>
                  </div>
                  {reward.discountPercentage && (
                    <Badge className="bg-green-100 text-green-800">
                      -{reward.discountPercentage}%
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Valide {reward.validityDays} jours
                  </div>
                </div>

                <Button
                  onClick={() => redeemReward(reward.id)}
                  disabled={loyaltyData.points < reward.pointsCost}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {loyaltyData.points >= reward.pointsCost ? (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Récupérer
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      {reward.pointsCost - loyaltyData.points} points manquants
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                <History className="h-5 w-5" />
              </div>
              Historique des voyages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loyaltyData.recentTrips.map((trip, index) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{trip.route}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(trip.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {trip.amount.toLocaleString()} FCFA
                    </p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Star className="h-3 w-3" />+{trip.pointsEarned} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
