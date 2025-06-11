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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  CreditCard,
  QrCode,
  Clock,
  Printer,
  Banknote,
  Smartphone,
  Bus,
  Shield,
  CheckCircle,
  Plus,
  Eye,
  DollarSign,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Trip {
  id: string;
  departureTime: string;
  status: string;
  route: {
    departureLocation: string;
    arrivalLocation: string;
    price: number;
  };
  bus: {
    plateNumber: string;
    capacity: number;
  };
  reservations: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    seatNumbers: number[];
    user: { name: string; phone: string };
    payments: Array<{ status: string }>;
  }>;
  stats: {
    totalSeats: number;
    reservedSeats: number;
    availableSeats: number;
    paidReservations: number;
    pendingReservations: number;
    revenue: number;
    occupancyRate: number;
  };
}

interface Reservation {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  seatNumbers: number[];
  user: {
    name: string;
    phone: string;
  };
  trip: {
    route: {
      departureLocation: string;
      arrivalLocation: string;
      departureCountry: string;
      arrivalCountry: string;
    };
    departureTime: string;
  };
  payments: Array<{ status: string }>;
}

export default function CashierDashboard() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "MOBILE_MONEY"
  >("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    cashSales: 0,
    cardSales: 0,
    mobileSales: 0,
  });

  // Direct sale form state
  const [saleForm, setSaleForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    selectedSeat: "",
    amountPaid: 0,
  });

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchTrips();
      fetchPendingReservations();
      fetchDailyStats();
    }
  }, [session]);

  useEffect(() => {
    if (socket && session?.user?.companyId) {
      socket.emit("join-company", session.user.companyId);

      socket.on("new-reservation", (data) => {
        setReservations((prev) => [data, ...prev]);
        fetchTrips(); // Refresh trips to update stats
      });

      socket.on("trip-updated", () => {
        fetchTrips();
      });

      return () => {
        socket.off("new-reservation");
        socket.off("trip-updated");
      };
    }
  }, [socket, session]);

  const fetchTrips = async () => {
    try {
      const response = await fetch(
        `/api/cashier/trips?companyId=${session?.user?.companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Erreur lors du chargement des voyages");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingReservations = async () => {
    try {
      const response = await fetch(
        `/api/reservations?status=PENDING&companyId=${session?.user?.companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(
        `/api/cashier/stats?companyId=${session?.user?.companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDailyStats(data);
      }
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
      if (response.ok) {
        const data = await response.json();
        setSelectedReservation(data);
      } else {
        toast.error("Réservation non trouvée");
      }
    } catch (error) {
      console.error("Error searching reservation:", error);
      toast.error("Erreur lors de la recherche");
    }
  };

  const validateReservation = async (reservationId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/cashier/validate-reservation", {
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
        toast.success("Réservation validée et encaissée avec succès!");

        // Update local state
        setReservations((prev) => prev.filter((r) => r.id !== reservationId));
        setSelectedReservation(null);
        fetchDailyStats();
        fetchTrips();

        // Emit socket event
        if (socket) {
          socket.emit("reservation-validated", {
            ...result,
            companyId: session?.user?.companyId,
          });
        }
      } else {
        toast.error(result.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Erreur lors de la validation");
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectTicket = async () => {
    if (
      !selectedTrip ||
      !saleForm.customerName ||
      !saleForm.customerPhone ||
      !saleForm.selectedSeat
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/cashier/sell-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          customerName: saleForm.customerName,
          customerPhone: saleForm.customerPhone,
          customerEmail: saleForm.customerEmail,
          seatNumber: saleForm.selectedSeat,
          paymentMethod,
          amountPaid: saleForm.amountPaid || selectedTrip.route.price,
          cashierId: session?.user?.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Billet vendu avec succès!");

        // Reset form
        setSaleForm({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          selectedSeat: "",
          amountPaid: 0,
        });
        setSelectedTrip(null);

        // Refresh data
        fetchTrips();
        fetchDailyStats();

        // Emit socket event
        if (socket) {
          socket.emit("ticket-sold", {
            ...result,
            companyId: session?.user?.companyId,
          });
        }
      } else {
        toast.error(result.error || "Erreur lors de la vente");
      }
    } catch (error) {
      console.error("Sale error:", error);
      toast.error("Erreur lors de la vente");
    } finally {
      setIsProcessing(false);
    }
  };

  const printTicket = (reservation: Reservation) => {
    const printContent = `
    BILLET DE TRANSPORT
    ==================
    Code: ${reservation.code}
    Passager: ${reservation.user.name}
    De: ${reservation.trip.route.departureLocation}
    À: ${reservation.trip.route.arrivalLocation}
    Départ: ${new Date(reservation.trip.departureTime).toLocaleString()}
    Siège(s): ${reservation.seatNumbers.join(", ")}
    Montant: ${reservation.totalAmount} FCFA
    ==================
    Caissier: ${session?.user?.name}
    Date: ${new Date().toLocaleString()}
  `;

    console.log("Impression:", printContent);
    toast.success("Billet imprimé!");
  };

  const getAvailableSeats = (trip: Trip) => {
    const occupiedSeats = trip.reservations.flatMap((r) => r.seatNumbers);
    const allSeats = Array.from({ length: trip.bus.capacity }, (_, i) => i + 1);
    return allSeats.filter((seatNumber) => !occupiedSeats.includes(seatNumber));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Caissier Avancé
              </h1>
              <p className="text-gray-600">Bienvenue, {session?.user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">En service</span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Sécurisé
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
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
                    {dailyStats.totalAmount.toLocaleString()} FCFA
                  </p>
                </div>
                <DollarSign className="h-8 w-8 opacity-80" />
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
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trips">Voyages du Jour</TabsTrigger>
            <TabsTrigger value="search">Rechercher</TabsTrigger>
            <TabsTrigger value="pending">En Attente</TabsTrigger>
            <TabsTrigger value="sell">Vente Directe</TabsTrigger>
            <TabsTrigger value="validate">Valider QR</TabsTrigger>
          </TabsList>

          {/* Real-time Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Voyages Programmés ({trips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">
                              {trip.route.departureLocation} →{" "}
                              {trip.route.arrivalLocation}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Bus: {trip.bus.plateNumber} • Départ:{" "}
                              {new Date(trip.departureTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              trip.status === "SCHEDULED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {trip.status}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails du Voyage</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">
                                      Informations
                                    </h4>
                                    <p>
                                      <strong>Route:</strong>{" "}
                                      {trip.route.departureLocation} →{" "}
                                      {trip.route.arrivalLocation}
                                    </p>
                                    <p>
                                      <strong>Prix:</strong> {trip.route.price}{" "}
                                      FCFA
                                    </p>
                                    <p>
                                      <strong>Bus:</strong>{" "}
                                      {trip.bus.plateNumber}
                                    </p>
                                    <p>
                                      <strong>Départ:</strong>{" "}
                                      {new Date(
                                        trip.departureTime
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">
                                      Statistiques
                                    </h4>
                                    <p>
                                      <strong>Sièges totaux:</strong>{" "}
                                      {trip.stats.totalSeats}
                                    </p>
                                    <p>
                                      <strong>Réservés:</strong>{" "}
                                      {trip.stats.reservedSeats}
                                    </p>
                                    <p>
                                      <strong>Disponibles:</strong>{" "}
                                      {trip.stats.availableSeats}
                                    </p>
                                    <p>
                                      <strong>Taux d'occupation:</strong>{" "}
                                      {trip.stats.occupancyRate}%
                                    </p>
                                    <p>
                                      <strong>Revenus:</strong>{" "}
                                      {trip.stats.revenue} FCFA
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Réservations
                                  </h4>
                                  <div className="max-h-40 overflow-y-auto space-y-2">
                                    {trip.reservations.map((reservation) => (
                                      <div
                                        key={reservation.id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                      >
                                        <span>
                                          {reservation.user.name} - Siège{" "}
                                          {reservation.seatNumbers.join(", ")}
                                        </span>
                                        <Badge
                                          variant={
                                            reservation.payments.some(
                                              (p) => p.status === "COMPLETED"
                                            )
                                              ? "default"
                                              : "destructive"
                                          }
                                        >
                                          {reservation.payments.some(
                                            (p) => p.status === "COMPLETED"
                                          )
                                            ? "Payé"
                                            : "En attente"}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-blue-600 font-medium">
                            {trip.stats.totalSeats}
                          </p>
                          <p className="text-gray-600">Total sièges</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-green-600 font-medium">
                            {trip.stats.availableSeats}
                          </p>
                          <p className="text-gray-600">Disponibles</p>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <p className="text-orange-600 font-medium">
                            {trip.stats.pendingReservations}
                          </p>
                          <p className="text-gray-600">En attente</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-purple-600 font-medium">
                            {trip.stats.occupancyRate}%
                          </p>
                          <p className="text-gray-600">Occupation</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-gray-800 font-medium">
                            {trip.stats.revenue.toLocaleString()}
                          </p>
                          <p className="text-gray-600">Revenus FCFA</p>
                        </div>
                      </div>

                      {trip.stats.availableSeats > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedTrip(trip)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Vendre un billet
                        </Button>
                      )}
                    </div>
                  ))}

                  {trips.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun voyage programmé aujourd'hui</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                          {selectedReservation.trip.route.departureLocation}
                        </p>
                        <p>
                          <strong>À:</strong>{" "}
                          {selectedReservation.trip.route.arrivalLocation}
                        </p>
                        <p>
                          <strong>Départ:</strong>{" "}
                          {new Date(
                            selectedReservation.trip.departureTime
                          ).toLocaleString()}
                        </p>
                        <p>
                          <strong>Siège:</strong>{" "}
                          {selectedReservation.seatNumbers.join(", ")}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                disabled={isProcessing}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {isProcessing
                                  ? "Traitement..."
                                  : "Valider et Encaisser"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmer l'encaissement
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Vous êtes sur le point de valider cette
                                  réservation et d'encaisser{" "}
                                  {selectedReservation.totalAmount} FCFA. Cette
                                  action est irréversible et sera enregistrée
                                  dans le système de sécurité.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    validateReservation(selectedReservation.id)
                                  }
                                >
                                  Confirmer l'encaissement
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                            Code: {reservation.code}
                          </p>
                        </div>
                        <Badge variant="destructive">En attente</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Trajet</p>
                          <p>
                            {reservation.trip.route.departureLocation} →{" "}
                            {reservation.trip.route.arrivalLocation}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Siège</p>
                          <p>{reservation.seatNumbers.join(", ")}</p>
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

          {/* Direct Sale Tab */}
          <TabsContent value="sell">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Vente Directe de Billets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTrip ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Voyage sélectionné</h3>
                      <p>
                        {selectedTrip.route.departureLocation} →{" "}
                        {selectedTrip.route.arrivalLocation}
                      </p>
                      <p>
                        Départ:{" "}
                        {new Date(selectedTrip.departureTime).toLocaleString()}
                      </p>
                      <p>Prix: {selectedTrip.route.price} FCFA</p>
                      <p>
                        Sièges disponibles: {selectedTrip.stats.availableSeats}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Nom du client *</Label>
                        <Input
                          id="customerName"
                          value={saleForm.customerName}
                          onChange={(e) =>
                            setSaleForm((prev) => ({
                              ...prev,
                              customerName: e.target.value,
                            }))
                          }
                          placeholder="Nom complet"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Téléphone *</Label>
                        <Input
                          id="customerPhone"
                          value={saleForm.customerPhone}
                          onChange={(e) =>
                            setSaleForm((prev) => ({
                              ...prev,
                              customerPhone: e.target.value,
                            }))
                          }
                          placeholder="+225 XX XX XX XX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerEmail">Email (optionnel)</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={saleForm.customerEmail}
                          onChange={(e) =>
                            setSaleForm((prev) => ({
                              ...prev,
                              customerEmail: e.target.value,
                            }))
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label>Siège *</Label>
                        <Select
                          value={saleForm.selectedSeat}
                          onValueChange={(value) =>
                            setSaleForm((prev) => ({
                              ...prev,
                              selectedSeat: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un siège" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSeats(selectedTrip).map(
                              (seatNumber) => (
                                <SelectItem
                                  key={seatNumber}
                                  value={seatNumber.toString()}
                                >
                                  Siège {seatNumber}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
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
                            <SelectItem value="CARD">Carte bancaire</SelectItem>
                            <SelectItem value="MOBILE_MONEY">
                              Mobile Money
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amountPaid">Montant payé (FCFA)</Label>
                        <Input
                          id="amountPaid"
                          type="number"
                          value={
                            saleForm.amountPaid || selectedTrip.route.price
                          }
                          onChange={(e) =>
                            setSaleForm((prev) => ({
                              ...prev,
                              amountPaid: Number(e.target.value),
                            }))
                          }
                          min={selectedTrip.route.price}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={isProcessing} className="flex-1">
                            <DollarSign className="h-4 w-4 mr-2" />
                            {isProcessing
                              ? "Traitement..."
                              : "Vendre le billet"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmer la vente
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Vous êtes sur le point de vendre un billet à{" "}
                              {saleForm.customerName} pour le montant de{" "}
                              {saleForm.amountPaid || selectedTrip.route.price}{" "}
                              FCFA. Cette vente sera enregistrée dans le système
                              de sécurité.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={sellDirectTicket}>
                              Confirmer la vente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTrip(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      Sélectionnez un voyage dans l'onglet "Voyages du Jour"
                      pour commencer la vente
                    </p>
                  </div>
                )}
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
                  <Button>
                    <QrCode className="h-4 w-4 mr-2" />
                    Activer le scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Alert */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Système de Sécurité Actif
                </p>
                <p className="text-sm text-orange-700">
                  Toutes les transactions sont enregistrées et auditées. Les
                  activités suspectes sont automatiquement signalées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
