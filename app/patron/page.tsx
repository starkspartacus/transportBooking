import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PatronDashboard from "@/components/patron/patron-dashboard";

export default async function PatronPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PATRON") {
    redirect("/auth/signin");
  }

  return <PatronDashboard />;
}
