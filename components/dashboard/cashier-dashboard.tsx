"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  type Trip,
  type Reservation,
  TripStatus,
  type Route,
  type Bus,
} from "@prisma/client";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useSocket } from "@/components/ui/socket-provider";

interface TripWithRelations extends Trip {
  route?: Route | null;
  bus?: Bus | null;
}

interface ReservationWithRelations extends Reservation {
  trip?: TripWithRelations | null;
}

interface CashierDashboardProps {
  initialStats: {
    totalSalesToday: number;
    totalTicketsSoldToday: number;
    totalReservationsToday: number;
    pendingPaymentsToday: number;
  };
}

export function CashierDashboard({ initialStats }: CashierDashboardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [stats, setStats] = useState(initialStats);
  const [trips, setTrips] = useState<TripWithRelations[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripWithRelations | null>(
    null
  );
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isSellingTicket, setIsSellingTicket] = useState(false);
  const [qrCodesData, setQrCodesData] = useState<
    { ticketId: string; qrCodeUrl: string; qrData: any }[] | null
  >(null); // Changed to array of QR codes
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const { socket } = useSocket();

  const companyId = session?.user?.companyId;

  const fetchTrips = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/cashier/trips?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les voyages.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur inattendue est survenue lors du chargement des voyages.",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/cashier/stats?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur inattendue est survenue lors du chargement des statistiques.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchStats();
  }, [companyId]);

  useEffect(() => {
    if (socket && companyId) {
      socket.emit("join-company", companyId);

      const handleNewReservation = (data: ReservationWithRelations) => {
        if (data.trip?.route) {
          toast({
            title: "Nouvelle réservation !",
            description: `Une nouvelle réservation a été enregistrée pour le voyage ${data.trip.route.departureLocation} - ${data.trip.route.arrivalLocation}.`,
            duration: 5000,
          });
          fetchStats();
        }
      };

      const handlePaymentReceived = (data: any) => {
        toast({
          title: "Paiement Reçu !",
          description: `Un paiement de ${data.amount} FCFA a été reçu pour la réservation ${data.reservationId}.`,
          duration: 5000,
        });
        fetchStats();
      };

      const handleNewTripScheduled = (newTrip: TripWithRelations) => {
        if (newTrip.route) {
          setTrips((prevTrips) =>
            [...prevTrips, newTrip].sort(
              (a, b) =>
                new Date(a.departureTime).getTime() -
                new Date(b.departureTime).getTime()
            )
          );
          toast({
            title: "Nouveau voyage programmé !",
            description: `Le voyage ${newTrip.route.departureLocation} - ${newTrip.route.arrivalLocation} a été ajouté.`,
            duration: 5000,
          });
        }
      };

      const handleTripStatusUpdated = (data: any) => {
        setTrips((prevTrips) =>
          prevTrips.map((trip) =>
            trip.id === data.tripId
              ? {
                  ...trip,
                  status: data.status,
                  isArchived: data.isArchived ?? trip.isArchived,
                }
              : trip
          )
        );
        toast({
          title: "Mise à jour du statut de voyage",
          description: `Le voyage ${data.route} est maintenant ${data.status}.`,
          duration: 3000,
        });
      };

      socket.on("new-reservation", handleNewReservation);
      socket.on("payment-received", handlePaymentReceived);
      socket.on("new-trip-scheduled", handleNewTripScheduled);
      socket.on("trip-status-updated", handleTripStatusUpdated);

      return () => {
        socket.off("new-reservation", handleNewReservation);
        socket.off("payment-received", handlePaymentReceived);
        socket.off("new-trip-scheduled", handleNewTripScheduled);
        socket.off("trip-status-updated", handleTripStatusUpdated);
      };
    }
  }, [socket, companyId, toast]);

  const handleSellTicket = async () => {
    if (!selectedTrip || !companyId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un voyage.",
        variant: "destructive",
      });
      return;
    }

    if (numberOfTickets <= 0) {
      toast({
        title: "Erreur",
        description: "Le nombre de billets doit être supérieur à zéro.",
        variant: "destructive",
      });
      return;
    }

    if (numberOfTickets > selectedTrip.availableSeats) {
      toast({
        title: "Erreur",
        description: `Seulement ${selectedTrip.availableSeats} places disponibles.`,
        variant: "destructive",
      });
      return;
    }

    setIsSellingTicket(true);
    try {
      const requestBody = {
        tripId: selectedTrip.id,
        customerName: clientName || "Client Anonyme",
        customerPhone: clientPhone || "0000000000", // Ensure a default phone if optional
        customerEmail: clientEmail || undefined,
        numberOfTickets: numberOfTickets, // Send numberOfTickets
        amountPaid:
          (selectedTrip.route?.basePrice || selectedTrip.basePrice) *
          numberOfTickets,
        paymentMethod: "CASH",
      };

      console.log("Sending request with body:", requestBody);

      const response = await fetch("/api/cashier/sell-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (response.ok) {
        toast({
          title: "Vente réussie",
          description: "Les billets ont été vendus avec succès.",
        });
        // Update available seats for the selected trip
        setSelectedTrip((prev) =>
          prev
            ? { ...prev, availableSeats: prev.availableSeats - numberOfTickets }
            : null
        );
        // Update trips list to reflect changes
        setTrips((prev) =>
          prev.map((trip) =>
            trip.id === selectedTrip.id
              ? {
                  ...trip,
                  availableSeats: trip.availableSeats - numberOfTickets,
                }
              : trip
          )
        );
        fetchStats(); // Refresh stats
        setIsQrModalOpen(true);
        setQrCodesData(data.qrCodesData || null); // Set array of QR codes
        setNumberOfTickets(1);
        setClientName("");
        setClientPhone("");
        setClientEmail("");
      } else {
        toast({
          title: "Erreur de vente",
          description:
            data.error || "Une erreur est survenue lors de la vente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error selling ticket:", error);
      toast({
        title: "Erreur inattendue",
        description: "Impossible de vendre le billet.",
        variant: "destructive",
      });
    } finally {
      setIsSellingTicket(false);
    }
  };

  const handleValidateQrCode = async () => {
    if (!qrCodeValue) {
      toast({
        title: "Erreur",
        description: "Veuillez scanner ou saisir le code QR.",
        variant: "destructive",
      });
      return;
    }
    setValidationResult("Validation en cours...");
    try {
      const response = await fetch("/api/tickets/validate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCodeData: qrCodeValue, companyId: companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult(`Validation réussie: ${data.message}`);
        toast({
          title: "Validation réussie",
          description: data.message,
        });
        // Optionally update trip/reservation status on successful validation
      } else {
        setValidationResult(`Validation échouée: ${data.error}`);
        toast({
          title: "Validation échouée",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating QR code:", error);
      setValidationResult("Erreur inattendue lors de la validation.");
      toast({
        title: "Erreur inattendue",
        description: "Impossible de valider le code QR.",
        variant: "destructive",
      });
    }
  };

  const renderTripCard = (trip: TripWithRelations) => {
    const isPastTrip = new Date(trip.arrivalTime) < new Date();
    const isArchived = trip.isArchived;

    if (isArchived && trip.status === TripStatus.COMPLETED) {
      return null;
    }

    return (
      <Card
        key={trip.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedTrip?.id === trip.id ? "border-2 border-blue-500" : ""
        } ${isPastTrip ? "opacity-70" : ""}`}
        onClick={() => setSelectedTrip(trip)}
      >
        <CardHeader>
          <CardTitle>
            {trip.route?.departureLocation} - {trip.route?.arrivalLocation}
          </CardTitle>
          <CardDescription>
            {format(
              parseISO(trip.departureTime.toString()),
              "dd MMM yyyy HH:mm",
              {
                locale: fr,
              }
            )}{" "}
            -{" "}
            {format(parseISO(trip.arrivalTime.toString()), "HH:mm", {
              locale: fr,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Bus: {trip.bus?.plateNumber} ({trip.bus?.model})
          </p>
          <p>
            Places disponibles: {trip.availableSeats} / {trip.bus?.capacity}
          </p>
          <p>
            Statut:{" "}
            <span
              className={`font-semibold ${
                trip.status === TripStatus.SCHEDULED
                  ? "text-blue-500"
                  : trip.status === TripStatus.BOARDING
                  ? "text-orange-500"
                  : trip.status === TripStatus.DELAYED
                  ? "text-yellow-500"
                  : trip.status === TripStatus.CANCELLED
                  ? "text-red-500"
                  : trip.status === TripStatus.COMPLETED
                  ? "text-green-500"
                  : trip.status === TripStatus.ARRIVED
                  ? "text-gray-500"
                  : "text-red-500"
              }`}
            >
              {trip.status.replace(/_/g, " ")}
            </span>
          </p>
          {isPastTrip && !isArchived && (
            <p className="text-sm text-red-500">Voyage passé (non archivé)</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm">
            Voir Détails
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (!session) {
    return <p>Chargement de la session...</p>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100/40 dark:bg-gray-800/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-bold">Tableau de bord du Caissier</h1>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ventes du Jour</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Revenus totaux générés aujourd&apos;hui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {(stats?.totalSalesToday ?? 0).toLocaleString()} FCFA
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Billets Vendus</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Nombre de billets vendus aujourd&apos;hui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {stats.totalTicketsSoldToday}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Réservations</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Nombre total de réservations aujourd&apos;hui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {stats.totalReservationsToday}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Paiements en attente</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Nombre de paiements en attente de confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {stats.pendingPaymentsToday}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="sell-ticket" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sell-ticket">Vendre un Billet</TabsTrigger>
              <TabsTrigger value="validate-qr">Valider QR Code</TabsTrigger>
            </TabsList>
            <TabsContent value="sell-ticket" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vendre un Billet</CardTitle>
                  <CardDescription>
                    Sélectionnez un voyage et vendez des billets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="search-trip">Rechercher un voyage</Label>
                    <Input
                      id="search-trip"
                      placeholder="Rechercher par destination, heure..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                    {trips.length > 0 ? (
                      trips.map(renderTripCard)
                    ) : (
                      <p className="col-span-full text-center text-gray-500">
                        Aucun voyage disponible pour le moment.
                      </p>
                    )}
                  </div>
                  {selectedTrip && (
                    <div className="border p-4 rounded-md space-y-4">
                      <h3 className="text-lg font-semibold">
                        Détails du voyage sélectionné
                      </h3>
                      <p>
                        Route: {selectedTrip.route?.departureLocation} {"->"}{" "}
                        {selectedTrip.route?.arrivalLocation}
                      </p>
                      <p>
                        Départ:{" "}
                        {format(
                          parseISO(selectedTrip.departureTime.toString()),
                          "dd MMM yyyy HH:mm",
                          { locale: fr }
                        )}
                      </p>
                      <p>
                        Bus: {selectedTrip.bus?.plateNumber} (
                        {selectedTrip.bus?.model})
                      </p>
                      <p>Places disponibles: {selectedTrip.availableSeats}</p>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {(
                            selectedTrip.route?.basePrice ||
                            selectedTrip.basePrice
                          ).toLocaleString()}{" "}
                          FCFA
                        </p>
                        <p className="text-sm text-gray-600">Prix du billet</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="num-tickets">Nombre de billets</Label>
                        <Input
                          id="num-tickets"
                          type="number"
                          min="1"
                          max={selectedTrip.availableSeats}
                          value={numberOfTickets}
                          onChange={(e) =>
                            setNumberOfTickets(Number.parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="client-name">
                          Nom du client (Optionnel)
                        </Label>
                        <Input
                          id="client-name"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="client-phone">
                          Téléphone du client (Optionnel)
                        </Label>
                        <Input
                          id="client-phone"
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="client-email">
                          Email du client (Optionnel)
                        </Label>
                        <Input
                          id="client-email"
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleSellTicket}
                        disabled={
                          isSellingTicket || selectedTrip.availableSeats === 0
                        }
                      >
                        {isSellingTicket
                          ? "Vente en cours..."
                          : "Vendre Billet(s)"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validate-qr" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Valider Billet QR Code</CardTitle>
                  <CardDescription>
                    Scanner ou entrer le code QR pour valider un billet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="qr-code-input">Code QR</Label>
                    <Input
                      id="qr-code-input"
                      placeholder="Saisir le code QR du billet"
                      value={qrCodeValue}
                      onChange={(e) => {
                        setQrCodeValue(e.target.value);
                        setValidationResult(null); // Clear previous result on input change
                      }}
                    />
                  </div>
                  <Button onClick={handleValidateQrCode}>
                    <QrCode className="mr-2 h-4 w-4" /> Valider Billet
                  </Button>
                  {validationResult && (
                    <div className="mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-700">
                      <p className="font-medium">Résultat de la validation:</p>
                      <p>{validationResult}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Ventes Journalières</CardTitle>
              <CardDescription>
                Répartition des ventes par route ou destination.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for Daily Sales Chart */}
              <div className="text-center text-gray-500">
                Graphique des ventes à venir...
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>
                Liste des 10 dernières transactions effectuées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for Recent Transactions */}
              <div className="text-center text-gray-500">
                Chargement de l&apos;historique...
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Billet(s) Généré(s)</DialogTitle>
            <CardDescription>
              Veuillez présenter ce code QR au client.
            </CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 place-items-center">
            {qrCodesData && qrCodesData.length > 0 ? (
              qrCodesData.map((qr, index) => (
                <div
                  key={qr.ticketId}
                  className="flex flex-col items-center gap-2"
                >
                  <p className="text-sm font-semibold">
                    Billet {index + 1} (Siège: {qr.qrData.seatNumber})
                  </p>
                  <QRCodeSVG
                    value={JSON.stringify(qr.qrData)}
                    size={200}
                    level="H"
                  />
                  <a
                    href={qr.qrCodeUrl}
                    download={`ticket-${qr.qrData.ticketNumber}-qr-code.png`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Télécharger QR Code {index + 1}
                  </a>
                </div>
              ))
            ) : (
              <p>Impossible de générer les QR codes.</p>
            )}
            <p className="text-sm text-center text-gray-500">
              Scannez ce code pour valider le billet.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQrModalOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
