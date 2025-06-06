import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CompanyDetailsDashboard from "@/components/patron/company-details-dashboard";

interface CompanyPageProps {
  params: {
    id: string;
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PATRON") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyDetailsDashboard companyId={params.id} />
    </div>
  );
}
