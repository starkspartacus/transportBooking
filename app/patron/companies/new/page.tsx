import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CompanyCreationForm from "@/components/patron/company-creation-form";

export default async function NewCompanyPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PATRON") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <CompanyCreationForm />
      </div>
    </div>
  );
}
