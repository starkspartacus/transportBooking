"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/use-toast";
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
import type { Route } from "@/lib/types";
import { AFRICAN_COUNTRIES, getCountryNames } from "@/constants/countries";
import {
  Plus,
  MapPin,
  RouteIcon,
  Globe,
  Navigation,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  Map,
  Timer,
  CreditCard,
  FileText,
  Settings,
  Loader2,
} from "lucide-react";

const COUNTRIES = getCountryNames();
const CITIES_BY_COUNTRY: Record<string, string[]> = {};

// Initialiser le dictionnaire des villes par pays
AFRICAN_COUNTRIES.forEach((country) => {
  CITIES_BY_COUNTRY[country.name] = country.cities.map((city) => city.name);
});

interface RouteManagementProps {
  companyId: string;
}

interface RouteFormData {
  name: string;
  description: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry: string;
  arrivalCountry: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  isInternational: boolean;
  status: string;
}

const initialFormData: RouteFormData = {
  name: "",
  description: "",
  departureLocation: "",
  arrivalLocation: "",
  departureCountry: "Côte d'Ivoire",
  arrivalCountry: "Côte d'Ivoire",
  distance: 0,
  estimatedDuration: 0,
  basePrice: 0,
  isInternational: false,
  status: "ACTIVE",
};

