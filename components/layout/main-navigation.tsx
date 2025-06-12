"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  Home,
  Bus,
  Ticket,
  Users,
  Settings,
  LogOut,
  Building2,
  BarChart3,
  Calendar,
  CreditCard,
  User,
  Bell,
  HelpCircle,
  Shield,
  Menu,
  Crown,
  MapPin,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function MainNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/count");
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    if (session) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Navigation configuration by role
  const getNavigationSections = (): NavSection[] => {
    if (!session) return [];

    const commonSections: NavSection[] = [
      {
        title: "Notifications",
        items: [
          {
            href: "/notifications",
            icon: Bell,
            label: "Notifications",
            badge: unreadCount,
            description: "Messages et alertes",
          },
        ],
      },
      {
        title: "Compte",
        items: [
          {
            href: "/settings",
            icon: Settings,
            label: "Paramètres",
            description: "Configuration du compte",
          },
          {
            href: "/help",
            icon: HelpCircle,
            label: "Aide",
            description: "Support et documentation",
          },
        ],
      },
    ];

    switch (session.user.role) {
      case "ADMIN":
        return [
          {
            title: "Administration",
            items: [
              {
                href: "/admin",
                icon: Home,
                label: "Tableau de bord",
                description: "Vue d'ensemble système",
              },
              {
                href: "/admin/companies",
                icon: Building2,
                label: "Entreprises",
                description: "Gestion des entreprises",
              },
              {
                href: "/admin/users",
                icon: Users,
                label: "Utilisateurs",
                description: "Gestion des comptes",
              },
              {
                href: "/admin/analytics",
                icon: BarChart3,
                label: "Analyses",
                description: "Statistiques globales",
              },
            ],
          },
          {
            title: "Système",
            items: [
              {
                href: "/admin/system",
                icon: Shield,
                label: "Système",
                description: "Configuration avancée",
              },
            ],
          },
          ...commonSections,
        ];

      case "PATRON":
        return [
          {
            title: "Gestion",
            items: [
              {
                href: "/patron",
                icon: Home,
                label: "Tableau de bord",
                description: "Vue d'ensemble entreprise",
              },
              {
                href: "/patron/companies",
                icon: Building2,
                label: "Entreprises",
                description: "Mes entreprises",
              },
              {
                href: "/patron/employees",
                icon: Users,
                label: "Employés",
                description: "Gestion du personnel",
              },
              {
                href: "/patron/buses",
                icon: Bus,
                label: "Véhicules",
                description: "Flotte de véhicules",
              },
            ],
          },
          {
            title: "Opérations",
            items: [
              {
                href: "/patron/trips",
                icon: MapPin,
                label: "Voyages",
                description: "Planification des trajets",
              },
              {
                href: "/patron/reservations",
                icon: Ticket,
                label: "Réservations",
                description: "Gestion des réservations",
              },
              {
                href: "/patron/finances",
                icon: CreditCard,
                label: "Finances",
                description: "Revenus et paiements",
              },
            ],
          },
          {
            title: "Abonnement",
            items: [
              {
                href: "/subscription",
                icon: Crown,
                label: "Mon abonnement",
                description: "Plan et facturation",
              },
            ],
          },
          ...commonSections,
        ];

      case "GESTIONNAIRE":
        return [
          {
            title: "Gestion",
            items: [
              {
                href: "/gestionnaire",
                icon: Home,
                label: "Tableau de bord",
                description: "Vue d'ensemble",
              },
              {
                href: "/gestionnaire/trips",
                icon: Bus,
                label: "Voyages",
                description: "Gestion des trajets",
              },
              {
                href: "/gestionnaire/reservations",
                icon: Ticket,
                label: "Réservations",
                description: "Suivi des réservations",
              },
            ],
          },
          {
            title: "Analyses",
            items: [
              {
                href: "/gestionnaire/analytics",
                icon: BarChart3,
                label: "Analyses",
                description: "Statistiques et rapports",
              },
              {
                href: "/gestionnaire/operations",
                icon: Calendar,
                label: "Opérations",
                description: "Planning quotidien",
              },
            ],
          },
          ...commonSections,
        ];

      case "CAISSIER":
        return [
          {
            title: "Caisse",
            items: [
              {
                href: "/caissier",
                icon: Home,
                label: "Tableau de bord",
                description: "Interface de vente",
              },
              {
                href: "/caissier/payments",
                icon: CreditCard,
                label: "Paiements",
                description: "Traitement des paiements",
              },
              {
                href: "/caissier/tickets",
                icon: Ticket,
                label: "Billets",
                description: "Émission de billets",
              },
            ],
          },
          ...commonSections,
        ];

      case "CLIENT":
        return [
          {
            title: "Voyages",
            items: [
              {
                href: "/client",
                icon: Home,
                label: "Accueil",
                description: "Recherche de trajets",
              },
              {
                href: "/search",
                icon: MapPin,
                label: "Rechercher",
                description: "Trouver un trajet",
              },
              {
                href: "/client/reservations",
                icon: Ticket,
                label: "Mes réservations",
                description: "Historique des voyages",
              },
            ],
          },
          {
            title: "Compte",
            items: [
              {
                href: "/profile",
                icon: User,
                label: "Mon profil",
                description: "Informations personnelles",
              },
            ],
          },
          ...commonSections,
        ];

      default:
        return commonSections;
    }
  };

  const navigationSections = getNavigationSections();

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

    return (
      roleConfig[session?.user?.role as keyof typeof roleConfig] ||
      roleConfig.CLIENT
    );
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-blue-100 text-blue-700 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className="h-5 w-5" />
        <div className="flex-1">
          <div className="font-medium">{item.label}</div>
          {item.description && (
            <div className="text-xs text-gray-500">{item.description}</div>
          )}
        </div>
        {item.badge && item.badge > 0 && (
          <Badge className="bg-red-500 text-white text-xs px-2 py-1">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  if (!session) return null;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
            <Bus className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TransportApp</h1>
            {session.user.companyId && (
              <p className="text-xs text-gray-500">{session.user.companyId}</p>
            )}
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {navigationSections.slice(0, 2).map((section) =>
            section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                    {session.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium text-sm">{session.user.name}</div>
                  <Badge className={`${roleInfo.color} text-white text-xs`}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Aide
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
              <Bus className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">TransportApp</h1>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                        {session.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{session.user.name}</div>
                      <Badge className={`${roleInfo.color} text-white text-xs`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </SheetTitle>
                  <SheetDescription>{session.user.email}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {navigationSections.map((section) => (
                    <div key={section.title}>
                      <h3 className="font-medium text-gray-900 mb-3">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <NavLink key={item.href} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
