"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Star,
  History,
  Crown,
  Building2,
  Users,
  BarChart3,
} from "lucide-react";

// Import des composants settings
import ProfileSettings from "./profile-settings";
import NotificationSettings from "./notification-settings";
import SecuritySettings from "./security-settings";
import PatronSettings from "./patron-settings";
import ClientLoyaltySettings from "./client-loyalty-settings";
import EmployeeSettings from "./employee-settings";
import AdminSettings from "./admin-settings";
import LogoutButton from "./logout-button";

export default function SettingsLayout() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role;

  // Configuration des onglets selon le rôle
  const getTabsConfig = () => {
    const baseTabs = [
      {
        id: "profile",
        label: "Profil",
        icon: User,
        color: "from-blue-500 to-cyan-500",
        description: "Informations personnelles",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        color: "from-yellow-500 to-orange-500",
        description: "Préférences de notification",
      },
      {
        id: "security",
        label: "Sécurité",
        icon: Shield,
        color: "from-green-500 to-emerald-500",
        description: "Mot de passe et sécurité",
      },
    ];

    // Onglets spécifiques par rôle
    const roleTabs = {
      ADMIN: [
        {
          id: "admin",
          label: "Administration",
          icon: Settings,
          color: "from-purple-500 to-indigo-500",
          description: "Paramètres système",
        },
      ],
      PATRON: [
        {
          id: "business",
          label: "Entreprise",
          icon: Building2,
          color: "from-indigo-500 to-purple-500",
          description: "Gestion d'entreprise",
        },
        {
          id: "subscription",
          label: "Abonnement",
          icon: Crown,
          color: "from-yellow-500 to-amber-500",
          description: "Plan et facturation",
        },
      ],
      CLIENT: [
        {
          id: "loyalty",
          label: "Fidélité",
          icon: Star,
          color: "from-pink-500 to-rose-500",
          description: "Points et récompenses",
        },
        {
          id: "history",
          label: "Historique",
          icon: History,
          color: "from-teal-500 to-cyan-500",
          description: "Mes voyages",
        },
      ],
      GESTIONNAIRE: [
        {
          id: "work",
          label: "Travail",
          icon: BarChart3,
          color: "from-blue-500 to-indigo-500",
          description: "Paramètres de travail",
        },
      ],
      CAISSIER: [
        {
          id: "work",
          label: "Travail",
          icon: CreditCard,
          color: "from-green-500 to-teal-500",
          description: "Paramètres de caisse",
        },
      ],
    };

    return [
      ...baseTabs,
      ...(roleTabs[userRole as keyof typeof roleTabs] || []),
    ];
  };

  const tabs = getTabsConfig();

  const getRoleInfo = () => {
    const roleConfig = {
      ADMIN: {
        label: "Administrateur",
        color: "bg-gradient-to-r from-purple-600 to-indigo-600",
        icon: Crown,
      },
      PATRON: {
        label: "Patron",
        color: "bg-gradient-to-r from-indigo-600 to-purple-600",
        icon: Building2,
      },
      CLIENT: {
        label: "Client",
        color: "bg-gradient-to-r from-blue-600 to-cyan-600",
        icon: User,
      },
      GESTIONNAIRE: {
        label: "Gestionnaire",
        color: "bg-gradient-to-r from-green-600 to-teal-600",
        icon: Users,
      },
      CAISSIER: {
        label: "Caissier",
        color: "bg-gradient-to-r from-orange-600 to-red-600",
        icon: CreditCard,
      },
    };

    return roleConfig[userRole as keyof typeof roleConfig] || roleConfig.CLIENT;
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec profil utilisateur */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-white via-blue-50 to-indigo-50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                      {session.user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg">
                    <RoleIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {session.user.name || "Utilisateur"}
                  </h1>
                  <p className="text-gray-600 mb-3">{session.user.email}</p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <Badge
                      className={`${roleInfo.color} text-white px-4 py-2 text-sm font-medium shadow-lg`}
                    >
                      <RoleIcon className="h-4 w-4 mr-2" />
                      {roleInfo.label}
                    </Badge>
                    {session.user.companyId && (
                      <Badge
                        variant="outline"
                        className="px-4 py-2 text-sm border-2 border-indigo-200 text-indigo-700"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Entreprise
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {new Date().toLocaleDateString("fr-FR", {
                        day: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleDateString("fr-FR", {
                        month: "short",
                      })}
                    </div>
                  </div>
                  <LogoutButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          {/* Liste des onglets avec design moderne */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-2">
              <TabsList
                className="grid w-full bg-transparent gap-2 p-2"
                style={{
                  gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                }}
              >
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300
                        data-[state=active]:bg-gradient-to-r data-[state=active]:${tab.color} 
                        data-[state=active]:text-white data-[state=active]:shadow-lg
                        data-[state=active]:scale-105 hover:scale-102
                        data-[state=inactive]:hover:bg-gray-100
                        group
                      `}
                    >
                      <div className="relative">
                        <TabIcon className="h-5 w-5 transition-transform group-data-[state=active]:scale-110" />
                        {tab.id === "notifications" && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{tab.label}</div>
                        <div className="text-xs opacity-70 hidden lg:block">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </CardContent>
          </Card>

          {/* Contenu des onglets */}
          <div className="space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecuritySettings />
            </TabsContent>

            {userRole === "ADMIN" && (
              <TabsContent value="admin" className="space-y-6">
                <AdminSettings />
              </TabsContent>
            )}

            {userRole === "PATRON" && (
              <>
                <TabsContent value="business" className="space-y-6">
                  <PatronSettings />
                </TabsContent>
                <TabsContent value="subscription" className="space-y-6">
                  <PatronSettings />
                </TabsContent>
              </>
            )}

            {userRole === "CLIENT" && (
              <>
                <TabsContent value="loyalty" className="space-y-6">
                  <ClientLoyaltySettings />
                </TabsContent>
                <TabsContent value="history" className="space-y-6">
                  <ClientLoyaltySettings />
                </TabsContent>
              </>
            )}

            {(userRole === "GESTIONNAIRE" || userRole === "CAISSIER") && (
              <TabsContent value="work" className="space-y-6">
                <EmployeeSettings />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
