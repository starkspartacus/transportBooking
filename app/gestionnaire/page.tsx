import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GestionnaireDashboard from "@/components/dashboard/gestionnaire-dashboard";

export default async function GestionnairePage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  return <GestionnaireDashboard />;
}
