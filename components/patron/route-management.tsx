"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Route,
  Clock,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  status: string;
  description?: string;
  createdAt: string;
}

const routeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  origin: z.string().min(1, "Ville de départ requise"),
  destination: z.string().min(1, "Ville d'arrivée requise"),
  distance: z.number().min(1, "Distance requise"),
  estimatedDuration: z.number().min(1, "Durée estimée requise"),
  basePrice: z.number().min(0, "Prix de base requis"),
  status: z.string().optional(),
  description: z.string().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function RouteManagement() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  const defaultFormValues = {
    name: "",
    origin: "",
    destination: "",
    distance: 0,
    estimatedDuration: 0,
    basePrice: 0,
    status: "ACTIVE",
    description: "",
  };

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/patron/routes");
      if (response.ok) {
        const data = await response.json();
        setRoutes(Array.isArray(data) ? data : []);
      } else {
        console.error("Error fetching routes:", response.statusText);
        setRoutes([]);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSubmit = useCallback(
    async (data: RouteFormData) => {
      try {
        const response = await fetch("/api/patron/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          toast({
            title: "Route ajoutée",
            description: "La route a été ajoutée avec succès",
          });
          fetchRoutes();
          setShowNewForm(false);
          form.reset(defaultFormValues);
        } else {
          const error = await response.json();
          toast({
            title: "Erreur",
            description: error.error || "Erreur lors de l'ajout de la route",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error creating route:", error);
        toast({
          title: "Erreur",
          description: "Erreur lors de l'ajout de la route",
          variant: "destructive",
        });
      }
    },
    [toast, fetchRoutes, form, defaultFormValues]
  );

  const handleDeleteRoute = useCallback(
    async (routeId: string) => {
      if (!confirm("Êtes-vous sûr de vouloir supprimer cette route ?")) return;

      try {
        const response = await fetch(`/api/patron/routes/${routeId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Route supprimée",
            description: "La route a été supprimée avec succès",
          });
          fetchRoutes();
        } else {
          const error = await response.json();
          toast({
            title: "Erreur",
            description:
              error.error || "Erreur lors de la suppression de la route",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error deleting route:", error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de la route",
          variant: "destructive",
        });
      }
    },
    [toast, fetchRoutes]
  );

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Inactive
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <Route className="h-6 w-6 text-green-600" />
              </div>
              Gestion des routes ({routes.length})
            </CardTitle>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une route
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {showNewForm ? (
            <Card className="mb-6 border-2 border-dashed border-green-200 bg-green-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-green-600" />
                  Nouvelle route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de la route *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Abidjan - Bouaké"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Ville de départ *
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={form.watch("origin") || ""}
                              onChange={(e) =>
                                form.setValue("origin", e.target.value)
                              }
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Abidjan">Abidjan</option>
                              <option value="Bouaké">Bouaké</option>
                              <option value="Yamoussoukro">Yamoussoukro</option>
                              <option value="Korhogo">Korhogo</option>
                              <option value="San-Pédro">San-Pédro</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Ville d'arrivée *
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={form.watch("destination") || ""}
                              onChange={(e) =>
                                form.setValue("destination", e.target.value)
                              }
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Abidjan">Abidjan</option>
                              <option value="Bouaké">Bouaké</option>
                              <option value="Yamoussoukro">Yamoussoukro</option>
                              <option value="Korhogo">Korhogo</option>
                              <option value="San-Pédro">San-Pédro</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="distance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Distance (km) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Distance en kilomètres"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="estimatedDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durée estimée (min) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Durée en minutes"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="basePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prix de base (XOF) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Prix en XOF"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Statut
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={form.watch("status") || "ACTIVE"}
                              onChange={(e) =>
                                form.setValue("status", e.target.value)
                              }
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="MAINTENANCE">Maintenance</option>
                            </select>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Description de la route, points d'arrêt, etc."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewForm(false);
                          form.reset(defaultFormValues);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {form.formState.isSubmitting
                          ? "Ajout en cours..."
                          : "Ajouter la route"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : null}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des routes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-700">
                          {routes.length}
                        </p>
                        <p className="text-sm text-green-600">Total routes</p>
                      </div>
                      <Route className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-blue-700">
                          {
                            routes.filter((route) => route.status === "ACTIVE")
                              .length
                          }
                        </p>
                        <p className="text-sm text-blue-600">Routes actives</p>
                      </div>
                      <MapPin className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-purple-700">
                          {routes.reduce(
                            (total, route) => total + route.distance,
                            0
                          )}
                        </p>
                        <p className="text-sm text-purple-600">Total km</p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-orange-700">
                          {Math.round(
                            routes.reduce(
                              (total, route) => total + route.basePrice,
                              0
                            ) / routes.length
                          ) || 0}
                        </p>
                        <p className="text-sm text-orange-600">Prix moyen</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des routes */}
              {routes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Route className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune route trouvée
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Commencez par ajouter votre première route
                  </p>
                  <Button
                    onClick={() => setShowNewForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une route
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {routes.map((route) => (
                    <Card
                      key={route.id}
                      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {route.name}
                            </h3>
                            {getStatusBadge(route.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRoute(route.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {route.origin} → {route.destination}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {route.distance} km
                              </p>
                              <p className="text-gray-600">Distance</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {Math.round(route.estimatedDuration / 60)}h
                              </p>
                              <p className="text-gray-600">Durée</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-semibold text-gray-900">
                                {route.basePrice.toLocaleString()} XOF
                              </p>
                              <p className="text-gray-600">Prix</p>
                            </div>
                          </div>

                          {route.description && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              <p>{route.description}</p>
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
