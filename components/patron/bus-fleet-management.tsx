"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bus,
  CalendarIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Fuel,
  Wrench,
  Users,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BusVehicle {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  capacity: number;
  year: number;
  color: string;
  fuelType: string;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKm: number;
  insuranceExpiry: string;
  technicalControlExpiry: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

const BUS_STATUSES = [
  {
    value: "ACTIVE",
    label: "En service",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "MAINTENANCE",
    label: "En maintenance",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "OUT_OF_SERVICE",
    label: "Hors service",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "INSPECTION",
    label: "Contrôle technique",
    color: "bg-blue-100 text-blue-800",
  },
];

const FUEL_TYPES = [
  { value: "DIESEL", label: "Diesel" },
  { value: "GASOLINE", label: "Essence" },
  { value: "HYBRID", label: "Hybride" },
  { value: "ELECTRIC", label: "Électrique" },
  { value: "CNG", label: "GNC" },
];

const BUS_FEATURES = [
  { id: "air_conditioning", label: "Climatisation" },
  { id: "wifi", label: "WiFi" },
  { id: "usb_charging", label: "Chargement USB" },
  { id: "entertainment", label: "Divertissement" },
  { id: "reclining_seats", label: "Sièges inclinables" },
  { id: "toilet", label: "Toilettes" },
  { id: "luggage_compartment", label: "Compartiment bagages" },
  { id: "wheelchair_accessible", label: "Accessible PMR" },
];

export default function BusFleetManagement() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [buses, setBuses] = useState<BusVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [busForm, setBusForm] = useState({
    plateNumber: "",
    model: "",
    brand: "",
    capacity: "",
    year: "",
    color: "",
    fuelType: "DIESEL",
    status: "ACTIVE",
    totalKm: "",
    insuranceExpiry: new Date(),
    technicalControlExpiry: new Date(),
    lastMaintenance: new Date(),
    nextMaintenance: new Date(),
    features: [] as string[],
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    fuelType: "",
    searchQuery: "",
    maintenanceAlert: false,
  });

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchBuses();
    }
  }, [session]);

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/patron/buses?companyId=${session?.user?.companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setBuses(data);
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la flotte",
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
      const payload = {
        ...busForm,
        capacity: Number.parseInt(busForm.capacity),
        year: Number.parseInt(busForm.year),
        totalKm: Number.parseInt(busForm.totalKm) || 0,
        insuranceExpiry: busForm.insuranceExpiry.toISOString(),
        technicalControlExpiry: busForm.technicalControlExpiry.toISOString(),
        lastMaintenance: busForm.lastMaintenance.toISOString(),
        nextMaintenance: busForm.nextMaintenance.toISOString(),
        companyId: session?.user?.companyId,
      };

      let response;
      if (isEditMode && selectedBus) {
        response = await fetch(`/api/patron/buses/${selectedBus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/patron/buses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast({
          title: "Succès",
          description: isEditMode
            ? "Bus modifié avec succès"
            : "Bus ajouté avec succès",
        });
        fetchBuses();
        resetForm();
        setIsDialogOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'opération");
      }
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

  const editBus = (bus: BusVehicle) => {
    setSelectedBus(bus);
    setIsEditMode(true);
    setBusForm({
      plateNumber: bus.plateNumber,
      model: bus.model,
      brand: bus.brand,
      capacity: bus.capacity.toString(),
      year: bus.year.toString(),
      color: bus.color,
      fuelType: bus.fuelType,
      status: bus.status,
      totalKm: bus.totalKm.toString(),
      insuranceExpiry: new Date(bus.insuranceExpiry),
      technicalControlExpiry: new Date(bus.technicalControlExpiry),
      lastMaintenance: new Date(bus.lastMaintenance),
      nextMaintenance: new Date(bus.nextMaintenance),
      features: bus.features || [],
    });
    setIsDialogOpen(true);
  };

  const deleteBus = async (busId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bus ?")) return;

    try {
      const response = await fetch(`/api/patron/buses/${busId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Bus supprimé avec succès",
        });
        fetchBuses();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
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
    setBusForm({
      plateNumber: "",
      model: "",
      brand: "",
      capacity: "",
      year: "",
      color: "",
      fuelType: "DIESEL",
      status: "ACTIVE",
      totalKm: "",
      insuranceExpiry: new Date(),
      technicalControlExpiry: new Date(),
      lastMaintenance: new Date(),
      nextMaintenance: new Date(),
      features: [],
    });
    setSelectedBus(null);
    setIsEditMode(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = BUS_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const isMaintenanceDue = (nextMaintenance: string) => {
    const maintenanceDate = new Date(nextMaintenance);
    const today = new Date();
    const daysUntilMaintenance = Math.ceil(
      (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilMaintenance <= 30;
  };

  const isDocumentExpiring = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 60;
  };

  const toggleFeature = (featureId: string) => {
    setBusForm((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f) => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const filteredBuses = buses.filter((bus) => {
    if (filters.status && bus.status !== filters.status) return false;
    if (filters.fuelType && bus.fuelType !== filters.fuelType) return false;
    if (filters.maintenanceAlert && !isMaintenanceDue(bus.nextMaintenance))
      return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        bus.plateNumber.toLowerCase().includes(query) ||
        bus.model.toLowerCase().includes(query) ||
        bus.brand.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const maintenanceAlerts = buses.filter((bus) =>
    isMaintenanceDue(bus.nextMaintenance)
  ).length;
  const documentAlerts = buses.filter(
    (bus) =>
      isDocumentExpiring(bus.insuranceExpiry) ||
      isDocumentExpiring(bus.technicalControlExpiry)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion de la flotte
          </h1>
          <p className="text-gray-600">
            Gérez vos véhicules et leur maintenance
          </p>
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
              Ajouter un bus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier le bus" : "Ajouter un nouveau bus"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plateNumber">
                    Numéro d'immatriculation *
                  </Label>
                  <Input
                    id="plateNumber"
                    value={busForm.plateNumber}
                    onChange={(e) =>
                      setBusForm((prev) => ({
                        ...prev,
                        plateNumber: e.target.value,
                      }))
                    }
                    placeholder="Ex: AB-123-CD"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Marque *</Label>
                  <Input
                    id="brand"
                    value={busForm.brand}
                    onChange={(e) =>
                      setBusForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="Ex: Mercedes, Volvo, Scania"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Modèle *</Label>
                  <Input
                    id="model"
                    value={busForm.model}
                    onChange={(e) =>
                      setBusForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Ex: Sprinter, Tourismo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="year">Année *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={busForm.year}
                    onChange={(e) =>
                      setBusForm((prev) => ({ ...prev, year: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Capacité (places) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={busForm.capacity}
                    onChange={(e) =>
                      setBusForm((prev) => ({
                        ...prev,
                        capacity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    value={busForm.color}
                    onChange={(e) =>
                      setBusForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    placeholder="Ex: Blanc, Bleu"
                  />
                </div>

                <div>
                  <Label htmlFor="fuelType">Type de carburant *</Label>
                  <Select
                    value={busForm.fuelType}
                    onValueChange={(value) =>
                      setBusForm((prev) => ({ ...prev, fuelType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((fuel) => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {fuel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={busForm.status}
                    onValueChange={(value) =>
                      setBusForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUS_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kilométrage */}
              <div>
                <Label htmlFor="totalKm">Kilométrage total</Label>
                <Input
                  id="totalKm"
                  type="number"
                  min="0"
                  value={busForm.totalKm}
                  onChange={(e) =>
                    setBusForm((prev) => ({ ...prev, totalKm: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>

              {/* Dates importantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Assurance (expiration)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(busForm.insuranceExpiry, "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={busForm.insuranceExpiry}
                        onSelect={(date) =>
                          date &&
                          setBusForm((prev) => ({
                            ...prev,
                            insuranceExpiry: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Contrôle technique (expiration)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(
                          busForm.technicalControlExpiry,
                          "dd MMMM yyyy",
                          { locale: fr }
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={busForm.technicalControlExpiry}
                        onSelect={(date) =>
                          date &&
                          setBusForm((prev) => ({
                            ...prev,
                            technicalControlExpiry: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Dernière maintenance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(busForm.lastMaintenance, "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={busForm.lastMaintenance}
                        onSelect={(date) =>
                          date &&
                          setBusForm((prev) => ({
                            ...prev,
                            lastMaintenance: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Prochaine maintenance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(busForm.nextMaintenance, "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={busForm.nextMaintenance}
                        onSelect={(date) =>
                          date &&
                          setBusForm((prev) => ({
                            ...prev,
                            nextMaintenance: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Équipements */}
              <div>
                <Label>Équipements et services</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {BUS_FEATURES.map((feature) => (
                    <Button
                      key={feature.id}
                      type="button"
                      variant={
                        busForm.features.includes(feature.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleFeature(feature.id)}
                      className="justify-start"
                    >
                      {feature.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting
                    ? "Enregistrement..."
                    : isEditMode
                    ? "Mettre à jour"
                    : "Ajouter le bus"}
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

      {/* Alerts */}
      {(maintenanceAlerts > 0 || documentAlerts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintenanceAlerts > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Maintenance requise
                    </p>
                    <p className="text-sm text-yellow-700">
                      {maintenanceAlerts} véhicule(s) nécessitent une
                      maintenance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {documentAlerts > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      Documents expirant
                    </p>
                    <p className="text-sm text-red-700">
                      {documentAlerts} véhicule(s) ont des documents expirant
                      bientôt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher par immatriculation, marque ou modèle..."
                  className="pl-8"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                />
              </div>
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
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {BUS_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.fuelType}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, fuelType: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type de carburant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les carburants</SelectItem>
                {FUEL_TYPES.map((fuel) => (
                  <SelectItem key={fuel.value} value={fuel.value}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={filters.maintenanceAlert ? "default" : "outline"}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  maintenanceAlert: !prev.maintenanceAlert,
                }))
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Maintenance due
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bus List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuses.map((bus) => (
          <Card key={bus.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{bus.plateNumber}</CardTitle>
                </div>
                {getStatusBadge(bus.status)}
              </div>
              <p className="text-sm text-gray-600">
                {bus.brand} {bus.model} ({bus.year})
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{bus.capacity} places</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-gray-400" />
                  <span>
                    {FUEL_TYPES.find((f) => f.value === bus.fuelType)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{bus.totalKm.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span>{bus.color}</span>
                </div>
              </div>

              {/* Alerts */}
              <div className="space-y-2">
                {isMaintenanceDue(bus.nextMaintenance) && (
                  <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                    <Wrench className="h-4 w-4" />
                    <span className="text-xs">Maintenance due</span>
                  </div>
                )}

                {isDocumentExpiring(bus.insuranceExpiry) && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Assurance expire bientôt</span>
                  </div>
                )}

                {isDocumentExpiring(bus.technicalControlExpiry) && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">
                      Contrôle technique expire bientôt
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              {bus.features && bus.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {bus.features.slice(0, 3).map((featureId) => {
                    const feature = BUS_FEATURES.find(
                      (f) => f.id === featureId
                    );
                    return (
                      <Badge
                        key={featureId}
                        variant="outline"
                        className="text-xs"
                      >
                        {feature?.label}
                      </Badge>
                    );
                  })}
                  {bus.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{bus.features.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editBus(bus)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteBus(bus.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBuses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {buses.length === 0
                ? "Aucun bus dans votre flotte"
                : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-4">
              {buses.length === 0
                ? "Commencez par ajouter votre premier véhicule"
                : "Aucun bus ne correspond à vos critères de recherche"}
            </p>
            {buses.length === 0 && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bus
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
