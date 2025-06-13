"use client";

import { useState } from "react";
import { useSocket } from "@/components/ui/socket-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";

interface Trip {
  id: string;
  departureTime: Date;
  arrivalTime: Date;
  availableSeats: number;
  route: {
    id: string; // Ajouté pour correspondre à TripWithDetails
    name: string;
    basePrice: number; // Changé de 'price' à 'basePrice'
    departureLocation: string; // Changé de 'departure: { name: string }' à 'departureLocation: string'
    arrivalLocation: string; // Changé de 'arrival: { name: string }' à 'arrivalLocation: string'
  };
  bus: {
    plateNumber: string;
    capacity: number;
  };
}

interface BookingFormProps {
  trip: Trip;
  onBookingComplete: (booking: any) => void;
}

export default function BookingForm({
  trip,
  onBookingComplete,
}: BookingFormProps) {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "MOBILE_MONEY"
  >("CASH");

  const handleBooking = async () => {
    if (!session?.user || !selectedSeat) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          seatNumber: selectedSeat,
          paymentMethod,
        }),
      });

      const booking = await response.json();

      if (response.ok) {
        // Emit socket event
        if (socket) {
          socket.emit("reservation-created", {
            ...booking,
            userName: session.user.name,
            companyId: booking.companyId,
          });
        }

        onBookingComplete(booking);
      }
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSeatNumbers = (capacity: number) => {
    return Array.from(
      { length: capacity },
      (_, i) => `${Math.floor(i / 4) + 1}${String.fromCharCode(65 + (i % 4))}`
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Réserver votre billet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trip Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Départ</p>
              <p className="font-medium">{trip.route.departureLocation}</p>{" "}
              {/* Mis à jour */}
              <p className="text-sm text-gray-600">
                {new Date(trip.departureTime).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Arrivée</p>
              <p className="font-medium">{trip.route.arrivalLocation}</p>{" "}
              {/* Mis à jour */}
              <p className="text-sm text-gray-600">
                {new Date(trip.arrivalTime).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {trip.availableSeats} places disponibles
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {trip.bus.plateNumber}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {trip.route.basePrice.toLocaleString()} FCFA {/* Mis à jour */}
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div>
          <Label className="text-base font-medium">Choisir votre siège</Label>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {generateSeatNumbers(trip.bus.capacity)
              .slice(0, trip.availableSeats)
              .map((seatNumber) => (
                <Button
                  key={seatNumber}
                  variant={selectedSeat === seatNumber ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setSelectedSeat(seatNumber)}
                >
                  {seatNumber}
                </Button>
              ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <Label className="text-base font-medium">Mode de paiement</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Button
              variant={paymentMethod === "CASH" ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={() => setPaymentMethod("CASH")}
            >
              <CreditCard className="h-4 w-4" />
              Espèces à la gare
            </Button>
            <Button
              variant={paymentMethod === "CARD" ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={() => setPaymentMethod("CARD")}
            >
              <CreditCard className="h-4 w-4" />
              Carte bancaire
            </Button>
            <Button
              variant={paymentMethod === "MOBILE_MONEY" ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={() => setPaymentMethod("MOBILE_MONEY")}
            >
              <CreditCard className="h-4 w-4" />
              Mobile Money
            </Button>
          </div>
        </div>

        {/* Booking Summary */}
        {selectedSeat && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Résumé de la réservation</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Siège:</span>
                <span className="font-medium">{selectedSeat}</span>
              </div>
              <div className="flex justify-between">
                <span>Prix:</span>
                <span className="font-medium">
                  {trip.route.basePrice.toLocaleString()} FCFA{" "}
                  {/* Mis à jour */}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode de paiement:</span>
                <span className="font-medium">
                  {paymentMethod === "CASH"
                    ? "Espèces"
                    : paymentMethod === "CARD"
                    ? "Carte"
                    : "Mobile Money"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Book Button */}
        <Button
          className="w-full h-12 text-lg"
          onClick={handleBooking}
          disabled={!selectedSeat || isLoading}
        >
          {isLoading ? "Réservation en cours..." : "Confirmer la réservation"}
        </Button>
      </CardContent>
    </Card>
  );
}
