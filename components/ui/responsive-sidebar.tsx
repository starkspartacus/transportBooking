"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  active?: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: SidebarLinkProps) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link href={href}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {badge && badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
};

export function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
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

      // Set up interval to refresh count
      const interval = setInterval(fetchUnreadCount, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [session]);

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (!session) return [];

    switch (session.user.role) {
      case "ADMIN":
        return [
          { href: "/admin", icon: Home, label: "Tableau de bord" },
          { href: "/admin/companies", icon: Building2, label: "Entreprises" },
          { href: "/admin/users", icon: Users, label: "Utilisateurs" },
          { href: "/admin/analytics", icon: BarChart3, label: "Analyses" },
          { href: "/admin/settings", icon: Settings, label: "Paramètres" },
        ];
      case "PATRON":
        return [
          { href: "/patron", icon: Home, label: "Tableau de bord" },
          { href: "/patron/employees", icon: Users, label: "Employés" },
          { href: "/patron/trips", icon: Bus, label: "Voyages" },
          { href: "/patron/reservations", icon: Ticket, label: "Réservations" },
          { href: "/patron/finances", icon: CreditCard, label: "Finances" },
          { href: "/patron/settings", icon: Settings, label: "Paramètres" },
        ];
      case "MANAGER":
        return [
          { href: "/gestionnaire", icon: Home, label: "Tableau de bord" },
          { href: "/gestionnaire/trips", icon: Bus, label: "Voyages" },
          {
            href: "/gestionnaire/reservations",
            icon: Ticket,
            label: "Réservations",
          },
          {
            href: "/gestionnaire/analytics",
            icon: BarChart3,
            label: "Analyses",
          },
          {
            href: "/gestionnaire/operations",
            icon: Calendar,
            label: "Opérations",
          },
        ];
      case "CASHIER":
        return [
          { href: "/caissier", icon: Home, label: "Tableau de bord" },
          { href: "/caissier/payments", icon: CreditCard, label: "Paiements" },
          { href: "/caissier/tickets", icon: Ticket, label: "Billets" },
        ];
      case "CLIENT":
        return [
          { href: "/client", icon: Home, label: "Accueil" },
          {
            href: "/client/reservations",
            icon: Ticket,
            label: "Mes réservations",
          },
          { href: "/client/trips", icon: Bus, label: "Rechercher" },
          { href: "/profile", icon: User, label: "Mon profil" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
                <Bus className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">TransportApp</h1>
                {session?.user?.company?.name && (
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.company.name}
                  </p>
                )}
              </div>
              <SidebarTrigger />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navLinks.map((link) => (
                    <SidebarLink
                      key={link.href}
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      active={pathname === link.href}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {session?.user?.role === "ADMIN" && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarLink
                      href="/admin/system"
                      icon={Shield}
                      label="Système"
                      active={pathname === "/admin/system"}
                    />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Notifications</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Notifications">
                      <Link href="/notifications">
                        <Bell className="h-4 w-4" />
                        <span>Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                    {unreadCount > 0 && (
                      <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Aide">
                  <Link href="/help">
                    <HelpCircle className="h-4 w-4" />
                    <span>Aide</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => signOut({ callbackUrl: "/" })}
                  tooltip="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b p-4">
            <div className="flex items-center justify-between">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
