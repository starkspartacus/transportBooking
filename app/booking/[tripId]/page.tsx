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
import { useSocket } from "@/components/ui/socket-provider"; // Import useSocket

export default function BookingPage() {
  const params = useParams();
  const tripId = params?.tripId as string;
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const { socket } = useSocket(); // Get socket instance

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

    // Listen for real-time updates for this specific trip
    if (socket) {
      const handleNewReservation = (data: any) => {
        if (data.reservation && data.reservation.tripId === tripId) {
          // Update the trip's available seats and reservations count
          setTrip((prevTrip) => {
            if (!prevTrip) return null;

            const newOccupiedSeats = data.reservation.seatNumbers.map(
              (s: number) => s.toString()
            );
            const updatedReservations = [
              ...prevTrip.reservations,
              data.reservation,
            ];

            // Recalculate available seats based on updated reservations
            const currentOccupiedSeats = updatedReservations.flatMap((res) =>
              res.status === "CONFIRMED" ||
              res.status === "CHECKED_IN" ||
              res.status === "PENDING"
                ? res.seatNumbers.map((s: number) => s.toString())
                : []
            );
            const newAvailableSeats =
              prevTrip.bus.capacity - currentOccupiedSeats.length;

            return {
              ...prevTrip,
              availableSeats: newAvailableSeats,
              reservations: updatedReservations, // Update reservations array
              _count: {
                ...prevTrip._count,
                reservations: updatedReservations.length,
              },
            };
          });
        }
      };

      socket.on("new-reservation", handleNewReservation);

      return () => {
        socket.off("new-reservation", handleNewReservation);
      };
    }
  }, [tripId, socket]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Erreur</h1>
          <p className="text-red-600 mb-4">
            Une erreur s'est produite lors du chargement des détails du voyage:{" "}
            {error}
          </p>
          <a
            href="/search"
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Retour à la recherche
          </a>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">
            Voyage non trouvé
          </h1>
          <p className="text-red-600 mb-4">
            Les détails du voyage n'ont pas pu être chargés.
          </p>
          <a
            href="/search"
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Rechercher d'autres voyages
          </a>
        </div>
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
                      Siège {ticket.seatNumber}: {ticket.ticketNumber}
                      {ticket.qrCode && (
                        <div className="mt-2">
                          <img
                            src={ticket.qrCode || "/placeholder.svg"}
                            alt={`QR Code for Ticket ${ticket.ticketNumber}`}
                            className="w-24 h-24 mx-auto"
                          />
                          <p className="text-xs text-gray-500">
                            Scannez ce QR code à la gare.
                          </p>
                        </div>
                      )}
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

  // Determine the cities for display
  const departureCity = trip.route?.departureLocation || "N/A";
  const arrivalCity = trip.route?.arrivalLocation || "N/A";

  // Check if the trip is available for booking
  if (trip.status !== "SCHEDULED" && trip.status !== "BOARDING") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">
            Voyage non disponible
          </h1>
          <p className="text-red-600 mb-4">
            Ce voyage n'est plus disponible pour les réservations.
          </p>
          <a
            href="/search"
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Rechercher d'autres voyages
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Réserver votre voyage
          </h1>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-lg text-gray-700 mb-2">
              Détails du voyage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Départ</p>
                <p className="font-medium">{departureCity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Arrivée</p>
                <p className="font-medium">{arrivalCity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date et heure</p>
                <p className="font-medium">
                  {new Date(trip.departureTime).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Compagnie</p>
                <p className="font-medium">{trip.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type de bus</p>
                <p className="font-medium">
                  {trip.bus.model} ({trip.bus.features.join(", ")})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prix</p>
                <p className="font-medium text-primary">
                  {trip.currentPrice.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>

          <BookingForm trip={trip} onBookingComplete={handleBookingComplete} />
        </div>
      </div>
    </div>
  );
}
