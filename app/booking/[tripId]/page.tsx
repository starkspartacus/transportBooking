"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { TripWithDetails } from "@/lib/types";
import BookingForm from "@/components/booking/booking-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function BookingPage() {
  const params = useParams();
  const tripId = params?.tripId as string;
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch trip details");
        }
        const data = await response.json();
        setTrip(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId]);

  const handleBookingComplete = (bookingData: any) => {
    setBookingSuccess(bookingData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p>Chargement des détails du voyage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-destructive">Erreur: {error}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p>Voyage non trouvé.</p>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-bold">
              Réservation Confirmée !
            </CardTitle>
            <CardDescription>
              Votre réservation a été effectuée avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">
              Code de réservation:{" "}
              {bookingSuccess.reservation.reservationNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez noter vos codes de ticket et les présenter à la gare 2
              heures avant le départ.
            </p>
            {bookingSuccess.tickets && bookingSuccess.tickets.length > 0 && (
              <div className="text-left">
                <h4 className="font-medium mb-2">Vos tickets:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {bookingSuccess.tickets.map((ticket: any) => (
                    <li key={ticket.id}>
                      Siège {ticket.seatNumber}: {ticket.ticketNumber} (
                      {ticket.passengerName})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {bookingSuccess.whatsappLink && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Cliquez ci-dessous pour recevoir votre confirmation sur
                  WhatsApp:
                </p>
                <Button asChild>
                  <a
                    href={bookingSuccess.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Recevoir sur WhatsApp{" "}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}

            <Button asChild className="mt-6">
              <Link href="/client">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Réserver un voyage</h1>
      <BookingForm trip={trip} onBookingComplete={handleBookingComplete} />
    </div>
  );
}
