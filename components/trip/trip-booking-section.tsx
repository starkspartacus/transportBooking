"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import BookingForm from "@/components/booking/booking-form";
import type { TripWithDetails } from "@/lib/types";
import { Confetti } from "@/components/ui/confetti";
import { useToast } from "@/hooks/use-toast";

interface TripBookingSectionProps {
  trip: TripWithDetails;
}

export function TripBookingSection({ trip }: TripBookingSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleBookingComplete = (booking: any) => {
    setShowConfetti(true);
    setIsOpen(false);
    toast({
      title: "Réservation confirmée !",
      description: `Votre réservation #${booking.reservation.reservationNumber} a été effectuée avec succès.`,
      variant: "success",
    });
    // Display the WhatsApp message as a separate toast
    toast({
      title: "Informations importantes",
      description: booking.whatsappMessage,
      duration: 30000, // Longer duration for important info
      variant: "info",
    });
    // Hide confetti after some time
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const Content = (
    <>
      <DialogHeader>
        <DialogTitle>Réserver votre voyage</DialogTitle>
        <DialogDescription>
          Sélectionnez vos sièges et fournissez les détails des passagers.
        </DialogDescription>
      </DialogHeader>
      <BookingForm trip={trip} onBookingComplete={handleBookingComplete} />
    </>
  );

  return (
    <>
      {showConfetti && <Confetti />}
      <Button onClick={() => setIsOpen(true)} className="mt-4 w-full md:w-auto">
        Réserver ce voyage
      </Button>

      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Réserver votre voyage</DrawerTitle>
              <DrawerDescription>
                Sélectionnez vos sièges et fournissez les détails des passagers.
              </DrawerDescription>
            </DrawerHeader>
            <BookingForm
              trip={trip}
              onBookingComplete={handleBookingComplete}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[700px]">{Content}</DialogContent>
        </Dialog>
      )}
    </>
  );
}
