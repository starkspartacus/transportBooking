"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
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
  ArrowLeft,
  Save,
  BusIcon,
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
  Sparkles,
} from "lucide-react";
import {
  VEHICLE_BRANDS,
  VEHICLE_COLORS,
  VEHICLE_YEARS,
  FUEL_TYPES,
} from "@/constants/vehicles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  totalKm: z
    .string()
    .regex(/^[0-9]+$/, "Le kilométrage doit être un nombre")
    .optional(),
  insuranceExpiry: z.string().optional(),
  technicalInspectionExpiry: z.string().optional(),
  lastMaintenance: z.string().optional(),
  nextMaintenance: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

type BusFormData = z.infer<typeof busSchema>;

export default function EditBusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      totalKm: "0",
      insuranceExpiry: "",
      technicalInspectionExpiry: "",
      lastMaintenance: "",
      nextMaintenance: "",
      equipment: [],
    },
  });

  useEffect(() => {
    fetchBusDetails();
  }, [params.id]);

  const fetchBusDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/company/buses/${params.id}`);
      if (response.ok) {
        const bus = await response.json();

        // Remplir le formulaire avec les données existantes
        form.reset({
          plateNumber: bus.plateNumber || "",
          brand: bus.brand || "",
          model: bus.model || "",
          year: bus.year?.toString() || "",
          capacity: bus.capacity?.toString() || "",
          color: bus.color || "",
          fuelType: bus.fuelType || "",
          status: bus.status || "ACTIVE",
          totalKm: bus.totalKm?.toString() || "0",
          insuranceExpiry: bus.insuranceExpiry || "",
          technicalInspectionExpiry: bus.technicalInspectionExpiry || "",
          lastMaintenance: bus.lastMaintenance || "",
          nextMaintenance: bus.nextMaintenance || "",
          equipment: bus.equipment || [],
        });
      } else {
        toast({
          title: "Erreur",
          description: "Bus non trouvé",
          variant: "destructive",
        });
        router.push("/patron/buses");
      }
    } catch (error) {
      console.error("Error fetching bus details:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des détails du bus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BusFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/company/buses/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Bus mis à jour",
          description: "Les modifications ont été enregistrées avec succès",
        });
        router.push(`/patron/buses/${params.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la mise à jour du bus",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating bus:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du bus",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des détails du bus...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/patron/buses/${params.id}`)}
            className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BusIcon className="h-8 w-8 text-blue-600" />
              </div>
              Modifier le bus
            </h1>
            <p className="text-gray-600 mt-1">
              Modifiez les informations du véhicule
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BusIcon className="h-5 w-5 text-blue-600" />
              </div>
              Informations du bus
            </CardTitle>
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
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
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
                            <CustomSelect
                              options={[...VEHICLE_BRANDS, ...customBrands].map(
                                (brand) => ({
                                  id: brand.id,
                                  name: brand.name,
                                })
                              )}
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
                                setCustomBrands((prev) => [...prev, newBrand]);
                                field.onChange(newBrand.id);
                              }}
                              placeholder="Ex: Mercedes, Volvo, Scania"
                              searchPlaceholder="Rechercher une marque..."
                              allowCustom={true}
                              customLabel="Ajouter une marque personnalisée"
                            />
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
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
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
                            <ColorPicker
                              colors={[...VEHICLE_COLORS, ...customColors]}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Ex: Blanc, Bleu"
                            />
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
                            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
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
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
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
                      <Wrench className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Informations techniques
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="totalKm"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-400"></div>
                          Kilométrage total
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
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
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
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
                            Assurance (expiration)
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
                            Contrôle technique (expiration)
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
                            Dernière maintenance
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
                            Prochaine maintenance
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
                    onClick={() => router.push(`/patron/buses/${params.id}`)}
                    className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                        <Sparkles className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
