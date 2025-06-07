"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Bus,
  Map,
  Calendar,
  Building,
  Settings,
  BarChart3,
  Shield,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  {
    name: "Tableau de bord",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "Entreprises",
    href: "/admin/companies",
    icon: Building,
  },
  {
    name: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Employés",
    href: "/admin/employees",
    icon: Users,
  },
  {
    name: "Flotte",
    href: "/admin/fleet",
    icon: Bus,
  },
  {
    name: "Routes",
    href: "/admin/routes",
    icon: Map,
  },
  {
    name: "Voyages",
    href: "/admin/trips",
    icon: Calendar,
  },
  {
    name: "Sécurité",
    href: "/admin/security",
    icon: Shield,
  },
  {
    name: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <nav className="fixed inset-y-0 right-0 w-3/4 bg-white shadow-xl flex flex-col p-6 z-50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Administration</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop navigation */}
      <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-background">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Administration</h2>
          <p className="text-sm text-muted-foreground">Gestion système</p>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
