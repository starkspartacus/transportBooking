"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  Volume2,
  VolumeX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react";

interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    tripReminders: boolean;
    promotions: boolean;
    systemUpdates: boolean;
  };
  push: {
    bookingUpdates: boolean;
    tripAlerts: boolean;
    promotions: boolean;
    emergencyAlerts: boolean;
  };
  sms: {
    bookingConfirmation: boolean;
    tripReminders: boolean;
    emergencyOnly: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationSettings() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      bookingConfirmation: true,
      tripReminders: true,
      promotions: false,
      systemUpdates: true,
    },
    push: {
      bookingUpdates: true,
      tripAlerts: true,
      promotions: false,
      emergencyAlerts: true,
    },
    sms: {
      bookingConfirmation: true,
      tripReminders: true,
      emergencyOnly: true,
    },
    sound: {
      enabled: true,
      volume: 70,
    },
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "07:00",
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Préférences de notification sauvegardées");
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
    category: keyof NotificationPreferences,
    key: string,
    value: boolean | number | string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const notificationCategories = [
    {
      id: "email",
      title: "Notifications Email",
      description: "Recevez des notifications par email",
      icon: Mail,
      color: "from-blue-500 to-cyan-500",
      settings: [
        {
          key: "bookingConfirmation",
          label: "Confirmations de réservation",
          essential: true,
        },
        { key: "tripReminders", label: "Rappels de voyage", essential: false },
        {
          key: "promotions",
          label: "Offres promotionnelles",
          essential: false,
        },
        {
          key: "systemUpdates",
          label: "Mises à jour système",
          essential: true,
        },
      ],
    },
    {
      id: "push",
      title: "Notifications Push",
      description: "Notifications instantanées sur votre appareil",
      icon: Bell,
      color: "from-green-500 to-emerald-500",
      settings: [
        {
          key: "bookingUpdates",
          label: "Mises à jour de réservation",
          essential: true,
        },
        { key: "tripAlerts", label: "Alertes de voyage", essential: true },
        { key: "promotions", label: "Offres spéciales", essential: false },
        { key: "emergencyAlerts", label: "Alertes d'urgence", essential: true },
      ],
    },
    {
      id: "sms",
      title: "Notifications SMS",
      description: "Messages texte sur votre téléphone",
      icon: MessageSquare,
      color: "from-orange-500 to-red-500",
      settings: [
        {
          key: "bookingConfirmation",
          label: "Confirmations de réservation",
          essential: true,
        },
        { key: "tripReminders", label: "Rappels de voyage", essential: false },
        { key: "emergencyOnly", label: "Urgences uniquement", essential: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                Notifications
              </CardTitle>
              <CardDescription className="text-gray-600">
                Gérez vos préférences de notification pour rester informé
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Paramètres de notification par catégorie */}
      <div className="grid gap-6">
        {notificationCategories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <Card
              key={category.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 bg-gradient-to-r ${category.color} rounded-xl text-white`}
                    >
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {category.title}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`bg-gradient-to-r ${category.color} text-white border-0 px-3 py-1`}
                  >
                    {
                      category.settings.filter(
                        (setting) =>
                          preferences[
                            category.id as keyof NotificationPreferences
                          ][setting.key as any]
                      ).length
                    }
                    /{category.settings.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.settings.map((setting, index) => (
                  <div key={setting.key}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {setting.essential ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {setting.label}
                          </span>
                        </div>
                        {setting.essential && (
                          <Badge variant="secondary" className="text-xs">
                            Essentiel
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={
                          preferences[
                            category.id as keyof NotificationPreferences
                          ][setting.key as any]
                        }
                        onCheckedChange={(checked) =>
                          updatePreference(
                            category.id as keyof NotificationPreferences,
                            setting.key,
                            checked
                          )
                        }
                        disabled={setting.essential}
                      />
                    </div>
                    {index < category.settings.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Paramètres avancés */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Paramètres sonores */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                {preferences.sound.enabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Sons</CardTitle>
                <CardDescription>
                  Paramètres audio des notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Activer les sons</span>
              <Switch
                checked={preferences.sound.enabled}
                onCheckedChange={(checked) =>
                  updatePreference("sound", "enabled", checked)
                }
              />
            </div>
            {preferences.sound.enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volume</span>
                  <span className="text-sm font-medium">
                    {preferences.sound.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences.sound.volume}
                  onChange={(e) =>
                    updatePreference(
                      "sound",
                      "volume",
                      Number.parseInt(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heures silencieuses */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Heures silencieuses</CardTitle>
                <CardDescription>
                  Suspendre les notifications pendant certaines heures
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Activer les heures silencieuses
              </span>
              <Switch
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) =>
                  updatePreference("quietHours", "enabled", checked)
                }
              />
            </div>
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Début</label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) =>
                      updatePreference(
                        "quietHours",
                        "startTime",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Fin</label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) =>
                      updatePreference("quietHours", "endTime", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouton de sauvegarde */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Sauvegarder les modifications
                </p>
                <p className="text-sm text-gray-600">
                  Vos préférences seront appliquées immédiatement
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
