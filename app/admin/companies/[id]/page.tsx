import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { CompanyDetails } from "@/components/admin/company-details";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Détails de l'entreprise | Administration",
  description: "Voir et gérer les détails d'une entreprise de transport",
};

interface PageProps {
  params: { id: string };
}

export default async function AdminCompanyDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<CompanyDetailsSkeleton />}>
            <CompanyDetails id={params.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CompanyDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>

      <Skeleton className="h-64" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
