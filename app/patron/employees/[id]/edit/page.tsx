import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EmployeeEditForm from "@/components/patron/employee-edit-form";

export const metadata: Metadata = {
  title: "Modifier l'employé | Transport Booking",
  description: "Modifiez les informations de l'employé",
};

export default async function EmployeeEditPage({
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
      <EmployeeEditForm employeeId={params.id} />
    </div>
  );
}
