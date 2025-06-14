"use client";

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
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { CheckCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QrCodeDisplayModalProps {
  tickets: Array<{
    id: string;
    ticketNumber: string;
    qrCode: string; // This should be the data URL
    passengerName: string;
    seatNumber: number;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeDisplayModal({
  tickets,
  isOpen,
  onClose,
}: QrCodeDisplayModalProps) {
  const isMobile = useIsMobile();

  const handleDownloadAll = () => {
    tickets.forEach((ticket) => {
      if (ticket.qrCode) {
        const link = document.createElement("a");
        link.href = ticket.qrCode;
        link.download = `ticket_${
          ticket.ticketNumber
        }_${ticket.passengerName.replace(/\s/g, "_")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const Content = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" /> Vos Billets et QR
          Codes
        </DialogTitle>
        <DialogDescription>
          Voici les QR codes pour vos billets. Scannez-les à la gare pour
          valider votre voyage.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="flex flex-col items-center p-4 shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-center">
                Billet #{ticket.ticketNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {ticket.passengerName} - Siège {ticket.seatNumber}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-0">
              {ticket.qrCode ? (
                <div className="relative w-40 h-40 mb-4">
                  <Image
                    src={ticket.qrCode || "/placeholder.svg"}
                    alt={`QR Code for Ticket ${ticket.ticketNumber}`}
                    fill
                    sizes="160px"
                    className="object-contain animate-fade-in"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center text-sm text-gray-500 mb-4">
                  QR Code non disponible
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (ticket.qrCode) {
                    const link = document.createElement("a");
                    link.href = ticket.qrCode;
                    link.download = `ticket_${
                      ticket.ticketNumber
                    }_${ticket.passengerName.replace(/\s/g, "_")}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!ticket.qrCode}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        {tickets.length > 1 && (
          <Button variant="secondary" onClick={handleDownloadAll}>
            <Download className="h-4 w-4 mr-2" /> Télécharger tout
          </Button>
        )}
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[95vh] overflow-hidden flex flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" /> Vos Billets et
              QR Codes
            </DrawerTitle>
            <DrawerDescription>
              Voici les QR codes pour vos billets. Scannez-les à la gare pour
              valider votre voyage.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-grow overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="flex flex-col items-center p-4 shadow-md"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-center">
                      Billet #{ticket.ticketNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      {ticket.passengerName} - Siège {ticket.seatNumber}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-0">
                    {ticket.qrCode ? (
                      <div className="relative w-40 h-40 mb-4">
                        <Image
                          src={ticket.qrCode || "/placeholder.svg"}
                          alt={`QR Code for Ticket ${ticket.ticketNumber}`}
                          fill
                          sizes="160px"
                          className="object-contain animate-fade-in"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 bg-gray-200 flex items-center justify-center text-sm text-gray-500 mb-4">
                        QR Code non disponible
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (ticket.qrCode) {
                          const link = document.createElement("a");
                          link.href = ticket.qrCode;
                          link.download = `ticket_${
                            ticket.ticketNumber
                          }_${ticket.passengerName.replace(/\s/g, "_")}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      disabled={!ticket.qrCode}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" /> Télécharger
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            {tickets.length > 1 && (
              <Button variant="secondary" onClick={handleDownloadAll}>
                <Download className="h-4 w-4 mr-2" /> Télécharger tout
              </Button>
            )}
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        {Content}
      </DialogContent>
    </Dialog>
  );
}