export default function RouteManagement({ companyId }: RouteManagementProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [companyId]);

  // Auto-detect international route
  useEffect(() => {
    if (formData.departureCountry !== formData.arrivalCountry) {
      setFormData((prev) => ({ ...prev, isInternational: true }));
    } else {
      setFormData((prev) => ({ ...prev, isInternational: false }));
    }
  }, [formData.departureCountry, formData.arrivalCountry]);

  const fetchRoutes = async () => {
    if (!companyId) {
      console.error("Company ID is required");
      setRoutes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/routes?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        console.error("Error fetching routes:", errorData);
        toast({
          title: "❌ Erreur",
          description: errorData.error || "Impossible de charger les routes",
          variant: "destructive",
        });
        setRoutes([]);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du chargement des routes",
        variant: "destructive",
      });
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    if (
      !formData.name ||
      !formData.departureLocation ||
      !formData.arrivalLocation
    ) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/patron/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          origin: formData.departureLocation,
          destination: formData.arrivalLocation,
          companyId,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Route créée avec succès",
        });
        setIsCreateDialogOpen(false);
        setFormData(initialFormData);
        fetchRoutes();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la création de la route",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating route:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la création de la route",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoute = async () => {
    if (
      !selectedRoute ||
      !formData.name ||
      !formData.departureLocation ||
      !formData.arrivalLocation
    ) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/patron/routes/${selectedRoute.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          origin: formData.departureLocation,
          destination: formData.arrivalLocation,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Route modifiée avec succès",
        });
        setIsEditDialogOpen(false);
        setSelectedRoute(null);
        setFormData(initialFormData);
        fetchRoutes();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la modification de la route",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating route:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la modification de la route",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (route: Route) => {
    try {
      const response = await fetch(`/api/patron/routes/${route.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Route supprimée avec succès",
        });
        fetchRoutes();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Erreur",
          description:
            errorData.error || "Erreur lors de la suppression de la route",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la suppression de la route",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
      departureLocation: route.departureLocation,
      arrivalLocation: route.arrivalLocation,
      departureCountry: route.departureCountry || "Côte d'Ivoire",
      arrivalCountry: route.arrivalCountry || "Côte d'Ivoire",
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      basePrice: route.basePrice,
      isInternational: route.isInternational,
      status: route.status,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (route: Route) => {
    setSelectedRoute(route);
    setIsViewDialogOpen(true);
  };

  const RouteForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informations générales */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Informations générales
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <RouteIcon className="h-4 w-4 text-blue-600" />
              <span>Nom de la route *</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Abidjan - Accra Express"
              className="border-gray-300 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span>Statut</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Actif</span>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Inactif</span>
                  </div>
                </SelectItem>
                <SelectItem value="MAINTENANCE">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Maintenance</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-600" />
            <span>Description</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description de la route..."
            className="border-gray-300 focus:border-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Itinéraire */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Map className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Itinéraire</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="departureCountry"
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Pays de départ</span>
            </Label>
            <Select
              value={formData.departureCountry}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  departureCountry: value,
                  departureLocation: "", // Reset city when country changes
                });
              }}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span>{country}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="arrivalCountry"
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4 text-purple-600" />
              <span>Pays d'arrivée</span>
            </Label>
            <Select
              value={formData.arrivalCountry}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  arrivalCountry: value,
                  arrivalLocation: "", // Reset city when country changes
                });
              }}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span>{country}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="departureLocation"
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Ville de départ *</span>
            </Label>
            <Select
              value={formData.departureLocation}
              onValueChange={(value) =>
                setFormData({ ...formData, departureLocation: value })
              }
              disabled={!formData.departureCountry}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue
                  placeholder={
                    formData.departureCountry
                      ? "Sélectionnez une ville"
                      : "Sélectionnez d'abord un pays"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {formData.departureCountry &&
                  CITIES_BY_COUNTRY[formData.departureCountry]?.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{city}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="arrivalLocation"
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4 text-red-600" />
              <span>Ville d'arrivée *</span>
            </Label>
            <Select
              value={formData.arrivalLocation}
              onValueChange={(value) =>
                setFormData({ ...formData, arrivalLocation: value })
              }
              disabled={!formData.arrivalCountry}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue
                  placeholder={
                    formData.arrivalCountry
                      ? "Sélectionnez une ville"
                      : "Sélectionnez d'abord un pays"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {formData.arrivalCountry &&
                  CITIES_BY_COUNTRY[formData.arrivalCountry]?.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{city}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <Switch
            checked={formData.isInternational}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isInternational: checked })
            }
          />
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-purple-600" />
            <Label className="text-sm font-medium">Route internationale</Label>
          </div>
          {formData.departureCountry !== formData.arrivalCountry && (
            <div className="ml-auto">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Détecté automatiquement
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Détails du voyage */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Settings className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Détails du voyage
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="distance" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span>Distance (km) *</span>
            </Label>
            <Input
              id="distance"
              type="number"
              value={formData.distance}
              onChange={(e) =>
                setFormData({ ...formData, distance: Number(e.target.value) })
              }
              placeholder="520"
              className="border-gray-300 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="estimatedDuration"
              className="flex items-center space-x-2"
            >
              <Timer className="h-4 w-4 text-green-600" />
              <span>Durée (minutes) *</span>
            </Label>
            <Input
              id="estimatedDuration"
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedDuration: Number(e.target.value),
                })
              }
              placeholder="360"
              className="border-gray-300 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span>Prix de base (FCFA) *</span>
            </Label>
            <Input
              id="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={(e) =>
                setFormData({ ...formData, basePrice: Number(e.target.value) })
              }
              placeholder="12000"
              className="border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Aperçu des calculs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Durée estimée
              </span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {Math.floor(formData.estimatedDuration / 60)}h{" "}
              {formData.estimatedDuration % 60}min
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Navigation className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Vitesse moyenne
              </span>
            </div>
            <p className="text-lg font-bold text-purple-600">
              {formData.distance && formData.estimatedDuration
                ? Math.round(
                    (formData.distance / formData.estimatedDuration) * 60
                  )
                : 0}{" "}
              km/h
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Prix par km
              </span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formData.distance && formData.basePrice
                ? Math.round(formData.basePrice / formData.distance)
                : 0}{" "}
              FCFA/km
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const RouteDetails = ({ route }: { route: Route }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Informations générales</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <RouteIcon className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Nom:</span>
              <span>{route.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="font-medium">Statut:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  route.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : route.status === "INACTIVE"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {route.status === "ACTIVE"
                  ? "Actif"
                  : route.status === "INACTIVE"
                  ? "Inactif"
                  : "Maintenance"}
              </span>
            </div>
            {route.description && (
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-gray-600 mt-1" />
                <span className="font-medium">Description:</span>
                <span className="text-gray-600">{route.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Map className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Itinéraire</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium">Départ:</span>
              <span>
                {route.departureLocation}, {route.departureCountry}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-red-600" />
              <span className="font-medium">Arrivée:</span>
              <span>
                {route.arrivalLocation}, {route.arrivalCountry}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Type:</span>
              <span>
                {route.isInternational ? "International" : "National"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Distance</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {route.distance} km
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Durée</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {Math.floor(route.estimatedDuration / 60)}h{" "}
            {route.estimatedDuration % 60}min
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-800">Prix</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {route.basePrice.toLocaleString()} FCFA
          </p>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Voyages</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {route.totalTrips || 0}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestion des Routes
            </h2>
            <p className="text-gray-600">Gérez vos itinéraires et trajets</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Créer une nouvelle route</span>
              </DialogTitle>
            </DialogHeader>
            <RouteForm />
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData(initialFormData);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleCreateRoute}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Création..." : "Créer la route"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Routes Actives</p>
              <p className="text-2xl font-bold">
                {routes.filter((r) => r.status === "ACTIVE").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Routes</p>
              <p className="text-2xl font-bold">{routes.length}</p>
            </div>
            <RouteIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Internationales</p>
              <p className="text-2xl font-bold">
                {routes.filter((r) => r.isInternational).length}
              </p>
            </div>
            <Globe className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Distance Totale</p>
              <p className="text-2xl font-bold">
                {routes.reduce((sum, r) => sum + (r.distance || 0), 0)} km
              </p>
            </div>
            <Navigation className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Chargement des routes...</span>
            </div>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune route trouvée
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre première route
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une Route
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <RouteIcon className="h-4 w-4" />
                    <span>Route</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Trajet</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4" />
                    <span>Distance</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Durée</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Prix</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Statut</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Voyages</span>
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow
                  key={route.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          route.isInternational
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {route.isInternational ? (
                          <Globe
                            className={`h-4 w-4 ${
                              route.isInternational
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                        ) : (
                          <MapPin className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {route.name}
                        </p>
                        {route.description && (
                          <p className="text-sm text-gray-500">
                            {route.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">
                        {route.departureLocation}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {route.arrivalLocation}
                      </span>
                    </div>
                    {route.isInternational && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {route.departureCountry}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {route.arrivalCountry}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{route.distance} km</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {Math.floor(route.estimatedDuration / 60)}h{" "}
                        {route.estimatedDuration % 60}min
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        {route.basePrice.toLocaleString()} FCFA
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        route.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : route.status === "INACTIVE"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {route.status === "ACTIVE" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {route.status === "INACTIVE" && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {route.status === "MAINTENANCE" && (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {route.status === "ACTIVE"
                        ? "Actif"
                        : route.status === "INACTIVE"
                        ? "Inactif"
                        : "Maintenance"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        {route.totalTrips || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(route)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(route)}
                        className="hover:bg-green-50 hover:border-green-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer la route
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer la route "
                              {route.name}" ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRoute(route)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-green-600" />
              <span>Modifier la route</span>
            </DialogTitle>
          </DialogHeader>
          <RouteForm isEdit />
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedRoute(null);
                setFormData(initialFormData);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleEditRoute}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Modification..." : "Modifier la route"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Détails de la route</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRoute && <RouteDetails route={selectedRoute} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
