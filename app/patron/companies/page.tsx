import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CompanyManagement from "@/components/patron/company-management";

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PATRON") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <CompanyManagement />
      </div>
    </div>
  );
}
