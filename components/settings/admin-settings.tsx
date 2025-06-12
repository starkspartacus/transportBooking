"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  Database,
  Bell,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Server,
  Activity,
} from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    autoApproveCompanies: false,
    maxCompaniesPerUser: 5,
    systemAlerts: true,
  });

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    pendingApprovals: 0,
    systemHealth: "healthy",
  });

  useEffect(() => {
    // Charger les statistiques système
    const fetchSystemStats = async () => {
      try {
        const response = await fetch("/api/admin/system-stats");
        if (response.ok) {
          const data = await response.json();
          setSystemStats(data);
        }
      } catch (error) {
        console.error("Error fetching system stats:", error);
      }
    };

    fetchSystemStats();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemSettings),
      });

      if (response.ok) {
        toast.success("Paramètres système sauvegardés");
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (
    key: keyof typeof systemSettings,
    value: boolean | number
  ) => {
    setSystemSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                Administration Système
              </CardTitle>
              <CardDescription className="text-gray-600">
                Gérez les paramètres globaux et surveillez la santé du système
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques système */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">État du système</CardTitle>
              <CardDescription>Surveillance en temps réel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {systemStats.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Utilisateurs totaux</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {systemStats.totalCompanies}
              </div>
              <div className="text-sm text-gray-600">Entreprises</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">
                {systemStats.pendingApprovals}
              </div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                {getHealthIcon(systemStats.systemHealth)}
                <span
                  className={`font-bold ${getHealthColor(
                    systemStats.systemHealth
                  )}`}
                >
                  {systemStats.systemHealth === "healthy"
                    ? "Sain"
                    : "Attention"}
                </span>
              </div>
              <div className="text-sm text-gray-600">Santé système</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres système */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Configuration système</CardTitle>
              <CardDescription>
                Paramètres globaux de l'application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Mode maintenance</p>
                  <p className="text-sm text-gray-600">
                    Désactiver l'accès public au système
                  </p>
                </div>
              </div>
              <Switch
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) =>
                  updateSetting("maintenanceMode", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Inscriptions ouvertes</p>
                  <p className="text-sm text-gray-600">
                    Permettre les nouvelles inscriptions
                  </p>
                </div>
              </div>
              <Switch
                checked={systemSettings.registrationEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("registrationEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Approbation automatique</p>
                  <p className="text-sm text-gray-600">
                    Approuver automatiquement les nouvelles entreprises
                  </p>
                </div>
              </div>
              <Switch
                checked={systemSettings.autoApproveCompanies}
                onCheckedChange={(checked) =>
                  updateSetting("autoApproveCompanies", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Bell className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Notifications email</p>
                  <p className="text-sm text-gray-600">
                    Envoyer des notifications par email
                  </p>
                </div>
              </div>
              <Switch
                checked={systemSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("emailNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Alertes système</p>
                  <p className="text-sm text-gray-600">
                    Recevoir les alertes critiques
                  </p>
                </div>
              </div>
              <Switch
                checked={systemSettings.systemAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("systemAlerts", checked)
                }
              />
            </div>
          </div>

          <Separator />

          {/* Paramètres numériques */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxCompanies">
                Nombre maximum d'entreprises par utilisateur
              </Label>
              <Input
                id="maxCompanies"
                type="number"
                min="1"
                max="20"
                value={systemSettings.maxCompaniesPerUser}
                onChange={(e) =>
                  updateSetting(
                    "maxCompaniesPerUser",
                    Number.parseInt(e.target.value)
                  )
                }
                className="w-32"
              />
              <p className="text-sm text-gray-600">
                Limite le nombre d'entreprises qu'un patron peut créer
              </p>
            </div>
          </div>

          <Separator />

          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {loading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
          </Button>
        </CardContent>
      </Card>

      {/* Actions d'administration */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Actions système</CardTitle>
              <CardDescription>Outils d'administration avancés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 hover:bg-blue-50"
            >
              <Database className="h-6 w-6 text-blue-500" />
              <span>Sauvegarde DB</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 hover:bg-green-50"
            >
              <Activity className="h-6 w-6 text-green-500" />
              <span>Logs système</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 hover:bg-purple-50"
            >
              <Users className="h-6 w-6 text-purple-500" />
              <span>Gestion utilisateurs</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 hover:bg-orange-50"
            >
              <Building2 className="h-6 w-6 text-orange-500" />
              <span>Gestion entreprises</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertes système */}
      {systemStats.systemHealth !== "healthy" && (
        <Card className="border-0 shadow-lg border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-orange-800">
                  Attention requise
                </h3>
                <p className="text-sm text-orange-700">
                  Le système nécessite une attention. Vérifiez les logs pour
                  plus de détails.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
