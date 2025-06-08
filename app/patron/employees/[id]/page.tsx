import EmployeeDetails from "@/components/patron/employee-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <EmployeeDetails employeeId={id} />
    </div>
  );
}
