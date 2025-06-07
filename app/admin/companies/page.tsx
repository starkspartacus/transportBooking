import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { CompanyList } from "@/components/admin/company-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Gestion des entreprises | Administration",
  description: "Gérez et approuvez les entreprises de transport",
};

export default async function AdminCompaniesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Gestion des entreprises</h1>

          <Suspense fallback={<CompanyListSkeleton />}>
            <CompanyList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CompanyListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton className="h-9 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
