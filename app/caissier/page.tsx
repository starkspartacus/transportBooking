import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CashierDashboard from "@/components/dashboard/cashier-dashboard"

export default async function CashierPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return <CashierDashboard />
}
