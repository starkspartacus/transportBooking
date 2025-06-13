import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CashierDashboardWrapper } from "@/components/dashboard/cashier-dashboard-wrapper";

export default async function CashierPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  // Fetch initial stats for the dashboard
  const initialStats = {
    totalSalesToday: 0,
    totalTicketsSoldToday: 0,
    totalReservationsToday: 0,
    pendingPaymentsToday: 0,
  };

  return <CashierDashboardWrapper initialStats={initialStats} />;
}
