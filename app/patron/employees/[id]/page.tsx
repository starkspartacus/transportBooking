import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EmployeeDetails from "@/components/patron/employee-details";

export const metadata: Metadata = {
  title: "Détails de l'employé | Transport Booking",
  description: "Consultez les détails de l'employé",
};

export default async function EmployeeDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/patron/employees");
  }

  if (!["ADMIN", "PATRON"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <EmployeeDetails employeeId={params.id} />
    </div>
  );
}
