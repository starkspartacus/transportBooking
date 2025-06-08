import EmployeeEditForm from "@/components/patron/employee-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <EmployeeEditForm employeeId={id} />
    </div>
  );
}
