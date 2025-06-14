"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { ReservationCard } from "@/components/client/reservation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Frown, Info } from "lucide-react";
import { ReservationWithDetails } from "@/lib/types";

export function ReservationHistory() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      if (status === "loading") return; // Wait for session to load
      if (!session?.user?.id) {
        setError("Vous devez être connecté pour voir vos réservations.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/client/reservations`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch reservations");
        }
        const data: ReservationWithDetails[] = await response.json();
        setReservations(data);
      } catch (err: any) {
        console.error("Error fetching reservations:", err);
        setError(
          err.message ||
            "Une erreur est survenue lors du chargement de vos réservations."
        );
        toast({
          title: "Erreur de chargement",
          description:
            err.message || "Impossible de récupérer vos réservations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [session, status, toast]);

  if (isLoading) {
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

  if (error) {
    return (
      <Alert variant="destructive">
        <Frown className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (reservations.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Aucune réservation trouvée</AlertTitle>
        <AlertDescription>
          Vous n'avez pas encore effectué de réservations. Commencez à explorer
          les voyages !
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reservations.map((reservation) => (
        <ReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </div>
  );
}
