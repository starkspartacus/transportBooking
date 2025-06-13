"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Users,
  Bus,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TRIP_TYPES, TRIP_STATUSES, TRIP_SERVICES } from "@/constants/trip";

interface TripData {
  id: string;
  routeId: string;
  busId: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  currentPrice: number;
  availableSeats: number;
  status: string;
  tripType?: string;
  services?: string[];
  cancellationReason?: string;
  notes?: string;
  driverName?: string;
  driverPhone?: string;
  route?: {
    id: string;
    name: string;
    departureLocation: string;
    arrivalLocation: string;
    distance: number;
    estimatedDuration: number;
  };
  bus?: {
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
  };
  _count?: {
    reservations: number;
    tickets: number;
  };
  createdAt: string;
}

interface RouteData {
  id: string;
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  status: string;
}

interface BusData {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
}

interface TripManagementProps {
  companyId: string;
}

export default function TripManagement({ companyId }: TripManagementProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    routeId: "",
    busId: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    basePrice: "",
    availableSeats: "",
    status: "SCHEDULED",
    tripType: "STANDARD",
    services: [] as string[],
    driverName: "",
    driverPhone: "",
    notes: "",
  });

  useEffect(() => {
    fetchTrips();
    fetchRoutes();
    fetchBuses();
  }, []);

  const fetchTrips = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/trips?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(Array.isArray(data) ? data : []);
      } else {
        console.error("Error fetching trips:", response.statusText);
        setTrips([]);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchRoutes = useCallback(async () => {
    if (!session?.user?.companyId) return;

    try {
      const companyId = session.user.companyId;
      const response = await fetch(`/api/patron/routes?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Routes fetched:", data); // Debug log
        setRoutes(Array.isArray(data) ? data : []);
      } else {
        console.error("Error response:", response.status, response.statusText);
        setRoutes([]);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      setRoutes([]);
    }
  }, [session]);

  const fetchBuses = useCallback(async () => {
    if (!session?.user?.companyId) return;

    try {
      const companyId = session.user.companyId;
      const response = await fetch(`/api/patron/buses?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Buses fetched:", data); // Debug log
        setBuses(Array.isArray(data) ? data : []);
      } else {
        console.error("Error response:", response.status, response.statusText);
        setBuses([]);
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
      setBuses([]);
    }
  }, [session]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-fill available seats when bus is selected
    if (field === "busId" && typeof value === "string" && value) {
      const selectedBus = buses.find((bus) => bus.id === value);
      if (selectedBus) {
        setFormData((prev) => ({
          ...prev,
          availableSeats: selectedBus.capacity.toString(),
        }));
      }
    }

    // Auto-fill price when route is selected
    if (field === "routeId" && typeof value === "string" && value) {
      const selectedRoute = routes.find((route) => route.id === value);
      if (selectedRoute) {
        setFormData((prev) => ({
          ...prev,
          basePrice: selectedRoute.basePrice.toString(),
        }));
      }
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const resetForm = () => {
    setFormData({
      routeId: "",
      busId: "",
      departureDate: "",
      departureTime: "",
      arrivalDate: "",
      arrivalTime: "",
      basePrice: "",
      availableSeats: "",
      status: "SCHEDULED",
      tripType: "STANDARD",
      services: [],
      driverName: "",
      driverPhone: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.routeId ||
      !formData.busId ||
      !formData.departureDate ||
      !formData.departureTime ||
      !formData.basePrice
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const departureDateTime = new Date(
        `${formData.departureDate}T${formData.departureTime}`
      );
      const arrivalDateTime =
        formData.arrivalDate && formData.arrivalTime
          ? new Date(`${formData.arrivalDate}T${formData.arrivalTime}`)
          : new Date(departureDateTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours by default

      const submitData = {
        routeId: formData.routeId,
        busId: formData.busId,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        basePrice: Number.parseFloat(formData.basePrice),
        currentPrice: Number.parseFloat(formData.basePrice),
        availableSeats: Number.parseInt(formData.availableSeats),
        status: formData.status,
        tripType: formData.tripType,
        services: formData.services,
        driverName: formData.driverName || null,
        driverPhone: formData.driverPhone || null,
        notes: formData.notes || null,
        companyId: companyId,
      };

      const response = await fetch("/api/patron/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Voyage programmé",
          description: "Le voyage a été programmé avec succès",
        });
        fetchTrips();
        setShowNewForm(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description:
            error.error || "Erreur lors de la programmation du voyage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la programmation du voyage",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) return;

    try {
      const response = await fetch(`/api/patron/trips/${tripId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Voyage supprimé",
          description: "Le voyage a été supprimé avec succès",
        });
        fetchTrips();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la suppression du voyage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du voyage",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/patron/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Statut mis à jour",
          description: "Le statut du voyage a été mis à jour",
        });
        fetchTrips();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la mise à jour du statut",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TRIP_STATUSES.find((s) => s.id === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const colorClasses = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
    };

    return (
      <Badge
        className={
          colorClasses[statusConfig.color as keyof typeof colorClasses]
        }
      >
        {statusConfig.name}
      </Badge>
    );
  };

  const getTripTypeBadge = (type?: string) => {
    if (!type) return null;
    const typeConfig = TRIP_TYPES.find((t) => t.id === type);
    return (
      <Badge variant="outline" className="text-xs">
        {typeConfig?.name || type}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Clock className="h-4 w-4" />;
      case "BOARDING":
        return <Users className="h-4 w-4" />;
      case "DEPARTED":
      case "IN_TRANSIT":
        return <Play className="h-4 w-4" />;
      case "ARRIVED":
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "DELAYED":
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
  };

  // Filter trips based on search and filters
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      !searchTerm ||
      trip.route?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.route?.departureLocation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.route?.arrivalLocation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.bus?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || trip.status === filterStatus;
    const matchesType = !filterType || trip.tripType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const scheduledTrips = trips.filter((trip) => trip.status === "SCHEDULED");
  const activeTrips = trips.filter((trip) =>
    ["BOARDING", "DEPARTED", "IN_TRANSIT"].includes(trip.status)
  );
  const completedTrips = trips.filter((trip) =>
    ["ARRIVED", "COMPLETED"].includes(trip.status)
  );
  const totalSeats = trips.reduce(
    (total, trip) => total + trip.availableSeats,
    0
  );
  const totalRevenue = trips.reduce((total, trip) => {
    const soldSeats = (trip.bus?.capacity || 0) - trip.availableSeats;
    return total + soldSeats * trip.currentPrice;
  }, 0);

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              Gestion des voyages ({trips.length})
            </CardTitle>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Programmer un voyage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtres et recherche */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Rechercher un voyage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {TRIP_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Tous les types</option>
                {TRIP_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("");
                  setFilterType("");
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {showNewForm && (
            <Card className="mb-6 border-2 border-dashed border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Nouveau voyage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations du voyage */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        Informations du voyage
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Route *
                        </label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.routeId}
                          onChange={(e) =>
                            handleInputChange("routeId", e.target.value)
                          }
                          required
                        >
                          <option value="">Sélectionner une route...</option>
                          {routes.map((route) => (
                            <option key={route.id} value={route.id}>
                              {route.name} ({route.departureLocation} →{" "}
                              {route.arrivalLocation})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Bus *
                        </label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.busId}
                          onChange={(e) =>
                            handleInputChange("busId", e.target.value)
                          }
                          required
                        >
                          <option value="">Sélectionner un bus...</option>
                          {buses.map((bus) => (
                            <option key={bus.id} value={bus.id}>
                              {bus.plateNumber} - {bus.model} ({bus.capacity}{" "}
                              places)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Type de voyage
                          </label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.tripType}
                            onChange={(e) =>
                              handleInputChange("tripType", e.target.value)
                            }
                          >
                            {TRIP_TYPES.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Statut
                          </label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.status}
                            onChange={(e) =>
                              handleInputChange("status", e.target.value)
                            }
                          >
                            {TRIP_STATUSES.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Date de départ *
                          </label>
                          <Input
                            type="date"
                            value={formData.departureDate}
                            onChange={(e) =>
                              handleInputChange("departureDate", e.target.value)
                            }
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Heure de départ *
                          </label>
                          <Input
                            type="time"
                            value={formData.departureTime}
                            onChange={(e) =>
                              handleInputChange("departureTime", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Date d'arrivée
                          </label>
                          <Input
                            type="date"
                            value={formData.arrivalDate}
                            onChange={(e) =>
                              handleInputChange("arrivalDate", e.target.value)
                            }
                            min={
                              formData.departureDate ||
                              new Date().toISOString().split("T")[0]
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Heure d'arrivée
                          </label>
                          <Input
                            type="time"
                            value={formData.arrivalTime}
                            onChange={(e) =>
                              handleInputChange("arrivalTime", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tarification et détails */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                        <Users className="h-5 w-5 text-green-600" />
                        Tarification et détails
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Prix du billet (XOF) *
                          </label>
                          <Input
                            type="number"
                            placeholder="Prix en XOF"
                            value={formData.basePrice}
                            onChange={(e) =>
                              handleInputChange("basePrice", e.target.value)
                            }
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Places disponibles *
                          </label>
                          <Input
                            type="number"
                            placeholder="Nombre de places"
                            value={formData.availableSeats}
                            onChange={(e) =>
                              handleInputChange(
                                "availableSeats",
                                e.target.value
                              )
                            }
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Nom du chauffeur
                          </label>
                          <Input
                            placeholder="Nom du chauffeur"
                            value={formData.driverName}
                            onChange={(e) =>
                              handleInputChange("driverName", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Téléphone du chauffeur
                          </label>
                          <Input
                            placeholder="Numéro de téléphone"
                            value={formData.driverPhone}
                            onChange={(e) =>
                              handleInputChange("driverPhone", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Services inclus
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                          {TRIP_SERVICES.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={formData.services.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="rounded border-gray-300"
                              />
                              <span>{service.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Notes
                        </label>
                        <Textarea
                          placeholder="Notes supplémentaires sur le voyage..."
                          value={formData.notes}
                          onChange={(e) =>
                            handleInputChange("notes", e.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      {formData.routeId && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">
                            Informations de la route
                          </h4>
                          {(() => {
                            const selectedRoute = routes.find(
                              (r) => r.id === formData.routeId
                            );
                            return selectedRoute ? (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Distance: {selectedRoute.distance} km</p>
                                <p>
                                  Durée estimée:{" "}
                                  {formatDuration(
                                    selectedRoute.estimatedDuration
                                  )}
                                </p>
                                <p>
                                  Prix de base:{" "}
                                  {selectedRoute.basePrice.toLocaleString()} XOF
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewForm(false);
                        resetForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isSubmitting
                        ? "Programmation en cours..."
                        : "Programmer le voyage"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des voyages...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-purple-700">
                          {trips.length}
                        </p>
                        <p className="text-sm text-purple-600">Total voyages</p>
                      </div>
                      <Calendar className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-blue-700">
                          {scheduledTrips.length}
                        </p>
                        <p className="text-sm text-blue-600">Programmés</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-700">
                          {activeTrips.length}
                        </p>
                        <p className="text-sm text-green-600">En cours</p>
                      </div>
                      <Bus className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-orange-700">
                          {completedTrips.length}
                        </p>
                        <p className="text-sm text-orange-600">Terminés</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-emerald-700">
                          {totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-emerald-600">
                          Revenus (XOF)
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des voyages */}
              {filteredTrips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {trips.length === 0
                      ? "Aucun voyage trouvé"
                      : "Aucun résultat"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {trips.length === 0
                      ? "Commencez par programmer votre premier voyage"
                      : "Essayez de modifier vos critères de recherche"}
                  </p>
                  {trips.length === 0 && (
                    <Button
                      onClick={() => setShowNewForm(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Programmer un voyage
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTrips.map((trip) => (
                    <Card
                      key={trip.id}
                      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {trip.route?.name || "Route non définie"}
                              </h3>
                              {getTripTypeBadge(trip.tripType)}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(trip.status)}
                              {trip.services && trip.services.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {trip.services.length} service
                                  {trip.services.length > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {trip.route?.departureLocation} →{" "}
                              {trip.route?.arrivalLocation}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Bus className="h-4 w-4" />
                            <span>
                              {trip.bus?.plateNumber} - {trip.bus?.model}
                            </span>
                          </div>

                          {trip.driverName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>Chauffeur: {trip.driverName}</span>
                              {trip.driverPhone && (
                                <span>({trip.driverPhone})</span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-600">Départ</p>
                              <p className="font-semibold flex items-center gap-1">
                                {getStatusIcon(trip.status)}
                                {formatDateTime(trip.departureTime)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-600">Arrivée</p>
                              <p className="font-semibold">
                                {formatDateTime(trip.arrivalTime)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {trip.currentPrice.toLocaleString()} XOF
                              </p>
                              <p className="text-gray-600">Prix</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {trip.availableSeats}
                              </p>
                              <p className="text-gray-600">Places libres</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {trip.bus?.capacity || 0}
                              </p>
                              <p className="text-gray-600">Total places</p>
                            </div>
                          </div>

                          {trip.route && (
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                              <div className="flex justify-between">
                                <span>Distance: {trip.route.distance} km</span>
                                <span>
                                  Durée:{" "}
                                  {formatDuration(trip.route.estimatedDuration)}
                                </span>
                              </div>
                            </div>
                          )}

                          {trip.services && trip.services.length > 0 && (
                            <div className="text-sm">
                              <p className="text-gray-600 mb-2">
                                Services inclus:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {trip.services.map((serviceId) => {
                                  const service = TRIP_SERVICES.find(
                                    (s) => s.id === serviceId
                                  );
                                  return service ? (
                                    <Badge
                                      key={serviceId}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {service.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {trip._count && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <p className="font-semibold text-blue-700">
                                  {trip._count.reservations}
                                </p>
                                <p className="text-blue-600">Réservations</p>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <p className="font-semibold text-green-700">
                                  {trip._count.tickets}
                                </p>
                                <p className="text-green-600">Billets vendus</p>
                              </div>
                            </div>
                          )}

                          {trip.notes && (
                            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                              <p className="font-medium mb-1">Notes:</p>
                              <p>{trip.notes}</p>
                            </div>
                          )}

                          {/* Actions rapides pour changer le statut */}
                          {trip.status === "SCHEDULED" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "BOARDING")
                                }
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              >
                                Commencer embarquement
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "CANCELLED")
                                }
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Annuler
                              </Button>
                            </div>
                          )}

                          {trip.status === "BOARDING" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "DEPARTED")
                                }
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                Marquer comme parti
                              </Button>
                            </div>
                          )}

                          {trip.status === "DEPARTED" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(trip.id, "ARRIVED")
                                }
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Marquer comme arrivé
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
