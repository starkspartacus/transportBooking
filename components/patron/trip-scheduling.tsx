"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Bus,
  Users,
  DollarSign,
  Trash2,
  Copy,
  Play,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  availableSeats: number;
  route: {
    id: string;
    name: string;
    departureLocation: string;
    arrivalLocation: string;
    price: number;
    estimatedDuration: number;
  };
  bus: BusType;
  _count: {
    reservations: number;
    tickets: number;
  };
}

interface Route {
  id: string;
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  price: number;
  estimatedDuration: number;
  status: string;
}

interface BusType {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  capacity: number;
  status: string;
}

const TRIP_STATUSES = [
  {
    value: "SCHEDULED",
    label: "Programmé",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "BOARDING",
    label: "Embarquement",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "DEPARTED", label: "Parti", color: "bg-green-100 text-green-800" },
  { value: "ARRIVED", label: "Arrivé", color: "bg-gray-100 text-gray-800" },
  { value: "CANCELLED", label: "Annulé", color: "bg-red-100 text-red-800" },
  {
    value: "DELAYED",
    label: "Retardé",
    color: "bg-orange-100 text-orange-800",
  },
];

export default function TripScheduling() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [tripForm, setTripForm] = useState({
    routeId: "",
    busId: "",
    departureDate: new Date(),
    departureTime: "",
    customPrice: "",
    useCustomPrice: false,
    repeatType: "none", // none, daily, weekly, monthly
    repeatEndDate: new Date(),
    repeatCount: 1,
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    routeId: "",
    dateRange: "all", // today, week, month, all
    searchQuery: "",
  });

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tripsRes, routesRes, busesRes] = await Promise.all([
        fetch(`/api/patron/trips?companyId=${session?.user?.companyId}`),
        fetch(`/api/patron/routes?companyId=${session?.user?.companyId}`),
        fetch(`/api/patron/buses?companyId=${session?.user?.companyId}`),
      ]);

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        setTrips(tripsData);
      }

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(
          routesData.filter((route: Route) => route.status === "ACTIVE")
        );
      }

      if (busesRes.ok) {
        const busesData = await busesRes.json();
        setBuses(busesData.filter((bus: BusType) => bus.status === "ACTIVE"));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedRoute = routes.find((r) => r.id === tripForm.routeId);
      const selectedBus = buses.find((b) => b.id === tripForm.busId);

      if (!selectedRoute || !selectedBus) {
        throw new Error("Route ou bus non sélectionné");
      }

      // Calculer l'heure d'arrivée
      const departureDateTime = new Date(tripForm.departureDate);
      const [hours, minutes] = tripForm.departureTime.split(":");
      departureDateTime.setHours(
        Number.parseInt(hours),
        Number.parseInt(minutes)
      );

      const arrivalDateTime = new Date(
        departureDateTime.getTime() + selectedRoute.estimatedDuration * 60000
      );

      const tripData = {
        routeId: tripForm.routeId,
        busId: tripForm.busId,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        availableSeats: selectedBus.capacity,
        customPrice: tripForm.useCustomPrice
          ? Number.parseFloat(tripForm.customPrice)
          : null,
        companyId: session?.user?.companyId,
      };

      // Gérer la répétition
      const tripsToCreate = [];
      if (tripForm.repeatType === "none") {
        tripsToCreate.push(tripData);
      } else {
        for (let i = 0; i < tripForm.repeatCount; i++) {
          const tripDate = new Date(tripForm.departureDate);

          if (tripForm.repeatType === "daily") {
            tripDate.setDate(tripDate.getDate() + i);
          } else if (tripForm.repeatType === "weekly") {
            tripDate.setDate(tripDate.getDate() + i * 7);
          } else if (tripForm.repeatType === "monthly") {
            tripDate.setMonth(tripDate.getMonth() + i);
          }

          if (isAfter(tripDate, tripForm.repeatEndDate)) break;

          const tripDateTime = new Date(tripDate);
          tripDateTime.setHours(
            Number.parseInt(hours),
            Number.parseInt(minutes)
          );
          const tripArrival = new Date(
            tripDateTime.getTime() + selectedRoute.estimatedDuration * 60000
          );

          tripsToCreate.push({
            ...tripData,
            departureTime: tripDateTime.toISOString(),
            arrivalTime: tripArrival.toISOString(),
          });
        }
      }

      // Créer les voyages
      for (const trip of tripsToCreate) {
        const response = await fetch("/api/patron/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trip),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la création");
        }
      }

      toast({
        title: "Succès",
        description: `${tripsToCreate.length} voyage(s) créé(s) avec succès`,
      });

      fetchData();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const duplicateTrip = async (trip: Trip) => {
    try {
      const newDepartureTime = new Date(trip.departureTime);
      newDepartureTime.setDate(newDepartureTime.getDate() + 1);

      const newArrivalTime = new Date(trip.arrivalTime);
      newArrivalTime.setDate(newArrivalTime.getDate() + 1);

      const response = await fetch("/api/patron/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: trip.route.id,
          busId: trip.bus.id,
          departureTime: newDepartureTime.toISOString(),
          arrivalTime: newArrivalTime.toISOString(),
          availableSeats: trip.bus.capacity,
          companyId: session?.user?.companyId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Voyage dupliqué avec succès",
        });
        fetchData();
      } else {
        throw new Error("Erreur lors de la duplication");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/patron/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Statut mis à jour",
        });
        fetchData();
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) return;

    try {
      const response = await fetch(`/api/patron/trips/${tripId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Voyage supprimé",
        });
        fetchData();
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTripForm({
      routeId: "",
      busId: "",
      departureDate: new Date(),
      departureTime: "",
      customPrice: "",
      useCustomPrice: false,
      repeatType: "none",
      repeatEndDate: addDays(new Date(), 30),
      repeatCount: 1,
    });
    setSelectedTrip(null);
    setIsEditMode(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TRIP_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy à HH:mm", { locale: fr });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
      : `${mins}min`;
  };

  const filteredTrips = trips.filter((trip) => {
    if (filters.status && trip.status !== filters.status) return false;
    if (filters.routeId && trip.route.id !== filters.routeId) return false;

    if (filters.dateRange !== "all") {
      const tripDate = new Date(trip.departureTime);
      const today = new Date();

      if (filters.dateRange === "today" && !isSameDay(tripDate, today))
        return false;
      if (filters.dateRange === "week" && isAfter(tripDate, addDays(today, 7)))
        return false;
      if (
        filters.dateRange === "month" &&
        isAfter(tripDate, addDays(today, 30))
      )
        return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        trip.route.name.toLowerCase().includes(query) ||
        trip.bus.plateNumber.toLowerCase().includes(query) ||
        trip.route.departureLocation.toLowerCase().includes(query) ||
        trip.route.arrivalLocation.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Programmation des voyages
          </h1>
          <p className="text-gray-600">Planifiez et gérez vos voyages</p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Programmer un voyage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Programmer un nouveau voyage</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection route et bus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routeId">Route *</Label>
                  <Select
                    value={tripForm.routeId}
                    onValueChange={(value) =>
                      setTripForm((prev) => ({ ...prev, routeId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{route.name}</span>
                            <span className="text-xs text-gray-500">
                              {route.departureLocation} →{" "}
                              {route.arrivalLocation}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="busId">Bus *</Label>
                  <Select
                    value={tripForm.busId}
                    onValueChange={(value) =>
                      setTripForm((prev) => ({ ...prev, busId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {bus.plateNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {bus.brand} {bus.model} - {bus.capacity} places
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date de départ *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(tripForm.departureDate, "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tripForm.departureDate}
                        onSelect={(date) =>
                          date &&
                          setTripForm((prev) => ({
                            ...prev,
                            departureDate: date,
                          }))
                        }
                        disabled={(date) => isBefore(date, new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="departureTime">Heure de départ *</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={tripForm.departureTime}
                    onChange={(e) =>
                      setTripForm((prev) => ({
                        ...prev,
                        departureTime: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Prix personnalisé */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useCustomPrice"
                    checked={tripForm.useCustomPrice}
                    onChange={(e) =>
                      setTripForm((prev) => ({
                        ...prev,
                        useCustomPrice: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="useCustomPrice">
                    Utiliser un prix personnalisé
                  </Label>
                </div>

                {tripForm.useCustomPrice && (
                  <div>
                    <Label htmlFor="customPrice">
                      Prix personnalisé (FCFA)
                    </Label>
                    <Input
                      id="customPrice"
                      type="number"
                      min="0"
                      value={tripForm.customPrice}
                      onChange={(e) =>
                        setTripForm((prev) => ({
                          ...prev,
                          customPrice: e.target.value,
                        }))
                      }
                      placeholder="Prix en FCFA"
                    />
                  </div>
                )}
              </div>

              {/* Répétition */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="repeatType">Type de répétition</Label>
                  <Select
                    value={tripForm.repeatType}
                    onValueChange={(value) =>
                      setTripForm((prev) => ({ ...prev, repeatType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune répétition</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tripForm.repeatType !== "none" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="repeatCount">Nombre de répétitions</Label>
                      <Input
                        id="repeatCount"
                        type="number"
                        min="1"
                        max="365"
                        value={tripForm.repeatCount}
                        onChange={(e) =>
                          setTripForm((prev) => ({
                            ...prev,
                            repeatCount: Number.parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label>Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(tripForm.repeatEndDate, "dd MMMM yyyy", {
                              locale: fr,
                            })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={tripForm.repeatEndDate}
                            onSelect={(date) =>
                              date &&
                              setTripForm((prev) => ({
                                ...prev,
                                repeatEndDate: date,
                              }))
                            }
                            disabled={(date) =>
                              isBefore(date, tripForm.departureDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>

              {/* Aperçu */}
              {tripForm.routeId && tripForm.busId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Aperçu du voyage
                  </h4>
                  {(() => {
                    const selectedRoute = routes.find(
                      (r) => r.id === tripForm.routeId
                    );
                    const selectedBus = buses.find(
                      (b) => b.id === tripForm.busId
                    );

                    if (!selectedRoute || !selectedBus) return null;

                    return (
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {selectedRoute.departureLocation} →{" "}
                            {selectedRoute.arrivalLocation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          <span>
                            {selectedBus.plateNumber} ({selectedBus.capacity}{" "}
                            places)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Durée:{" "}
                            {formatDuration(selectedRoute.estimatedDuration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            Prix:{" "}
                            {formatCurrency(
                              tripForm.useCustomPrice && tripForm.customPrice
                                ? Number.parseFloat(tripForm.customPrice)
                                : selectedRoute.price
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Programmation..." : "Programmer le voyage"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par route, bus, destination..."
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">Tous les statuts</SelectItem>
                {TRIP_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.routeId}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, routeId: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Toutes les routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_routes">Toutes les routes</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{trip.route.name}</CardTitle>
                {getStatusBadge(trip.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {trip.route.departureLocation} → {trip.route.arrivalLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Bus className="h-3 w-3" />
                  {trip.bus.plateNumber}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Départ</p>
                  <p className="font-medium">
                    {formatDateTime(trip.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Arrivée</p>
                  <p className="font-medium">
                    {formatDateTime(trip.arrivalTime)}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{trip.availableSeats} places</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span>{trip._count.reservations} réservations</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{formatCurrency(trip.route.price)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {trip.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTripStatus(trip.id, "BOARDING")}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Démarrer
                  </Button>
                )}

                {trip.status === "BOARDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTripStatus(trip.id, "DEPARTED")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Parti
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateTrip(trip)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Dupliquer
                </Button>

                {trip.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTrip(trip.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {trips.length === 0 ? "Aucun voyage programmé" : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-4">
              {trips.length === 0
                ? "Commencez par programmer votre premier voyage"
                : "Aucun voyage ne correspond à vos critères de recherche"}
            </p>
            {trips.length === 0 && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Programmer un voyage
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
