"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Plus,
  Eye,
  Edit,
  Trash2,
  BusIcon,
  Sparkles,
  CalendarIcon,
  Wifi,
  UsbIcon,
  AirVent,
  Armchair,
  Car,
  Package,
  Accessibility,
  Shield,
  Wrench,
  Clock,
  X,
  Search,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Fuel,
  Gauge,
  CalendarDays,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  VEHICLE_BRANDS,
  VEHICLE_COLORS,
  VEHICLE_YEARS,
  FUEL_TYPES,
} from "@/constants/vehicles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BusType {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
  year?: number;
  brand?: string;
  features?: string[];
}

const busSchema = z.object({
  plateNumber: z
    .string()
    .min(3, "Le numéro d'immatriculation doit contenir au moins 3 caractères"),
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  year: z.string().min(1, "L'année est requise"),
  capacity: z.string().regex(/^[0-9]+$/, "La capacité doit être un nombre"),
  color: z.string().min(1, "La couleur est requise"),
  fuelType: z.string().min(1, "Le type de carburant est requis"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]),
  mileage: z
    .string()
    .regex(/^[0-9]+$/, "Le kilométrage doit être un nombre")
    .optional(),
  insuranceExpiry: z
    .string()
    .min(1, "La date d'expiration de l'assurance est requise"),
  technicalInspectionExpiry: z
    .string()
    .min(1, "La date d'expiration du contrôle technique est requise"),
  lastMaintenance: z
    .string()
    .min(1, "La date de dernière maintenance est requise"),
  nextMaintenance: z
    .string()
    .min(1, "La date de prochaine maintenance est requise"),
  equipment: z.array(z.string()).optional(),
});

type BusFormData = z.infer<typeof busSchema>;

interface BusFleetManagementProps {
  companyId: string;
}

