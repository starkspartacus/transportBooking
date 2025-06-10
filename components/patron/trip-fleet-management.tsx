"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Bus,
  Star,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Activity,
  DollarSign,
  Route,
  Timer,
  Phone,
  User,
  RefreshCw,
  CalendarIcon,
  Zap,
  Wifi,
  Coffee,
  Tv,
  AirVent,
  Armchair,
  Luggage,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PlayCircle,
  StopCircle,
  PauseCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface TripFleetManagementProps {
  companyId: string;
}

export default function TripFleetManagement({
  companyId,
}: TripFleetManagementProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  // States
  const [trips, setTrips] = useState<TripData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("_all");
  const [filterType, setFilterType] = useState("_all");
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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

  // Fetch data
  useEffect(() => {
    if (companyId) {
      fetchTrips();
      fetchRoutes();
      fetchBuses();
    }
  }, [companyId]);

  const fetchTrips = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/trips?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchRoutes = useCallback(async () => {
    if (!companyId) return;
    try {
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
  }, [companyId]);

  const fetchBuses = useCallback(async () => {
    if (!companyId) return;
    try {
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
  }, [companyId]);

  // Form handlers
  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "busId" && typeof value === "string" && value) {
      const selectedBus = buses.find((bus) => bus.id === value);
      if (selectedBus) {
        setFormData((prev) => ({
          ...prev,
          availableSeats: selectedBus.capacity.toString(),
        }));
      }
    }

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
          : new Date(departureDateTime.getTime() + 2 * 60 * 60 * 1000);

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
          title: "✅ Voyage programmé",
          description: "Le voyage a été programmé avec succès",
        });
        fetchTrips();
        setShowNewForm(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            error.error || "Erreur lors de la programmation du voyage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "❌ Erreur",
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
          title: "🗑️ Voyage supprimé",
          description: "Le voyage a été supprimé avec succès",
        });
        fetchTrips();
      } else {
        const error = await response.json();
        toast({
          title: "❌ Erreur",
          description: error.error || "Erreur lors de la suppression du voyage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "❌ Erreur",
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
          title: "🔄 Statut mis à jour",
          description: "Le statut du voyage a été mis à jour",
        });
        fetchTrips();
      } else {
        const error = await response.json();
        toast({
          title: "❌ Erreur",
          description: error.error || "Erreur lors de la mise à jour du statut",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    const statusConfig = TRIP_STATUSES.find((s) => s.id === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const colorClasses = {
      blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors",
      yellow:
        "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors",
      green:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors",
      gray: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors",
      red: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors",
      orange:
        "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors",
    };

    return (
      <Badge
        className={
          colorClasses[statusConfig.color as keyof typeof colorClasses]
        }
      >
        {getStatusIcon(status)}
        <span className="ml-1">{statusConfig.name}</span>
      </Badge>
    );
  };

  const getTripTypeBadge = (type?: string) => {
    if (!type) return null;
    const typeConfig = TRIP_TYPES.find((t) => t.id === type);
    return (
      <Badge
        variant="outline"
        className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors"
      >
        <Star className="h-3 w-3 mr-1" />
        {typeConfig?.name || type}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "h-3 w-3";
    switch (status) {
      case "SCHEDULED":
        return <Clock3 className={iconClass} />;
      case "BOARDING":
        return <Users className={iconClass} />;
      case "DEPARTED":
      case "IN_TRANSIT":
        return <PlayCircle className={iconClass} />;
      case "ARRIVED":
      case "COMPLETED":
        return <CheckCircle2 className={iconClass} />;
      case "CANCELLED":
        return <StopCircle className={iconClass} />;
      case "DELAYED":
        return <PauseCircle className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
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

  const getServiceIcon = (serviceId: string) => {
    const iconClass = "h-4 w-4";
    switch (serviceId) {
      case "WIFI":
        return <Wifi className={iconClass} />;
      case "AIR_CONDITIONING":
        return <AirVent className={iconClass} />;
      case "ENTERTAINMENT":
        return <Tv className={iconClass} />;
      case "REFRESHMENTS":
        return <Coffee className={iconClass} />;
      case "RECLINING_SEATS":
        return <Armchair className={iconClass} />;
      case "LUGGAGE_SPACE":
        return <Luggage className={iconClass} />;
      default:
        return <Zap className={iconClass} />;
    }
  };

  // Filter trips
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

    const matchesStatus =
      !filterStatus || filterStatus === "_all" || trip.status === filterStatus;
    const matchesType =
      !filterType || filterType === "_all" || trip.tripType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics
  const scheduledTrips = trips.filter((trip) => trip.status === "SCHEDULED");
  const activeTrips = trips.filter((trip) =>
    ["BOARDING", "DEPARTED", "IN_TRANSIT"].includes(trip.status)
  );
  const completedTrips = trips.filter((trip) =>
    ["ARRIVED", "COMPLETED"].includes(trip.status)
  );
  const cancelledTrips = trips.filter((trip) => trip.status === "CANCELLED");
  const totalRevenue = trips.reduce((total, trip) => {
    const soldSeats = (trip.bus?.capacity || 0) - trip.availableSeats;
    return total + soldSeats * trip.currentPrice;
  }, 0);

  // Tab filtering
  const getTabTrips = (tab: string) => {
    switch (tab) {
      case "scheduled":
        return filteredTrips.filter((trip) => trip.status === "SCHEDULED");
      case "active":
        return filteredTrips.filter((trip) =>
          ["BOARDING", "DEPARTED", "IN_TRANSIT"].includes(trip.status)
        );
      case "completed":
        return filteredTrips.filter((trip) =>
          ["ARRIVED", "COMPLETED"].includes(trip.status)
        );
      case "cancelled":
        return filteredTrips.filter((trip) => trip.status === "CANCELLED");
      default:
        return filteredTrips;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Route className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestion des Voyages
            </h2>
            <p className="text-gray-600">Planifiez et gérez tous vos voyages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchTrips}
            disabled={isLoading}
            className="hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Voyage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Programmer un nouveau voyage
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour programmer un nouveau voyage
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informations du voyage */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Informations du voyage
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Route *
                        </label>
                        <Select
                          value={formData.routeId}
                          onValueChange={(value) =>
                            handleInputChange("routeId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une route..." />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map((route) => (
                              <SelectItem key={route.id} value={route.id}>
                                <div className="flex items-center gap-2">
                                  <Navigation className="h-4 w-4" />
                                  {route.name} ({route.departureLocation} →{" "}
                                  {route.arrivalLocation})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Bus *
                        </label>
                        <Select
                          value={formData.busId}
                          onValueChange={(value) =>
                            handleInputChange("busId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un bus..." />
                          </SelectTrigger>
                          <SelectContent>
                            {buses.map((bus) => (
                              <SelectItem key={bus.id} value={bus.id}>
                                <div className="flex items-center gap-2">
                                  <Bus className="h-4 w-4" />
                                  {bus.plateNumber} - {bus.model} (
                                  {bus.capacity} places)
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Type de voyage
                          </label>
                          <Select
                            value={formData.tripType}
                            onValueChange={(value) =>
                              handleInputChange("tripType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRIP_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    {type.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Statut
                          </label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              handleInputChange("status", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                            <SelectContent>
                              {TRIP_STATUSES.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(status.id)}
                                    {status.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                  </div>

                  {/* Tarification et détails */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Tarification et détails
                    </h3>

                    <div className="space-y-4">
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
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
                          {TRIP_SERVICES.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center space-x-2 text-sm hover:bg-white p-2 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.services.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="rounded border-gray-300"
                              />
                              <div className="flex items-center gap-2">
                                {getServiceIcon(service.id)}
                                <span>{service.name}</span>
                              </div>
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
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            Informations de la route
                          </h4>
                          {(() => {
                            const selectedRoute = routes.find(
                              (r) => r.id === formData.routeId
                            );
                            return selectedRoute ? (
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    Distance: {selectedRoute.distance} km
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Timer className="h-3 w-3" />
                                  <span>
                                    Durée estimée:{" "}
                                    {formatDuration(
                                      selectedRoute.estimatedDuration
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  <span>
                                    Prix de base:{" "}
                                    {selectedRoute.basePrice.toLocaleString()}{" "}
                                    XOF
                                  </span>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Programmation...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Programmer le voyage
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {trips.length}
                </p>
                <p className="text-sm text-blue-600">Total voyages</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Route className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-700">
                  {scheduledTrips.length}
                </p>
                <p className="text-sm text-yellow-600">Programmés</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <Clock3 className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {activeTrips.length}
                </p>
                <p className="text-sm text-green-600">En cours</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <PlayCircle className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {completedTrips.length}
                </p>
                <p className="text-sm text-purple-600">Terminés</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600">Revenus (XOF)</p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un voyage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous les statuts</SelectItem>
                {TRIP_STATUSES.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.id)}
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous les types</SelectItem>
                {TRIP_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("_all");
                setFilterType("_all");
              }}
              className="hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trips Tabs */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tous ({filteredTrips.length})
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="flex items-center gap-2"
                >
                  <Clock3 className="h-4 w-4" />
                  Programmés ({getTabTrips("scheduled").length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  En cours ({getTabTrips("active").length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminés ({getTabTrips("completed").length})
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="flex items-center gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  Annulés ({getTabTrips("cancelled").length})
                </TabsTrigger>
              </TabsList>
            </div>

            {["all", "scheduled", "active", "completed", "cancelled"].map(
              (tab) => (
                <TabsContent key={tab} value={tab} className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Chargement des voyages...
                        </p>
                      </div>
                    </div>
                  ) : getTabTrips(tab).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <Route className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {trips.length === 0
                          ? "Aucun voyage trouvé"
                          : `Aucun voyage ${tab === "all" ? "" : tab}`}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {trips.length === 0
                          ? "Commencez par programmer votre premier voyage"
                          : "Aucun voyage ne correspond à vos critères"}
                      </p>
                      {trips.length === 0 && (
                        <Button
                          onClick={() => setShowNewForm(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Programmer un voyage
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {getTabTrips(tab).map((trip) => (
                        <Card
                          key={trip.id}
                          className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 group"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {trip.route?.name || "Route non définie"}
                                  </h3>
                                  {getTripTypeBadge(trip.tripType)}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusBadge(trip.status)}
                                  {trip.services &&
                                    trip.services.length > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-green-50 text-green-700 border-green-200"
                                      >
                                        <Zap className="h-3 w-3 mr-1" />
                                        {trip.services.length} service
                                        {trip.services.length > 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="hover:bg-gray-100"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTrip(trip);
                                      setShowDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>
                                  {trip.route?.departureLocation} →{" "}
                                  {trip.route?.arrivalLocation}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bus className="h-4 w-4 text-green-500" />
                                <span>
                                  {trip.bus?.plateNumber} - {trip.bus?.model}
                                </span>
                              </div>

                              {trip.driverName && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-4 w-4 text-purple-500" />
                                  <span>Chauffeur: {trip.driverName}</span>
                                  {trip.driverPhone && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <Phone className="h-3 w-3" />
                                      <span className="text-xs">
                                        {trip.driverPhone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p className="text-gray-600 flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    Départ
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDateTime(trip.departureTime)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-600 flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    Arrivée
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDateTime(trip.arrivalTime)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                  <p className="font-semibold text-blue-700">
                                    {trip.currentPrice.toLocaleString()}
                                  </p>
                                  <p className="text-blue-600 text-xs">XOF</p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                  <p className="font-semibold text-green-700">
                                    {trip.availableSeats}
                                  </p>
                                  <p className="text-green-600 text-xs">
                                    Libres
                                  </p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                  <p className="font-semibold text-purple-700">
                                    {trip.bus?.capacity || 0}
                                  </p>
                                  <p className="text-purple-600 text-xs">
                                    Total
                                  </p>
                                </div>
                              </div>

                              {trip.route && (
                                <div className="text-sm bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Navigation className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-600">
                                        {trip.route.distance} km
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Timer className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-600">
                                        {formatDuration(
                                          trip.route.estimatedDuration
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {trip.services && trip.services.length > 0 && (
                                <div className="text-sm">
                                  <p className="text-gray-600 mb-2 flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    Services inclus:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {trip.services
                                      .slice(0, 3)
                                      .map((serviceId) => {
                                        const service = TRIP_SERVICES.find(
                                          (s) => s.id === serviceId
                                        );
                                        return service ? (
                                          <Badge
                                            key={serviceId}
                                            variant="secondary"
                                            className="text-xs bg-green-50 text-green-700 border-green-200"
                                          >
                                            {getServiceIcon(serviceId)}
                                            <span className="ml-1">
                                              {service.name}
                                            </span>
                                          </Badge>
                                        ) : null;
                                      })}
                                    {trip.services.length > 3 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +{trip.services.length - 3} autres
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {trip._count && (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                                    <p className="font-semibold text-blue-700">
                                      {trip._count.reservations}
                                    </p>
                                    <p className="text-blue-600 text-xs">
                                      Réservations
                                    </p>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                                    <p className="font-semibold text-green-700">
                                      {trip._count.tickets}
                                    </p>
                                    <p className="text-green-600 text-xs">
                                      Billets vendus
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Quick Actions */}
                              {trip.status === "SCHEDULED" && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleStatusChange(trip.id, "BOARDING")
                                    }
                                    className="flex-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50 transition-colors"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    Embarquement
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleStatusChange(trip.id, "CANCELLED")
                                    }
                                    className="text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                                  >
                                    <StopCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}

                              {trip.status === "BOARDING" && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleStatusChange(trip.id, "DEPARTED")
                                    }
                                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 transition-colors"
                                  >
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Départ
                                  </Button>
                                </div>
                              )}

                              {trip.status === "DEPARTED" && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleStatusChange(trip.id, "ARRIVED")
                                    }
                                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Arrivé
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Trip Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Détails du voyage
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le voyage sélectionné
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Informations générales
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Route className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">
                          {selectedTrip.route?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedTrip.route?.departureLocation} →{" "}
                          {selectedTrip.route?.arrivalLocation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bus className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">
                          {selectedTrip.bus?.plateNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedTrip.bus?.model}
                        </p>
                      </div>
                    </div>
                    {selectedTrip.driverName && (
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">
                            {selectedTrip.driverName}
                          </p>
                          {selectedTrip.driverPhone && (
                            <p className="text-sm text-gray-600">
                              {selectedTrip.driverPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Horaires et tarifs
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Départ</p>
                        <p className="font-medium">
                          {formatDateTime(selectedTrip.departureTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Arrivée</p>
                        <p className="font-medium">
                          {formatDateTime(selectedTrip.arrivalTime)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Prix</p>
                        <p className="font-medium">
                          {selectedTrip.currentPrice.toLocaleString()} XOF
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Places libres</p>
                        <p className="font-medium">
                          {selectedTrip.availableSeats}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Capacité totale</p>
                        <p className="font-medium">
                          {selectedTrip.bus?.capacity}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrip.services && selectedTrip.services.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">
                    Services inclus
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTrip.services.map((serviceId) => {
                      const service = TRIP_SERVICES.find(
                        (s) => s.id === serviceId
                      );
                      return service ? (
                        <div
                          key={serviceId}
                          className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          {getServiceIcon(serviceId)}
                          <span className="text-sm font-medium text-green-700">
                            {service.name}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {selectedTrip.notes && (
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">
                    Notes
                  </h3>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-gray-700">{selectedTrip.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
