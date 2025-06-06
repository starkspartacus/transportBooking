import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import MultiCompanyDashboard from "@/components/patron/multi-company-dashboard";

export default async function PatronPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PATRON") {
    redirect("/auth/signin");
  }

  return <MultiCompanyDashboard />;
}