export default function BusFleetManagement({
  companyId,
}: BusFleetManagementProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [buses, setBuses] = useState<BusType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [customBrands, setCustomBrands] = useState<
    Array<{ id: string; name: string; models: string[] }>
  >([]);
  const [customModels, setCustomModels] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [customColors, setCustomColors] = useState<
    Array<{ id: string; name: string; hex: string; textColor: string }>
  >([]);

  const form = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      plateNumber: "",
      brand: "",
      model: "",
      year: "",
      capacity: "",
      color: "",
      fuelType: "",
      status: "ACTIVE",
      mileage: "0",
      insuranceExpiry: "",
      technicalInspectionExpiry: "",
      lastMaintenance: "",
      nextMaintenance: "",
      equipment: [],
    },
  });

  useEffect(() => {
    if (companyId) {
      fetchBuses();
    }
  }, [companyId]);

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/buses?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setBuses(data);
      } else {
        toast({
          title: "❌ Erreur",
          description: "Impossible de charger les véhicules",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du chargement des véhicules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BusFormData) => {
    try {
      const response = await fetch("/api/patron/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Bus ajouté",
          description: "Le bus a été ajouté avec succès",
        });
        fetchBuses();
        setShowNewForm(false);
        form.reset();
      } else {
        const error = await response.json();
        toast({
          title: "❌ Erreur",
          description: error.error || "Erreur lors de l'ajout du bus",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating bus:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de l'ajout du bus",
        variant: "destructive",
      });
    }
  };

  const handleViewBus = (busId: string) => {
    router.push(`/patron/buses/${busId}`);
  };

  const handleEditBus = (busId: string) => {
    router.push(`/patron/buses/${busId}/edit`);
  };

  const handleDeleteBus = async (busId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bus ?")) return;

    try {
      const response = await fetch(`/api/patron/buses/${busId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "🗑️ Bus supprimé",
          description: "Le bus a été supprimé avec succès",
        });
        fetchBuses();
      } else {
        const error = await response.json();
        toast({
          title: "❌ Erreur",
          description: error.error || "Erreur lors de la suppression du bus",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting bus:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la suppression du bus",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            En service
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors">
            <Settings className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
      case "OUT_OF_SERVICE":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Hors service
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.brand && bus.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || bus.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const totalBuses = buses.length;
  const activeBuses = buses.filter((bus) => bus.status === "ACTIVE").length;
  const maintenanceBuses = buses.filter(
    (bus) => bus.status === "MAINTENANCE"
  ).length;
  const outOfServiceBuses = buses.filter(
    (bus) => bus.status === "OUT_OF_SERVICE"
  ).length;
  const totalCapacity = buses.reduce((total, bus) => total + bus.capacity, 0);

  const EQUIPMENT_OPTIONS = [
    {
      id: "climatisation",
      name: "Climatisation",
      icon: AirVent,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: "wifi",
      name: "WiFi",
      icon: Wifi,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      id: "usb",
      name: "Chargement USB",
      icon: UsbIcon,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      id: "divertissement",
      name: "Divertissement",
      icon: Car,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      id: "sieges_inclinables",
      name: "Sièges inclinables",
      icon: Armchair,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
    {
      id: "toilettes",
      name: "Toilettes",
      icon: Package,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
    },
    {
      id: "compartiment_bagages",
      name: "Compartiment bagages",
      icon: Package,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      id: "accessible_pmr",
      name: "Accessible PMR",
      icon: Accessibility,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
    },
  ];

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement de la flotte...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BusIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestion de la flotte</h1>
                <p className="text-blue-100 text-sm font-normal">
                  Gérez vos véhicules en toute simplicité
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchBuses}
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un bus
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">{totalBuses}</p>
                <p className="text-sm text-blue-600">Total véhicules</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <BusIcon className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {activeBuses}
                </p>
                <p className="text-sm text-green-600">En service</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-700">
                  {maintenanceBuses}
                </p>
                <p className="text-sm text-yellow-600">Maintenance</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <Settings className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-700">
                  {outOfServiceBuses}
                </p>
                <p className="text-sm text-red-600">Hors service</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {totalCapacity}
                </p>
                <p className="text-sm text-purple-600">Capacité totale</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Armchair className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par plaque, modèle ou marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              >
                <option value="all">Tous les statuts</option>
                <option value="ACTIVE">En service</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Hors service</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="hover:bg-gray-50 transition-colors border-2 border-gray-200 hover:border-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout avec animations */}
      {showNewForm && (
        <Card className="border-2 border-blue-200 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                Ajouter un nouveau bus
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Section Informations générales */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Informations générales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Numéro d'immatriculation */}
                    <FormField
                      control={form.control}
                      name="plateNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Numéro d'immatriculation *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: AB-123-CD"
                              {...field}
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Marque */}
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            Marque *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CustomSelect
                                options={[
                                  ...VEHICLE_BRANDS,
                                  ...customBrands,
                                ].map((brand) => ({
                                  id: brand.id,
                                  name: brand.name,
                                }))}
                                value={field.value}
                                onValueChange={field.onChange}
                                onAddCustom={(brandName) => {
                                  const newBrand = {
                                    id: brandName
                                      .toLowerCase()
                                      .replace(/\s+/g, "_"),
                                    name: brandName,
                                    models: [],
                                  };
                                  setCustomBrands((prev) => [
                                    ...prev,
                                    newBrand,
                                  ]);
                                  field.onChange(newBrand.id);
                                }}
                                placeholder="Ex: Mercedes, Volvo, Scania"
                                searchPlaceholder="Rechercher une marque..."
                                allowCustom={true}
                                customLabel="Ajouter une marque personnalisée"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Modèle */}
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => {
                        const selectedBrand = form.watch("brand");
                        const allBrands = [...VEHICLE_BRANDS, ...customBrands];
                        const currentBrand = allBrands.find(
                          (brand) => brand.id === selectedBrand
                        );
                        const availableModels = currentBrand
                          ? currentBrand.models.map((model) => ({
                              id: model.toLowerCase().replace(/\s+/g, "_"),
                              name: model,
                            }))
                          : [];
                        const allModels = [...availableModels, ...customModels];

                        return (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Car className="h-4 w-4 text-green-500" />
                              Modèle *
                            </FormLabel>
                            <FormControl>
                              <CustomSelect
                                options={allModels}
                                value={field.value}
                                onValueChange={field.onChange}
                                onAddCustom={(modelName) => {
                                  const newModel = {
                                    id: modelName
                                      .toLowerCase()
                                      .replace(/\s+/g, "_"),
                                    name: modelName,
                                  };
                                  setCustomModels((prev) => [
                                    ...prev,
                                    newModel,
                                  ]);
                                  field.onChange(newModel.id);
                                }}
                                placeholder="Ex: Sprinter, Tourismo"
                                searchPlaceholder="Rechercher un modèle..."
                                allowCustom={true}
                                customLabel="Ajouter un modèle personnalisé"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Année */}
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            Année *
                          </FormLabel>
                          <FormControl>
                            <CustomSelect
                              options={VEHICLE_YEARS}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Sélectionner l'année"
                              searchPlaceholder="Rechercher une année..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Capacité */}
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Armchair className="h-4 w-4 text-indigo-500" />
                            Capacité (places) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 50"
                              {...field}
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Couleur */}
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-blue-400"></div>
                            Couleur
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <ColorPicker
                                colors={[...VEHICLE_COLORS, ...customColors]}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Ex: Blanc, Bleu"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const colorName = prompt(
                                    "Entrez le nom de la couleur personnalisée:"
                                  );
                                  if (colorName) {
                                    const randomColor = `#${Math.floor(
                                      Math.random() * 16777215
                                    )
                                      .toString(16)
                                      .padStart(6, "0")}`;
                                    const newColor = {
                                      id: colorName
                                        .toLowerCase()
                                        .replace(/\s+/g, "_"),
                                      name: colorName,
                                      hex: randomColor,
                                      textColor: "#FFFFFF",
                                    };
                                    setCustomColors((prev) => [
                                      ...prev,
                                      newColor,
                                    ]);
                                    field.onChange(newColor.id);
                                  }
                                }}
                                className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter une couleur personnalisée
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type de carburant */}
                    <FormField
                      control={form.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Fuel className="h-4 w-4 text-yellow-500" />
                            Type de carburant *
                          </FormLabel>
                          <FormControl>
                            <CustomSelect
                              options={FUEL_TYPES.map((fuel) => ({
                                id: fuel.id,
                                name: `${fuel.icon} ${fuel.name}`,
                              }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Sélectionner le carburant"
                              searchPlaceholder="Rechercher un carburant..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Statut */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            Statut *
                          </FormLabel>
                          <FormControl>
                            <CustomSelect
                              options={[
                                { id: "ACTIVE", name: "🟢 En service" },
                                {
                                  id: "MAINTENANCE",
                                  name: "🟡 En maintenance",
                                },
                                {
                                  id: "OUT_OF_SERVICE",
                                  name: "🔴 Hors service",
                                },
                              ]}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Sélectionner le statut"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Kilométrage */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Gauge className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Informations techniques
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-green-500" />
                          Kilométrage total
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dates importantes */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Dates importantes
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assurance (expiration) */}
                    <FormField
                      control={form.control}
                      name="insuranceExpiry"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Assurance (expiration) *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal border-2 border-gray-200 hover:border-blue-400 transition-all duration-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(
                                      new Date(field.value),
                                      "dd MMMM yyyy",
                                      { locale: fr }
                                    )
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString())
                                }
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contrôle technique (expiration) */}
                    <FormField
                      control={form.control}
                      name="technicalInspectionExpiry"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-500" />
                            Contrôle technique (expiration) *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal border-2 border-gray-200 hover:border-orange-400 transition-all duration-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(
                                      new Date(field.value),
                                      "dd MMMM yyyy",
                                      { locale: fr }
                                    )
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString())
                                }
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dernière maintenance */}
                    <FormField
                      control={form.control}
                      name="lastMaintenance"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            Dernière maintenance *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal border-2 border-gray-200 hover:border-green-400 transition-all duration-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(
                                      new Date(field.value),
                                      "dd MMMM yyyy",
                                      { locale: fr }
                                    )
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString())
                                }
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Prochaine maintenance */}
                    <FormField
                      control={form.control}
                      name="nextMaintenance"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            Prochaine maintenance *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal border-2 border-gray-200 hover:border-purple-400 transition-all duration-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(
                                      new Date(field.value),
                                      "dd MMMM yyyy",
                                      { locale: fr }
                                    )
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString())
                                }
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Équipements et services */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Équipements et services
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="equipment"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {EQUIPMENT_OPTIONS.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="equipment"
                              render={({ field }) => {
                                const IconComponent = item.icon;
                                const isChecked = field.value?.includes(
                                  item.id
                                );
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                item.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              );
                                        }}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                      />
                                    </FormControl>
                                    <FormLabel
                                      className={cn(
                                        "text-sm font-normal flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-md",
                                        isChecked
                                          ? `${item.bgColor} border-current ${item.color} shadow-sm`
                                          : "border-gray-200 hover:border-gray-300"
                                      )}
                                    >
                                      <IconComponent
                                        className={cn(
                                          "h-5 w-5",
                                          isChecked
                                            ? item.color
                                            : "text-gray-400"
                                        )}
                                      />
                                      <span
                                        className={
                                          isChecked ? "font-medium" : ""
                                        }
                                      >
                                        {item.name}
                                      </span>
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                    className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le bus
                        <Sparkles className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Liste des bus */}
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">
          {filteredBuses.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <BusIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {buses.length === 0
                  ? "Aucun véhicule trouvé"
                  : "Aucun véhicule ne correspond aux critères"}
              </h3>
              <p className="text-gray-600 mb-4">
                {buses.length === 0
                  ? "Commencez par ajouter votre premier véhicule"
                  : "Essayez de modifier vos critères de recherche"}
              </p>
              {buses.length === 0 && (
                <Button
                  onClick={() => setShowNewForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un véhicule
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBuses.map((bus, index) => (
                <div
                  key={bus.id}
                  className="border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:scale-[1.02] animate-in slide-in-from-left-4 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <BusIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                          {bus.plateNumber}
                        </h3>
                        {getStatusBadge(bus.status)}
                        {bus.features && bus.features.length > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {bus.features.length} équipement
                            {bus.features.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 font-medium flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        {bus.brand && `${bus.brand} `}
                        {bus.model}
                        {bus.year && (
                          <span className="text-gray-500">({bus.year})</span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <Armchair className="h-4 w-4 text-indigo-500" />
                          Capacité: {bus.capacity} places
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          Dernière maintenance:{" "}
                          {formatDate(bus.lastMaintenance)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          Prochaine maintenance:{" "}
                          {formatDate(bus.nextMaintenance)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-orange-500" />
                          Kilométrage: {bus.mileage?.toLocaleString() || 0} km
                        </span>
                      </div>

                      {/* Équipements */}
                      {bus.features && bus.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {bus.features.slice(0, 4).map((feature) => {
                            const equipment = EQUIPMENT_OPTIONS.find(
                              (eq) => eq.id === feature
                            );
                            if (!equipment) return null;
                            const IconComponent = equipment.icon;
                            return (
                              <div
                                key={feature}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${equipment.bgColor} ${equipment.color} border`}
                              >
                                <IconComponent className="h-3 w-3" />
                                <span>{equipment.name}</span>
                              </div>
                            );
                          })}
                          {bus.features.length > 4 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 border">
                              <Plus className="h-3 w-3" />+
                              {bus.features.length - 4} autres
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBus(bus.id)}
                        className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBus(bus.id)}
                        className="border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-300 hover:scale-105"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBus(bus.id)}
                        className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
