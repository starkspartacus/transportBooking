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
import { useRouter } from "next/navigation"; // Import useRouter
import { QrCodeDisplayModal } from "@/components/booking/qr-code-display-modal"; // Import QR code modal

interface TripBookingSectionProps {
  trip: TripWithDetails;
}

export function TripBookingSection({ trip }: TripBookingSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [bookedTickets, setBookedTickets] = useState<any[]>([]); // To store tickets for QR display
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const handleBookingComplete = (booking: any) => {
    setIsOpen(false); // Close the booking form modal

    if (booking.paymentRequired) {
      // For Mobile Money, redirect to CinetPay
      if (booking.paymentUrl) {
        toast({
          title: "Paiement requis",
          description: "Vous allez être redirigé vers la page de paiement.",
          variant: "info",
        });
        window.location.href = booking.paymentUrl;
      } else {
        toast({
          title: "Réservation en attente de paiement",
          description:
            "Votre réservation est en attente de paiement. Veuillez suivre les instructions.",
          variant: "info",
        });
      }
    } else {
      // For CASH payments, or after CinetPay callback confirms, tickets are ready
      setShowConfetti(true);
      setBookedTickets(booking.tickets || []); // Store tickets for QR display
      setShowQrModal(true); // Show QR code modal

      toast({
        title: "Réservation confirmée !",
        description: `Votre réservation #${booking.reservation.reservationNumber} a été effectuée avec succès.`,
        variant: "success",
      });

      // Display the WhatsApp message as a separate toast
      if (booking.whatsappMessage) {
        toast({
          title: "Informations importantes",
          description: booking.whatsappMessage, // Use the decoded message
          duration: 10000, // Longer duration for important info
          variant: "info",
          action: booking.whatsappLink ? (
            <a
              href={booking.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">Ouvrir WhatsApp</Button>
            </a>
          ) : undefined,
        });
      }

      // Hide confetti after some time
      setTimeout(() => setShowConfetti(false), 5000);
    }

    // Re-fetch trip data to update available seats for the current client
    router.refresh();
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
          <DrawerContent className="max-h-[90vh] overflow-y-auto">
            {" "}
            {/* Added max-h and overflow */}
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            {" "}
            {/* Added max-h and overflow */}
            {Content}
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Display Modal */}
      {showQrModal && bookedTickets.length > 0 && (
        <QrCodeDisplayModal
          tickets={bookedTickets}
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </>
  );
}
