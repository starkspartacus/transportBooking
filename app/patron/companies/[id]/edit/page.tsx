import CompanyEditForm from "@/components/patron/company-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <CompanyEditForm companyId={id} />
    </div>
  );
}
