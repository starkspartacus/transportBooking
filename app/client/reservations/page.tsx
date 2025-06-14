import { Suspense } from "react";
import { ClientDashboardLayout } from "@/components/client/client-dashboard-layout"; // Assuming you have a layout for client dashboard
import { ReservationHistory } from "@/components/client/reservation-history";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientReservationsPage() {
  return (
    <ClientDashboardLayout>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">Mes Réservations</h1>
        <Suspense fallback={<ReservationsLoadingSkeleton />}>
          <ReservationHistory />
        </Suspense>
      </div>
    </ClientDashboardLayout>
  );
}

function ReservationsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-lg shadow-md animate-pulse"
        >
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
