"use client";

import { CashierDashboard } from "./cashier-dashboard";

interface CashierDashboardWrapperProps {
  initialStats: {
    totalSalesToday: number;
    totalTicketsSoldToday: number;
    totalReservationsToday: number;
    pendingPaymentsToday: number;
  };
}

export function CashierDashboardWrapper({
  initialStats,
}: CashierDashboardWrapperProps) {
  return <CashierDashboard initialStats={initialStats} />;
}
