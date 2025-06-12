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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Clock,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  Shield,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function EmployeeSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [workPreferences, setWorkPreferences] = useState({
    autoClockIn: false,
    breakReminders: true,
    shiftNotifications: true,
    performanceTracking: true,
  });

  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    tasksCompleted: 0,
    performance: 0,
    nextShift: "",
  });

  const isManager = session?.user.role === "GESTIONNAIRE";
  const isCashier = session?.user.role === "CAISSIER";

  useEffect(() => {
    // Charger les statistiques de l'employé
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/employee/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching employee stats:", error);
      }
    };

    fetchStats();
  }, []);

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/employee/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workPreferences),
      });

      if (response.ok) {
        toast.success("Préférences sauvegardées");
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (
    key: keyof typeof workPreferences,
    value: boolean
  ) => {
    setWorkPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
              {isManager ? (
                <BarChart3 className="h-6 w-6" />
              ) : (
                <CreditCard className="h-6 w-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                {isManager ? "Paramètres Gestionnaire" : "Paramètres Caissier"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configurez vos préférences de travail et suivez vos performances
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques de performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Performance cette semaine
              </CardTitle>
              <CardDescription>Vos statistiques de travail</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {stats.hoursThisWeek}h
              </div>
              <div className="text-sm text-gray-600">Heures travaillées</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {stats.tasksCompleted}
              </div>
              <div className="text-sm text-gray-600">
                {isManager ? "Voyages gérés" : "Transactions"}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">
                {stats.performance}%
              </div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
              <div className="text-sm font-bold text-orange-600">
                {stats.nextShift || "Aucun"}
              </div>
              <div className="text-sm text-gray-600">Prochain service</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Préférences de travail */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Préférences de travail</CardTitle>
              <CardDescription>
                Personnalisez votre environnement de travail
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Pointage automatique</p>
                  <p className="text-sm text-gray-600">
                    Se pointer automatiquement à l'arrivée
                  </p>
                </div>
              </div>
              <Switch
                checked={workPreferences.autoClockIn}
                onCheckedChange={(checked) =>
                  updatePreference("autoClockIn", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Bell className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Rappels de pause</p>
                  <p className="text-sm text-gray-600">
                    Recevoir des rappels pour les pauses
                  </p>
                </div>
              </div>
              <Switch
                checked={workPreferences.breakReminders}
                onCheckedChange={(checked) =>
                  updatePreference("breakReminders", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Notifications de service</p>
                  <p className="text-sm text-gray-600">
                    Être notifié des changements d'horaires
                  </p>
                </div>
              </div>
              <Switch
                checked={workPreferences.shiftNotifications}
                onCheckedChange={(checked) =>
                  updatePreference("shiftNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Suivi des performances</p>
                  <p className="text-sm text-gray-600">
                    Permettre le suivi de vos performances
                  </p>
                </div>
              </div>
              <Switch
                checked={workPreferences.performanceTracking}
                onCheckedChange={(checked) =>
                  updatePreference("performanceTracking", checked)
                }
              />
            </div>
          </div>

          <Separator />

          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {loading ? "Sauvegarde..." : "Sauvegarder les préférences"}
          </Button>
        </CardContent>
      </Card>

      {/* Outils spécifiques au rôle */}
      {isManager && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Outils de gestion</CardTitle>
                <CardDescription>
                  Accès rapide aux fonctionnalités de gestionnaire
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <Calendar className="h-6 w-6 text-blue-500" />
                <span>Planifier voyages</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <Users className="h-6 w-6 text-green-500" />
                <span>Gérer équipe</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <BarChart3 className="h-6 w-6 text-purple-500" />
                <span>Rapports</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <Building2 className="h-6 w-6 text-orange-500" />
                <span>Gestion flotte</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCashier && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Outils de caisse</CardTitle>
                <CardDescription>
                  Accès rapide aux fonctionnalités de caissier
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <CreditCard className="h-6 w-6 text-green-500" />
                <span>Vendre tickets</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <Shield className="h-6 w-6 text-blue-500" />
                <span>Valider réservations</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <BarChart3 className="h-6 w-6 text-purple-500" />
                <span>Ventes du jour</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
              >
                <Clock className="h-6 w-6 text-orange-500" />
                <span>Historique</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de l'entreprise */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-slate-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Informations entreprise</CardTitle>
              <CardDescription>Détails de votre entreprise</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div>
                <p className="font-medium text-gray-900">Nom de l'entreprise</p>
                <p className="text-sm text-gray-600">
                  {session?.user.company?.name || "Non défini"}
                </p>
              </div>
              <Badge variant="outline">
                {session?.user.role === "GESTIONNAIRE"
                  ? "Gestionnaire"
                  : "Caissier"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div>
                <p className="font-medium text-gray-900">Statut</p>
                <p className="text-sm text-gray-600">Employé actif</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Actif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
