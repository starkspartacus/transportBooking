"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  RouteIcon,
  Globe,
  Calculator,
  Navigation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ALL_COUNTRIES } from "@/constants/countries";
import {
  calculateRoute,
  calculateEstimatedPrice,
  calculateEstimatedDuration,
  formatDuration,
} from "@/lib/openstreetmap";

interface Route {
  id: string;
  name: string;
  description?: string;
  departureCountry: string;
  departureCity: string;
  arrivalCountry: string;
  arrivalCity: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  isInternational: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface RouteFormData {
  name: string;
  description: string;
  departureCountry: string;
  departureCity: string;
  arrivalCountry: string;
  arrivalCity: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  isInternational: boolean;
  status: "ACTIVE" | "INACTIVE";
}

const initialFormData: RouteFormData = {
  name: "",
  description: "",
  departureCountry: "CI",
  departureCity: "",
  arrivalCountry: "CI",
  arrivalCity: "",
  distance: 0,
  estimatedDuration: 0,
  basePrice: 0,
  isInternational: false,
  status: "ACTIVE",
};

interface EnhancedRouteManagementProps {
  companyId: string;
}

export default function EnhancedRouteManagement({
  companyId,
}: EnhancedRouteManagementProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Get cities for selected country
  const getDepartureCities = useCallback(() => {
    const country = ALL_COUNTRIES.find(
      (c) => c.code === formData.departureCountry
    );
    return country?.cities || [];
  }, [formData.departureCountry]);

  const getArrivalCities = useCallback(() => {
    const country = ALL_COUNTRIES.find(
      (c) => c.code === formData.arrivalCountry
    );
    return country?.cities || [];
  }, [formData.arrivalCountry]);

  // Auto-calculate route when cities change
  const handleCityChange = useCallback(
    async (field: "departureCity" | "arrivalCity", value: string) => {
      console.log(`Selecting ${field}:`, value);
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Auto-calculate if both cities are selected
      if (
        (field === "departureCity" && value && formData.arrivalCity) ||
        (field === "arrivalCity" && value && formData.departureCity)
      ) {
        const departureCity =
          field === "departureCity" ? value : formData.departureCity;
        const arrivalCity =
          field === "arrivalCity" ? value : formData.arrivalCity;

        console.log("Auto-calculating route for:", {
          departureCity,
          arrivalCity,
        });
        await calculateRouteData(departureCity, arrivalCity);
      }
    },
    [formData.departureCity, formData.arrivalCity]
  );

  const calculateRouteData = async (
    departureCity: string,
    arrivalCity: string
  ) => {
    if (!departureCity || !arrivalCity) return;

    setCalculating(true);
    try {
      const departureCountryName =
        ALL_COUNTRIES.find((c) => c.code === formData.departureCountry)?.name ||
        "";
      const arrivalCountryName =
        ALL_COUNTRIES.find((c) => c.code === formData.arrivalCountry)?.name ||
        "";

      const routeData = await calculateRoute(
        departureCity,
        arrivalCity,
        departureCountryName,
        arrivalCountryName
      );

      if (routeData) {
        const distanceKm = Math.round(routeData.distance / 1000);
        const estimatedDuration = calculateEstimatedDuration(
          routeData.duration,
          formData.isInternational
        );
        const estimatedPrice = calculateEstimatedPrice(distanceKm);

        setFormData((prev) => ({
          ...prev,
          distance: distanceKm,
          estimatedDuration,
          basePrice: estimatedPrice,
          name: prev.name || `${departureCity} - ${arrivalCity}`,
        }));

        toast.success(
          `Route calculée: ${distanceKm} km, ${formatDuration(
            estimatedDuration
          )}`
        );
      } else {
        toast.error("Impossible de calculer la route automatiquement");
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      toast.error("Erreur lors du calcul de la route");
    } finally {
      setCalculating(false);
    }
  };

  const handleInputChange = useCallback(
    (field: keyof RouteFormData, value: string | number | boolean) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Auto-detect international route
        if (field === "departureCountry" || field === "arrivalCountry") {
          newData.isInternational =
            newData.departureCountry !== newData.arrivalCountry;

          // Reset cities when country changes
          if (field === "departureCountry") {
            newData.departureCity = "";
          } else {
            newData.arrivalCity = "";
          }
        }

        return newData;
      });
    },
    []
  );

  // Memoized calculations
  const calculations = useCallback(() => {
    if (formData.distance > 0 && formData.estimatedDuration > 0) {
      const avgSpeed = (
        formData.distance /
        (formData.estimatedDuration / 60)
      ).toFixed(1);
      const pricePerKm =
        formData.basePrice > 0
          ? (formData.basePrice / formData.distance).toFixed(0)
          : "0";
      return { avgSpeed, pricePerKm };
    }
    return { avgSpeed: "0", pricePerKm: "0" };
  }, [formData.distance, formData.estimatedDuration, formData.basePrice]);

  const { avgSpeed, pricePerKm } = calculations();

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Reset cities when countries change
  useEffect(() => {
    setFormData((prev) => ({ ...prev, departureCity: "" }));
  }, [formData.departureCountry]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, arrivalCity: "" }));
  }, [formData.arrivalCountry]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`/api/patron/routes?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(data || []);
      } else {
        toast.error("Erreur lors du chargement des routes");
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.departureCity.trim() ||
      !formData.arrivalCity.trim()
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingRoute
        ? `/api/patron/routes/${editingRoute.id}`
        : "/api/patron/routes";
      const method = editingRoute ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId,
          origin: formData.departureCity,
          destination: formData.arrivalCity,
        }),
      });

      if (response.ok) {
        toast.success(
          editingRoute
            ? "Route modifiée avec succès"
            : "Route créée avec succès"
        );
        setIsDialogOpen(false);
        setEditingRoute(null);
        setFormData(initialFormData);
        fetchRoutes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
      departureCountry: route.departureCountry,
      departureCity: route.departureCity,
      arrivalCountry: route.arrivalCountry,
      arrivalCity: route.arrivalCity,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      basePrice: route.basePrice,
      isInternational: route.isInternational,
      status: route.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette route ?")) return;

    try {
      const response = await fetch(`/api/patron/routes/${routeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Route supprimée avec succès");
        fetchRoutes();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error("Erreur de connexion");
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingRoute(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Routes</h2>
          <p className="text-gray-600">
            Gérez les itinéraires de vos voyages avec calcul automatique
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
            <Button className="bg-gradient-to-r from-blue-600 to-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Créer une nouvelle route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                {editingRoute
                  ? "Modifier la route"
                  : "Créer une nouvelle route"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la route **</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Ex: Abidjan - Bouaké"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Actif
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Inactif
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Description de la route..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Itinerary with Auto-calculation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Itinéraire
                    {calculating && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Departure */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Pays de départ
                      </h4>
                      <Select
                        value={formData.departureCountry}
                        onValueChange={(value) =>
                          handleInputChange("departureCountry", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div>
                        <Label htmlFor="departureCity">Ville de départ *</Label>
                        <Select
                          value={formData.departureCity}
                          onValueChange={(value) =>
                            handleCityChange("departureCity", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une ville" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDepartureCities().length > 0 ? (
                              getDepartureCities().map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  <MapPin className="h-4 w-4 mr-2 inline" />
                                  {city.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                Aucune ville disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Pays d'arrivée
                      </h4>
                      <Select
                        value={formData.arrivalCountry}
                        onValueChange={(value) =>
                          handleInputChange("arrivalCountry", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div>
                        <Label htmlFor="arrivalCity">Ville d'arrivée *</Label>
                        <Select
                          value={formData.arrivalCity}
                          onValueChange={(value) =>
                            handleCityChange("arrivalCity", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une ville" />
                          </SelectTrigger>
                          <SelectContent>
                            {getArrivalCities().length > 0 ? (
                              getArrivalCities().map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  <MapPin className="h-4 w-4 mr-2 inline" />
                                  {city.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                Aucune ville disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Switch
                      checked={formData.isInternational}
                      onCheckedChange={(checked) =>
                        handleInputChange("isInternational", checked)
                      }
                    />
                    <Label>Route internationale</Label>
                    {formData.isInternational && (
                      <Badge variant="secondary" className="ml-2">
                        <Globe className="h-3 w-3 mr-1" />
                        International
                      </Badge>
                    )}
                  </div>

                  {calculating && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                      <span className="text-yellow-800">
                        Calcul de la route en cours...
                      </span>
                    </div>
                  )}

                  {formData.departureCity && formData.arrivalCity && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        calculateRouteData(
                          formData.departureCity,
                          formData.arrivalCity
                        )
                      }
                      disabled={calculating}
                      className="w-full"
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calcul en cours...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Recalculer la route
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Trip Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Détails du voyage
                    <Badge variant="outline" className="ml-2">
                      Auto-calculé
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="distance">Distance (km) *</Label>
                      <Input
                        id="distance"
                        type="number"
                        min="0"
                        value={formData.distance || ""}
                        onChange={(e) =>
                          handleInputChange("distance", Number(e.target.value))
                        }
                        className={calculating ? "bg-yellow-50" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedDuration">
                        Durée (minutes) *
                      </Label>
                      <Input
                        id="estimatedDuration"
                        type="number"
                        min="0"
                        value={formData.estimatedDuration || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "estimatedDuration",
                            Number(e.target.value)
                          )
                        }
                        className={calculating ? "bg-yellow-50" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="basePrice">Prix de base (FCFA) *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        value={formData.basePrice || ""}
                        onChange={(e) =>
                          handleInputChange("basePrice", Number(e.target.value))
                        }
                        className={calculating ? "bg-yellow-50" : ""}
                      />
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">
                          Durée estimée
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formData.estimatedDuration > 0
                          ? formatDuration(formData.estimatedDuration)
                          : "0h 0min"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <RouteIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">
                          Vitesse moyenne
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {avgSpeed} km/h
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Prix par km</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {pricePerKm} FCFA/km
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-green-600"
                  disabled={submitting || calculating}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      {editingRoute ? "Modifier la route" : "Créer la route"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Routes existantes ({routes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8">
              <RouteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune route
              </h3>
              <p className="text-gray-600">
                Créez votre première route pour commencer
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Itinéraire</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{route.name}</div>
                        {route.isInternational && (
                          <Badge variant="secondary" className="mt-1">
                            <Globe className="h-3 w-3 mr-1" />
                            International
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {route.departureCity} → {route.arrivalCity}
                        </div>
                        <div className="text-gray-500">
                          {
                            ALL_COUNTRIES.find(
                              (c) => c.code === route.departureCountry
                            )?.flag
                          }{" "}
                          →{" "}
                          {
                            ALL_COUNTRIES.find(
                              (c) => c.code === route.arrivalCountry
                            )?.flag
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{route.distance} km</TableCell>
                    <TableCell>
                      {formatDuration(route.estimatedDuration)}
                    </TableCell>
                    <TableCell>
                      {route.basePrice.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          route.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {route.status === "ACTIVE" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(route)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
