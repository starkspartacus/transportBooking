// This is a placeholder for your client dashboard layout.
// Ensure your actual layout component wraps the content of client pages.
// For example, it might include the header, sidebar, etc.
import type React from "react";
import MainNavigation from "@/components/layout/main-navigation"; // Assuming you have a main navigation

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
}

export function ClientDashboardLayout({
  children,
}: ClientDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <MainNavigation /> {/* Your main navigation/header */}
      <main className="py-6">{children}</main>
    </div>
  );
}
