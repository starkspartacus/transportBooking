import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientDashboard from "@/components/client/client-dashboard";

export default async function ClientPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/unauthorized");
  }

  return <ClientDashboard />;
}
