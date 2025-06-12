"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import GuestBookingForm from "@/components/booking/guest-booking-form";
import { useSession } from "next-auth/react";

interface Trip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  bus: {
    id: string;
    model: string;
    brand?: string;
    features: string[];
  };
  route: {
    id: string;
    name: string;
    distance: number;
    estimatedDuration: number;
  };
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Safe params handling
  const tripId = params?.tripId as string | undefined;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    } else {
      setLoading(false);
      toast.error("ID de voyage manquant");
      router.push("/search");
    }
  }, [tripId, router]);

  const fetchTrip = async () => {
    if (!tripId) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
      } else {
        toast.error("Voyage non trouvé");
        router.push("/search");
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast.error("Erreur lors du chargement du voyage");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = (data: any) => {
    setBookingData(data);
    setBookingComplete(true);
  };

  // Early return if no tripId
  if (!tripId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">ID de voyage manquant</p>
            <Link href="/search">
              <Button>Retour à la recherche</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement du voyage...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Voyage non trouvé</h2>
            <p className="text-gray-600 mb-4">
              Le voyage que vous recherchez n'existe pas ou n'est plus
              disponible.
            </p>
            <Link href="/search">
              <Button>Retour à la recherche</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete && bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-600">
                Réservation confirmée !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Détails de votre réservation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Code de réservation:</span>
                    <span className="font-mono font-bold">
                      {bookingData.reservation?.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trajet:</span>
                    <span>
                      {trip.departureCity} → {trip.arrivalCity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passager:</span>
                    <span>{bookingData.reservation?.passengerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">
                      {bookingData.reservation?.totalAmount?.toLocaleString()}{" "}
                      FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Instructions importantes
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Présentez-vous à la gare 30 minutes avant le départ</li>
                  <li>• Apportez une pièce d'identité valide</li>
                  <li>• Conservez votre code de réservation</li>
                  {bookingData.reservation?.paymentMethod === "CASH" && (
                    <li>• Effectuez le paiement à la gare avant le départ</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-4">
                <Link href="/search" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Nouvelle recherche
                  </Button>
                </Link>
                <Button onClick={() => window.print()} className="flex-1">
                  Imprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/search"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour à la recherche
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                TransportApp
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Réservation de voyage
          </h1>
          <p className="text-gray-600">
            Complétez vos informations pour finaliser votre réservation
          </p>
        </div>

        <GuestBookingForm
          trip={trip}
          onBookingComplete={handleBookingComplete}
        />
      </div>
    </div>
  );
}
