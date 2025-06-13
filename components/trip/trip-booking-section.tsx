"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BookingForm from "@/components/booking/booking-form";
import type { TripWithDetails } from "@/lib/types";

interface TripBookingSectionProps {
  trip: TripWithDetails;
}

export function TripBookingSection({ trip }: TripBookingSectionProps) {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleBookingComplete = (booking: any) => {
    setIsBookingDialogOpen(false);
    toast({
      title: "Réservation réussie!",
      description: `Votre réservation ${booking.reservationCode} a été créée.`,
      variant: "success",
    });
    // Vous pouvez ajouter ici une logique de redirection ou de rafraîchissement si nécessaire
  };

  return (
    <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 text-lg">Réserver ce voyage</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Réserver votre billet</DialogTitle>
        </DialogHeader>
        <BookingForm trip={trip} onBookingComplete={handleBookingComplete} />
      </DialogContent>
    </Dialog>
  );
}
