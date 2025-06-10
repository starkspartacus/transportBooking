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
import { toast } from "@/components/ui/use-toast";
import type { Route } from "@/lib/types";
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
} from "lucide-react";

interface RouteManagementProps {
  companyId: string;
}

export default function RouteManagement({ companyId }: RouteManagementProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, [companyId]);

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
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Route
        </Button>
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
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
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
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-50 hover:border-green-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
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
      </div>
    </div>
  );
}
