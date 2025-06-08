"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/ui/socket-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CreditCard,
  QrCode,
  Clock,
  Printer,
  Banknote,
  Smartphone,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Reservation {
  id: string;
  reservationCode: string;
  status: string;
  totalAmount: number;
  user: {
    name: string;
    phone: string;
  };
  trip: {
    route: {
      departure: { name: string };
      arrival: { name: string };
    };
    departureTime: string;
  };
  seat: {
    number: string;
  };
}

export default function CashierDashboard() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "MOBILE_MONEY"
  >("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    cashSales: 0,
    cardSales: 0,
    mobileSales: 0,
  });

  useEffect(() => {
    fetchPendingReservations();
    fetchDailyStats();
  }, []);

  useEffect(() => {
    if (socket && session?.user?.companyId) {
      socket.emit("join-company", session.user.companyId);

      socket.on("new-reservation", (data) => {
        setReservations((prev) => [data, ...prev]);
      });

      return () => {
        socket.off("new-reservation");
      };
    }
  }, [socket, session]);

  const fetchPendingReservations = async () => {
    try {
      const response = await fetch(
        `/api/reservations?status=PENDING&companyId=${session?.user?.companyId}`
      );
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(
        `/api/cashier/stats?companyId=${session?.user?.companyId}`
      );
      const data = await response.json();
      setDailyStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const searchReservation = async () => {
    if (!searchCode) return;

    try {
      const response = await fetch(
        `/api/reservations/search?code=${searchCode}`
      );
      const data = await response.json();

      if (data) {
        setSelectedReservation(data);
      } else {
        alert("Réservation non trouvée");
      }
    } catch (error) {
      console.error("Error searching reservation:", error);
    }
  };

  const processPayment = async (reservationId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/cashier/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          paymentMethod,
          cashierId: session?.user?.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Emit socket event
        if (socket) {
          socket.emit("payment-completed", {
            ...result,
            companyId: session?.user?.companyId,
          });
        }

        // Update local state
        setReservations((prev) => prev.filter((r) => r.id !== reservationId));
        setSelectedReservation(null);
        fetchDailyStats();

        alert("Paiement traité avec succès!");
      } else {
        alert(result.error || "Erreur lors du traitement");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Erreur lors du traitement du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  const printTicket = (reservation: Reservation) => {
    // Simulation d'impression
    const printContent = `
      BILLET DE TRANSPORT
      ==================
      Code: ${reservation.reservationCode}
      Passager: ${reservation.user.name}
      De: ${reservation.trip.route.departure.name}
      À: ${reservation.trip.route.arrival.name}
      Départ: ${new Date(reservation.trip.departureTime).toLocaleString()}
      Siège: ${reservation.seat.number}
      Montant: ${reservation.totalAmount} FCFA
      ==================
    `;

    console.log("Impression:", printContent);
    alert("Billet imprimé!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Caissier
              </h1>
              <p className="text-gray-600">Bienvenue, {session?.user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">En service</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Ventes du jour</p>
                  <p className="text-2xl font-bold">{dailyStats.totalSales}</p>
                </div>
                <CreditCard className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Montant total</p>
                  <p className="text-2xl font-bold">
                    {dailyStats.totalAmount !== undefined
                      ? dailyStats.totalAmount.toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <Banknote className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Espèces</p>
                  <p className="text-2xl font-bold">{dailyStats.cashSales}</p>
                </div>
                <Banknote className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Cartes</p>
                  <p className="text-2xl font-bold">{dailyStats.cardSales}</p>
                </div>
                <CreditCard className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Mobile Money</p>
                  <p className="text-2xl font-bold">{dailyStats.mobileSales}</p>
                </div>
                <Smartphone className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Rechercher Réservation</TabsTrigger>
            <TabsTrigger value="pending">Réservations en Attente</TabsTrigger>
            <TabsTrigger value="validate">Valider QR Code</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Rechercher une réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="searchCode">Code de réservation</Label>
                    <Input
                      id="searchCode"
                      placeholder="Entrez le code de réservation"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && searchReservation()
                      }
                    />
                  </div>
                  <Button onClick={searchReservation} className="mt-6">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                {selectedReservation && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">
                          Informations du voyage
                        </h3>
                        <p>
                          <strong>De:</strong>{" "}
                          {selectedReservation.trip.route.departure.name}
                        </p>
                        <p>
                          <strong>À:</strong>{" "}
                          {selectedReservation.trip.route.arrival.name}
                        </p>
                        <p>
                          <strong>Départ:</strong>{" "}
                          {new Date(
                            selectedReservation.trip.departureTime
                          ).toLocaleString()}
                        </p>
                        <p>
                          <strong>Siège:</strong>{" "}
                          {selectedReservation.seat.number}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">
                          Informations du passager
                        </h3>
                        <p>
                          <strong>Nom:</strong> {selectedReservation.user.name}
                        </p>
                        <p>
                          <strong>Téléphone:</strong>{" "}
                          {selectedReservation.user.phone}
                        </p>
                        <p>
                          <strong>Montant:</strong>{" "}
                          {selectedReservation.totalAmount} FCFA
                        </p>
                        <Badge
                          variant={
                            selectedReservation.status === "PENDING"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {selectedReservation.status}
                        </Badge>
                      </div>
                    </div>

                    {selectedReservation.status === "PENDING" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Mode de paiement</Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={(value: any) =>
                              setPaymentMethod(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">Espèces</SelectItem>
                              <SelectItem value="CARD">
                                Carte bancaire
                              </SelectItem>
                              <SelectItem value="MOBILE_MONEY">
                                Mobile Money
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            onClick={() =>
                              processPayment(selectedReservation.id)
                            }
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            {isProcessing
                              ? "Traitement..."
                              : "Confirmer le paiement"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => printTicket(selectedReservation)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Reservations Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Réservations en attente ({reservations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{reservation.user.name}</p>
                          <p className="text-sm text-gray-600">
                            Code: {reservation.reservationCode}
                          </p>
                        </div>
                        <Badge variant="destructive">En attente</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Trajet</p>
                          <p>
                            {reservation.trip.route.departure.name} →{" "}
                            {reservation.trip.route.arrival.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Siège</p>
                          <p>{reservation.seat.number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Montant</p>
                          <p className="font-medium">
                            {reservation.totalAmount} FCFA
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedReservation(reservation)}
                        >
                          Traiter le paiement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printTicket(reservation)}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Imprimer
                        </Button>
                      </div>
                    </div>
                  ))}

                  {reservations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune réservation en attente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code Validation Tab */}
          <TabsContent value="validate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Valider un QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Scanner le QR Code du billet
                  </p>
                  <Button>Activer le scanner</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
