"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/ui/socket-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Bus,
  Route,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardStats {
  totalTrips: number;
  activeTrips: number;
  totalRevenue: number;
  totalReservations: number;
  availableBuses: number;
  totalRoutes: number;
  todayDepartures: number;
  pendingReservations: number;
}

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  availableSeats: number;
  route: {
    name: string;
    departure: { name: string };
    arrival: { name: string };
  };
  bus: {
    plateNumber: string;
    model: string;
  };
  _count: {
    reservations: number;
  };
}

interface Reservation {
  id: string;
  reservationCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: {
    name: string;
    phone: string;
  };
  trip: {
    departureTime: string;
    route: {
      departure: { name: string };
      arrival: { name: string };
    };
  };
}

export default function GestionnaireDashboard() {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    activeTrips: 0,
    totalRevenue: 0,
    totalReservations: 0,
    availableBuses: 0,
    totalRoutes: 0,
    todayDepartures: 0,
    pendingReservations: 0,
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchDashboardData();
    }
  }, [session]);

  useEffect(() => {
    if (socket && session?.user?.companyId) {
      socket.emit("join-company", session.user.companyId);

      socket.on("new-reservation", () => {
        fetchDashboardData();
      });

      socket.on("payment-received", () => {
        fetchDashboardData();
      });

      socket.on("trip-status-updated", () => {
        fetchDashboardData();
      });

      return () => {
        socket.off("new-reservation");
        socket.off("payment-received");
        socket.off("trip-status-updated");
      };
    }
  }, [socket, session]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `/api/gestionnaire/stats?companyId=${session?.user?.companyId}`
      );
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent trips
      const tripsResponse = await fetch(
        `/api/gestionnaire/trips?companyId=${session?.user?.companyId}&limit=5`
      );
      const tripsData = await tripsResponse.json();
      setRecentTrips(tripsData);

      // Fetch pending reservations
      const reservationsResponse = await fetch(
        `/api/gestionnaire/reservations?companyId=${session?.user?.companyId}&status=PENDING&limit=10`
      );
      const reservationsData = await reservationsResponse.json();
      setPendingReservations(reservationsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripStatus = async (tripId: string, status: string) => {
    try {
      const response = await fetch(`/api/company/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDashboardData();

        // Emit socket event
        if (socket) {
          socket.emit("trip-status-updated", {
            tripId,
            status,
            companyId: session?.user?.companyId,
          });
        }
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Programmé
          </Badge>
        );
      case "BOARDING":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Embarquement
          </Badge>
        );
      case "DEPARTED":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            En route
          </Badge>
        );
      case "ARRIVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Arrivé
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Annulé
          </Badge>
        );
      case "DELAYED":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Retardé
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            En attente
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Confirmée
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Annulée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
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
                Dashboard Gestionnaire
              </h1>
              <p className="text-gray-600">Bienvenue, {session?.user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Voyages Actifs</p>
                  <p className="text-3xl font-bold">{stats.activeTrips}</p>
                  <p className="text-xs opacity-70">
                    sur {stats.totalTrips} total
                  </p>
                </div>
                <Bus className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Revenus du Jour</p>
                  <p className="text-3xl font-bold">
                    {stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-70">FCFA</p>
                </div>
                <DollarSign className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Réservations</p>
                  <p className="text-3xl font-bold">
                    {stats.totalReservations}
                  </p>
                  <p className="text-xs opacity-70">
                    {stats.pendingReservations} en attente
                  </p>
                </div>
                <Users className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Départs Aujourd'hui</p>
                  <p className="text-3xl font-bold">{stats.todayDepartures}</p>
                  <p className="text-xs opacity-70">
                    Bus disponibles: {stats.availableBuses}
                  </p>
                </div>
                <Calendar className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trips">Voyages en Cours</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="operations">Opérations</TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Voyages en Cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">{trip.route.name}</h3>
                            <p className="text-sm text-gray-600">
                              {trip.route.departure.name} →{" "}
                              {trip.route.arrival.name}
                            </p>
                          </div>
                          {getStatusBadge(trip.status)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Bus: {trip.bus.plateNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trip.bus.model}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Départ</p>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(trip.departureTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Arrivée</p>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(trip.arrivalTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">Réservations</p>
                            <p className="text-sm text-gray-600">
                              {trip._count.reservations} /{" "}
                              {trip.availableSeats + trip._count.reservations}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {trip.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateTripStatus(trip.id, "BOARDING")
                            }
                          >
                            Commencer Embarquement
                          </Button>
                        )}
                        {trip.status === "BOARDING" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateTripStatus(trip.id, "DEPARTED")
                            }
                          >
                            Marquer Parti
                          </Button>
                        )}
                        {trip.status === "DEPARTED" && (
                          <Button
                            size="sm"
                            onClick={() => updateTripStatus(trip.id, "ARRIVED")}
                          >
                            Marquer Arrivé
                          </Button>
                        )}
                        {["SCHEDULED", "BOARDING"].includes(trip.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateTripStatus(trip.id, "CANCELLED")
                            }
                          >
                            Annuler
                          </Button>
                        )}
                        {trip.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTripStatus(trip.id, "DELAYED")}
                          >
                            Marquer Retardé
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {recentTrips.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun voyage en cours</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Réservations en Attente ({pendingReservations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">
                            {reservation.user.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {reservation.user.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">
                            {reservation.reservationCode}
                          </p>
                          {getReservationStatusBadge(reservation.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Trajet</p>
                          <p className="font-medium">
                            {reservation.trip.route.departure.name} →{" "}
                            {reservation.trip.route.arrival.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Départ</p>
                          <p className="font-medium">
                            {formatDateTime(reservation.trip.departureTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Montant</p>
                          <p className="font-bold text-green-600">
                            {reservation.totalAmount.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Réservé le {formatDateTime(reservation.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {pendingReservations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune réservation en attente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistiques Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-blue-600" />
                        <span>Itinéraires Actifs</span>
                      </div>
                      <span className="font-bold">{stats.totalRoutes}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-green-600" />
                        <span>Bus Disponibles</span>
                      </div>
                      <span className="font-bold">{stats.availableBuses}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span>Taux d'Occupation</span>
                      </div>
                      <span className="font-bold">
                        {stats.totalReservations > 0
                          ? Math.round(
                              (stats.totalReservations /
                                (stats.totalTrips * 50)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Alertes et Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.pendingReservations > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            Réservations en attente
                          </p>
                          <p className="text-sm text-gray-600">
                            {stats.pendingReservations} réservations nécessitent
                            votre attention
                          </p>
                        </div>
                      </div>
                    )}

                    {stats.todayDepartures > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            Départs aujourd'hui
                          </p>
                          <p className="text-sm text-gray-600">
                            {stats.todayDepartures} voyages programmés
                          </p>
                        </div>
                      </div>
                    )}

                    {stats.availableBuses === 0 && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            Aucun bus disponible
                          </p>
                          <p className="text-sm text-gray-600">
                            Vérifiez l'état de votre flotte
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Bus className="h-4 w-4 mr-2" />
                      Programmer un nouveau voyage
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Route className="h-4 w-4 mr-2" />
                      Gérer les itinéraires
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Voir toutes les réservations
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Rapports détaillés
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État du Système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connexion temps réel</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm">
                          {isConnected ? "Connecté" : "Déconnecté"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Dernière mise à jour</span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(), "HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Statut des services</span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Opérationnel
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
