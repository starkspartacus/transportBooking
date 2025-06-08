"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Car, Palette, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/use-toast";
import {
  VEHICLE_BRANDS,
  VEHICLE_COLORS,
  VEHICLE_YEARS,
  VEHICLE_TYPES,
  FUEL_TYPES,
} from "@/constants/vehicles";

const vehicleSchema = z.object({
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  year: z.string().min(1, "L'année est requise"),
  color: z.string().min(1, "La couleur est requise"),
  type: z.string().min(1, "Le type de véhicule est requis"),
  fuelType: z.string().min(1, "Le type de carburant est requis"),
  licensePlate: z.string().min(1, "La plaque d'immatriculation est requise"),
  capacity: z.string().min(1, "La capacité est requise"),
  description: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => Promise<boolean>;
  initialData?: Partial<VehicleFormData>;
  isLoading?: boolean;
}

export function VehicleForm({
  onSubmit,
  initialData,
  isLoading = false,
}: VehicleFormProps) {
  const { toast } = useToast();

  // États stables pour éviter les re-renders
  const [customBrands, setCustomBrands] = React.useState<
    Array<{ id: string; name: string; models: string[] }>
  >([]);
  const [customModels, setCustomModels] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [customColors, setCustomColors] = React.useState<
    Array<{ id: string; name: string; hex: string; textColor: string }>
  >([]);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || "",
      color: initialData?.color || "",
      type: initialData?.type || "",
      fuelType: initialData?.fuelType || "",
      licensePlate: initialData?.licensePlate || "",
      capacity: initialData?.capacity || "",
      description: initialData?.description || "",
    },
  });

  const selectedBrand = form.watch("brand");

  // Mémorisation des options pour éviter les re-calculs
  const allBrands = React.useMemo(
    () =>
      [...VEHICLE_BRANDS, ...customBrands].map((brand) => ({
        id: brand.id,
        name: brand.name,
      })),
    [customBrands]
  );

  const allModels = React.useMemo(() => {
    const currentBrand = [...VEHICLE_BRANDS, ...customBrands].find(
      (brand) => brand.id === selectedBrand
    );
    const availableModels = currentBrand
      ? currentBrand.models.map((model) => ({
          id: model.toLowerCase().replace(/\s+/g, "_"),
          name: model,
        }))
      : [];
    return [...availableModels, ...customModels];
  }, [selectedBrand, customBrands, customModels]);

  const allColors = React.useMemo(
    () => [...VEHICLE_COLORS, ...customColors],
    [customColors]
  );

  const vehicleTypeOptions = React.useMemo(
    () =>
      VEHICLE_TYPES.map((type) => ({
        id: type.id,
        name: `${type.icon} ${type.name} (${type.capacity})`,
      })),
    []
  );

  const fuelTypeOptions = React.useMemo(
    () =>
      FUEL_TYPES.map((fuel) => ({
        id: fuel.id,
        name: `${fuel.icon} ${fuel.name}`,
      })),
    []
  );

  const yearOptions = React.useMemo(() => VEHICLE_YEARS, []);

  // Callbacks stables
  const handleAddCustomBrand = React.useCallback(
    (brandName: string) => {
      const newBrand = {
        id: brandName.toLowerCase().replace(/\s+/g, "_"),
        name: brandName,
        models: [],
      };
      setCustomBrands((prev) => [...prev, newBrand]);
      form.setValue("brand", newBrand.id);
      toast({
        title: "Marque ajoutée",
        description: `La marque "${brandName}" a été ajoutée avec succès.`,
      });
    },
    [form, toast]
  );

  const handleAddCustomModel = React.useCallback(
    (modelName: string) => {
      const newModel = {
        id: modelName.toLowerCase().replace(/\s+/g, "_"),
        name: modelName,
      };
      setCustomModels((prev) => [...prev, newModel]);
      form.setValue("model", newModel.id);
      toast({
        title: "Modèle ajouté",
        description: `Le modèle "${modelName}" a été ajouté avec succès.`,
      });
    },
    [form, toast]
  );

  const handleAddCustomColor = React.useCallback(
    (colorName: string) => {
      const randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
      const newColor = {
        id: colorName.toLowerCase().replace(/\s+/g, "_"),
        name: colorName,
        hex: randomColor,
        textColor: "#FFFFFF",
      };
      setCustomColors((prev) => [...prev, newColor]);
      form.setValue("color", newColor.id);
      toast({
        title: "Couleur ajoutée",
        description: `La couleur "${colorName}" a été ajoutée avec succès.`,
      });
    },
    [form, toast]
  );

  // Reset model when brand changes - avec condition pour éviter la boucle
  React.useEffect(() => {
    const currentModel = form.getValues("model");
    if (selectedBrand && currentModel) {
      const currentBrand = [...VEHICLE_BRANDS, ...customBrands].find(
        (brand) => brand.id === selectedBrand
      );
      const modelExists = currentBrand?.models.some(
        (model) => model.toLowerCase().replace(/\s+/g, "_") === currentModel
      );
      if (!modelExists) {
        form.setValue("model", "");
      }
    }
  }, [selectedBrand, form, customBrands]);

  const handleFormSubmit = React.useCallback(
    async (data: VehicleFormData) => {
      try {
        const success = await onSubmit(data);
        if (success) {
          toast({
            title: "Véhicule enregistré",
            description:
              "Les informations du véhicule ont été enregistrées avec succès.",
          });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast({
          title: "Erreur",
          description:
            "Une erreur est survenue lors de l'enregistrement du véhicule.",
          variant: "destructive",
        });
      }
    },
    [onSubmit, toast]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Informations du véhicule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Marque */}
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque *</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={allBrands}
                        value={field.value}
                        onValueChange={field.onChange}
                        onAddCustom={handleAddCustomBrand}
                        placeholder="Ex: Mercedes, Volvo, Scania"
                        searchPlaceholder="Rechercher une marque..."
                        allowCustom={true}
                        customLabel="Ajouter une marque personnalisée"
                      />
                    </FormControl>
                    <FormDescription>
                      Si votre marque n'est pas dans la liste, vous pouvez
                      l'ajouter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modèle */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle *</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={allModels}
                        value={field.value}
                        onValueChange={field.onChange}
                        onAddCustom={handleAddCustomModel}
                        placeholder="Ex: Sprinter, Tourismo"
                        searchPlaceholder="Rechercher un modèle..."
                        allowCustom={true}
                        customLabel="Ajouter un modèle personnalisé"
                      />
                    </FormControl>
                    <FormDescription>
                      Sélectionnez d'abord une marque pour voir les modèles
                      disponibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Année */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année *</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={yearOptions}
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

              {/* Couleur */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <ColorPicker
                          colors={allColors}
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
                              handleAddCustomColor(colorName);
                            }
                          }}
                          className="w-full"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Ajouter une couleur personnalisée
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type de véhicule */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de véhicule *</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={vehicleTypeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Sélectionner le type"
                        searchPlaceholder="Rechercher un type..."
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
                  <FormItem>
                    <FormLabel>Type de carburant *</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={fuelTypeOptions}
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

              {/* Plaque d'immatriculation */}
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plaque d'immatriculation *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AB-123-CD" {...field} />
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
                  <FormItem>
                    <FormLabel>Capacité (nombre de places) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez les caractéristiques particulières de votre véhicule..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ajoutez des informations supplémentaires sur votre véhicule
                    (équipements, état, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Enregistrer le véhicule
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
