"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bus, Calendar, Clock, MapPin, Ticket, Users } from "lucide-react";
import { Reservation } from "@/lib/types";
import { QrCodeDisplayModal } from "@/components/booking/qr-code-display-modal";

interface ReservationWithDetails extends Omit<Reservation, "trip"> {
  trip: {
    id: string;
    status: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
    departureTime: Date;
    arrivalTime: Date;
    basePrice: number;
    currentPrice: number;
    route: {
      departureLocation: string;
      arrivalLocation: string;
    };
    bus: {
      plateNumber: string;
    };
  };
}

interface ReservationCardProps {
  reservation: ReservationWithDetails;
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);

  const departureTime = new Date(
    reservation?.trip?.departureTime || new Date()
  );
  const arrivalTime = new Date(reservation?.trip?.arrivalTime || new Date());

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "default";
      case "PENDING":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      case "CHECKED_IN":
        return "success";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>Réservation #{reservation.reservationNumber}</span>
          <Badge variant={getStatusBadgeVariant(reservation.status)}>
            {reservation.status}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            <MapPin className="inline-block h-4 w-4 mr-1" />
            {reservation.trip?.route?.departureLocation || "N/A"} →{" "}
            {reservation.trip?.route?.arrivalLocation || "N/A"}
          </span>
          <Badge
            variant={getPaymentStatusBadgeVariant(reservation.paymentStatus)}
          >
            {reservation.paymentStatus}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-gray-700">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>
            Départ:{" "}
            {format(departureTime, "dd MMMM yyyy HH:mm", { locale: fr })}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span>
            Arrivée: {format(arrivalTime, "dd MMMM yyyy HH:mm", { locale: fr })}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Bus className="h-4 w-4 mr-2 text-gray-500" />
          <span>Bus: {reservation.trip?.bus?.plateNumber || "N/A"}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Users className="h-4 w-4 mr-2 text-gray-500" />
          <span>Passagers: {reservation.passengerCount}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Ticket className="h-4 w-4 mr-2 text-gray-500" />
          <span>Siège(s): {reservation.seatNumbers.join(", ")}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center text-lg font-semibold text-primary">
          <span>Total:</span>
          <span>{reservation.totalAmount.toLocaleString()} FCFA</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("Voir les détails de la réservation")}
        >
          Voir Détails
        </Button>
        {reservation.tickets && reservation.tickets.length > 0 && (
          <Button size="sm" onClick={() => setShowQrModal(true)}>
            Voir QR Code(s)
          </Button>
        )}
      </CardFooter>

      {showQrModal && (
        <QrCodeDisplayModal
          tickets={
            reservation.tickets
              ?.filter((ticket) => ticket.qrCode)
              .map((ticket) => ({
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                qrCode: ticket.qrCode!,
                passengerName: ticket.passengerName,
                seatNumber: ticket.seatNumber,
              })) || []
          }
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </Card>
  );
}
