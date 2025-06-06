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
import { Textarea } from "@/components/ui/textarea";
import {
  RouteIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  Globe,
  Flag,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AFRICAN_COUNTRIES,
  getCitiesByCountryCode,
} from "@/constants/countries";

interface RouteData {
  id: string;
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry: string;
  arrivalCountry: string;
  distance: number;
  estimatedDuration: number;
  price: number;
  description?: string;
  isInternational: boolean;
  status: string;
  stops: RouteStop[];
  totalTrips: number;
  createdAt: string;
}

interface RouteStop {
  id: string;
  name: string;
  country: string;
  city: string;
  order: number;
  estimatedArrival: number; // minutes from start
}

const ROUTE_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "INACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  {
    value: "MAINTENANCE",
    label: "En maintenance",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "SUSPENDED", label: "Suspendue", color: "bg-red-100 text-red-800" },
];

export default function RouteManagement() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [routeForm, setRouteForm] = useState({
    name: "",
    departureLocation: "",
    arrivalLocation: "",
    departureCountry: "",
    arrivalCountry: "",
    distance: "",
    estimatedDuration: "",
    price: "",
    description: "",
    status: "ACTIVE",
    stops: [] as RouteStop[],
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    isInternational: "",
    searchQuery: "",
  });

  const [departureCountryCities, setDepartureCountryCities] = useState<
    string[]
  >([]);
  const [arrivalCountryCities, setArrivalCountryCities] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchRoutes();
    }
  }, [session]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/patron/routes?companyId=${session?.user?.companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les routes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartureCountryChange = (countryCode: string) => {
    const cities = getCitiesByCountryCode(countryCode);
    setDepartureCountryCities(cities.map((city) => city.name));
    setRouteForm((prev) => ({
      ...prev,
      departureCountry: countryCode,
      departureLocation: "",
    }));
  };

  const handleArrivalCountryChange = (countryCode: string) => {
    const cities = getCitiesByCountryCode(countryCode);
    setArrivalCountryCities(cities.map((city) => city.name));
    setRouteForm((prev) => ({
      ...prev,
      arrivalCountry: countryCode,
      arrivalLocation: "",
    }));
  };

  const addStop = () => {
    const newStop: RouteStop = {
      id: `temp-${Date.now()}`,
      name: "",
      country: "",
      city: "",
      order: routeForm.stops.length + 1,
      estimatedArrival: 0,
    };
    setRouteForm((prev) => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));
  };

  const updateStop = (
    index: number,
    field: keyof RouteStop,
    value: string | number
  ) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) =>
        i === index ? { ...stop, [field]: value } : stop
      ),
    }));
  };

  const removeStop = (index: number) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops
        .filter((_, i) => i !== index)
        .map((stop, i) => ({
          ...stop,
          order: i + 1,
        })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isInternational =
        routeForm.departureCountry !== routeForm.arrivalCountry;

      const payload = {
        ...routeForm,
        distance: Number.parseFloat(routeForm.distance) || 0,
        estimatedDuration: Number.parseInt(routeForm.estimatedDuration) || 0,
        price: Number.parseFloat(routeForm.price),
        isInternational,
        companyId: session?.user?.companyId,
      };

      let response;
      if (isEditMode && selectedRoute) {
        response = await fetch(`/api/patron/routes/${selectedRoute.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/patron/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast({
          title: "Succès",
          description: isEditMode
            ? "Route modifiée avec succès"
            : "Route créée avec succès",
        });
        fetchRoutes();
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

  const editRoute = (route: RouteData) => {
    setSelectedRoute(route);
    setIsEditMode(true);
    setRouteForm({
      name: route.name,
      departureLocation: route.departureLocation,
      arrivalLocation: route.arrivalLocation,
      departureCountry: route.departureCountry,
      arrivalCountry: route.arrivalCountry,
      distance: route.distance.toString(),
      estimatedDuration: route.estimatedDuration.toString(),
      price: route.price.toString(),
      description: route.description || "",
      status: route.status,
      stops: route.stops || [],
    });

    // Load cities for selected countries
    if (route.departureCountry) {
      const cities = getCitiesByCountryCode(route.departureCountry);
      setDepartureCountryCities(cities.map((city) => city.name));
    }
    if (route.arrivalCountry) {
      const cities = getCitiesByCountryCode(route.arrivalCountry);
      setArrivalCountryCities(cities.map((city) => city.name));
    }

    setIsDialogOpen(true);
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette route ?")) return;

    try {
      const response = await fetch(`/api/patron/routes/${routeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Route supprimée avec succès",
        });
        fetchRoutes();
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
    setRouteForm({
      name: "",
      departureLocation: "",
      arrivalLocation: "",
      departureCountry: "",
      arrivalCountry: "",
      distance: "",
      estimatedDuration: "",
      price: "",
      description: "",
      status: "ACTIVE",
      stops: [],
    });
    setSelectedRoute(null);
    setIsEditMode(false);
    setDepartureCountryCities([]);
    setArrivalCountryCities([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ROUTE_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getCountryFlag = (countryCode: string) => {
    const country = AFRICAN_COUNTRIES.find((c) => c.code === countryCode);
    return country?.flag || "🏳️";
  };

  const getCountryName = (countryCode: string) => {
    const country = AFRICAN_COUNTRIES.find((c) => c.code === countryCode);
    return country?.name || countryCode;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
      : `${mins}min`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const filteredRoutes = routes.filter((route) => {
    if (filters.status && route.status !== filters.status) return false;
    if (
      filters.isInternational !== "" &&
      route.isInternational.toString() !== filters.isInternational
    )
      return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        route.name.toLowerCase().includes(query) ||
        route.departureLocation.toLowerCase().includes(query) ||
        route.arrivalLocation.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des routes
          </h1>
          <p className="text-gray-600">
            Créez et gérez vos itinéraires de transport
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
              Créer une route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier la route" : "Créer une nouvelle route"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la route *</Label>
                  <Input
                    id="name"
                    value={routeForm.name}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: Abidjan - Bouaké Express"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={routeForm.description}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Décrivez cette route, ses particularités..."
                    className="resize-none h-20"
                  />
                </div>
              </div>

              {/* Départ et Arrivée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Point de départ
                  </h3>

                  <div>
                    <Label>Pays de départ *</Label>
                    <Select
                      value={routeForm.departureCountry}
                      onValueChange={handleDepartureCountryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ville de départ *</Label>
                    <Select
                      value={routeForm.departureLocation}
                      onValueChange={(value) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          departureLocation: value,
                        }))
                      }
                      disabled={!routeForm.departureCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {departureCountryCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-600" />
                    Point d'arrivée
                  </h3>

                  <div>
                    <Label>Pays d'arrivée *</Label>
                    <Select
                      value={routeForm.arrivalCountry}
                      onValueChange={handleArrivalCountryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ville d'arrivée *</Label>
                    <Select
                      value={routeForm.arrivalLocation}
                      onValueChange={(value) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          arrivalLocation: value,
                        }))
                      }
                      disabled={!routeForm.arrivalCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {arrivalCountryCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Détails du voyage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    min="0"
                    step="0.1"
                    value={routeForm.distance}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        distance: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">
                    Durée estimée (minutes) *
                  </Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="1"
                    value={routeForm.estimatedDuration}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        estimatedDuration: e.target.value,
                      }))
                    }
                    placeholder="120"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Prix (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={routeForm.price}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="5000"
                    required
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <Label htmlFor="status">Statut *</Label>
                <Select
                  value={routeForm.status}
                  onValueChange={(value) =>
                    setRouteForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Arrêts intermédiaires */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Arrêts intermédiaires (optionnel)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStop}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un arrêt
                  </Button>
                </div>

                {routeForm.stops.map((stop, index) => (
                  <Card key={stop.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <Label>Nom de l'arrêt</Label>
                          <Input
                            value={stop.name}
                            onChange={(e) =>
                              updateStop(index, "name", e.target.value)
                            }
                            placeholder="Ex: Gare routière"
                          />
                        </div>
                        <div>
                          <Label>Pays</Label>
                          <Select
                            value={stop.country}
                            onValueChange={(value) =>
                              updateStop(index, "country", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pays" />
                            </SelectTrigger>
                            <SelectContent>
                              {AFRICAN_COUNTRIES.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Ville</Label>
                          <Input
                            value={stop.city}
                            onChange={(e) =>
                              updateStop(index, "city", e.target.value)
                            }
                            placeholder="Ville"
                          />
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeStop(index)}
                            className="w-full"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Aperçu */}
              {routeForm.departureLocation && routeForm.arrivalLocation && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Aperçu de la route
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      {getCountryFlag(routeForm.departureCountry)}
                      {routeForm.departureLocation}
                    </span>
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="flex items-center gap-1">
                      {getCountryFlag(routeForm.arrivalCountry)}
                      {routeForm.arrivalLocation}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                    {routeForm.distance && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {routeForm.distance} km
                      </span>
                    )}
                    {routeForm.estimatedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(
                          Number.parseInt(routeForm.estimatedDuration)
                        )}
                      </span>
                    )}
                    {routeForm.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(Number.parseFloat(routeForm.price))}
                      </span>
                    )}
                    {routeForm.departureCountry !==
                      routeForm.arrivalCountry && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Globe className="h-3 w-3 mr-1" />
                        International
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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
                    : "Créer la route"}
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
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher par nom, ville de départ ou d'arrivée..."
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
                <SelectItem value="">Tous les statuts</SelectItem>
                {ROUTE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.isInternational}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, isInternational: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type de route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les routes</SelectItem>
                <SelectItem value="true">Internationales</SelectItem>
                <SelectItem value="false">Nationales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map((route) => (
          <Card key={route.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RouteIcon className="h-5 w-5 text-blue-600" />
                  {route.name}
                </CardTitle>
                {getStatusBadge(route.status)}
              </div>
              {route.isInternational && (
                <Badge className="bg-purple-100 text-purple-800 w-fit">
                  <Globe className="h-3 w-3 mr-1" />
                  International
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Itinéraire */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="flex items-center gap-1">
                    {getCountryFlag(route.departureCountry)}
                    {route.departureLocation}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Flag className="h-4 w-4 text-red-600" />
                  <span className="flex items-center gap-1">
                    {getCountryFlag(route.arrivalCountry)}
                    {route.arrivalLocation}
                  </span>
                </div>
              </div>

              {/* Détails */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatDuration(route.estimatedDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{formatCurrency(route.price)}</span>
                </div>
                {route.distance > 0 && (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-400" />
                    <span>{route.distance} km</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-4 w-4 text-gray-400" />
                  <span>{route.totalTrips} voyage(s)</span>
                </div>
              </div>

              {/* Description */}
              {route.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {route.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editRoute(route)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteRoute(route.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <RouteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {routes.length === 0 ? "Aucune route créée" : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-4">
              {routes.length === 0
                ? "Commencez par créer votre première route"
                : "Aucune route ne correspond à vos critères de recherche"}
            </p>
            {routes.length === 0 && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une route
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
