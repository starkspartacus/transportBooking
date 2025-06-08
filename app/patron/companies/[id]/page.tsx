import CompanyDetailsDashboard from "@/components/patron/company-details-dashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyDetailsDashboard companyId={id} />
    </div>
  );
}
