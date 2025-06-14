"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";
import { ALL_COUNTRIES } from "@/constants/countries";

const routeFormSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  departureCountry: z.string().min(1, "Pays de départ requis"),
  arrivalCountry: z.string().min(1, "Pays d'arrivée requis"),
  departureLocation: z.string().min(1, "Ville de départ requise"),
  arrivalLocation: z.string().min(1, "Ville d'arrivée requise"),
  distance: z.coerce.number().positive("La distance doit être positive"),
  estimatedDuration: z.coerce.number().positive("La durée doit être positive"),
  basePrice: z.coerce.number().positive("Le prix doit être positif"),
  isInternational: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

interface RouteFormProps {
  initialData?: any;
  companyId: string;
  onSuccess?: () => void;
}

export default function RouteForm({
  initialData,
  companyId,
  onSuccess,
}: RouteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Memoize default values to prevent re-renders
  const defaultValues = useCallback(
    () => ({
      name: initialData?.name || "",
      description: initialData?.description || "",
      departureCountry: initialData?.departureCountry || "CI",
      arrivalCountry: initialData?.arrivalCountry || "CI",
      departureLocation: initialData?.departureLocation || "",
      arrivalLocation: initialData?.arrivalLocation || "",
      distance: initialData?.distance || 0,
      estimatedDuration: initialData?.estimatedDuration || 0,
      basePrice: initialData?.basePrice || 0,
      isInternational: initialData?.isInternational || false,
      status: initialData?.status || "ACTIVE",
    }),
    [initialData]
  );

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: defaultValues(),
  });

  // Watch values for real-time calculation
  const watchDistance = form.watch("distance");
  const watchDuration = form.watch("estimatedDuration");
  const watchBasePrice = form.watch("basePrice");

  // Calculate speed only when distance or duration changes
  const averageSpeed = useCallback(() => {
    const distance = Number.parseFloat(watchDistance.toString());
    const duration = Number.parseFloat(watchDuration.toString());

    if (distance > 0 && duration > 0) {
      // Convert duration from minutes to hours and calculate km/h
      return Math.round((distance / (duration / 60)) * 10) / 10;
    }
    return 0;
  }, [watchDistance, watchDuration]);

  // Calculate price per km only when distance or price changes
  const pricePerKm = useCallback(() => {
    const distance = Number.parseFloat(watchDistance.toString());
    const price = Number.parseFloat(watchBasePrice.toString()); // Use watchBasePrice

    if (distance > 0 && price > 0) {
      return Math.round((price / distance) * 10) / 10;
    }
    return 0;
  }, [watchDistance, watchBasePrice]); // Add watchBasePrice to dependencies

  const onSubmit = async (data: RouteFormValues) => {
    setIsSubmitting(true);

    try {
      const url = initialData
        ? `/api/patron/routes/${initialData.id}`
        : "/api/patron/routes";

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          companyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Une erreur s'est produite");
      }

      toast({
        title: initialData ? "Route mise à jour" : "Route créée",
        description: initialData
          ? "La route a été mise à jour avec succès."
          : "La nouvelle route a été créée avec succès.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/patron/routes");
        router.refresh();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Informations générales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la route *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Abidjan - Yamoussoukro"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la route..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Itinéraire</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="departureCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays de départ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="arrivalCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays d'arrivée</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departureLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville de départ *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Abidjan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="arrivalLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville d'arrivée *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Yamoussoukro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isInternational"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Route internationale
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      Activez cette option si la route traverse une frontière
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Détails du voyage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance (km) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} // Ensure numeric value
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
                  <FormLabel>Durée (minutes) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} // Ensure numeric value
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix de base (FCFA) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} // Ensure numeric value
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Durée estimée</p>
              <p className="text-xl font-semibold">
                {Math.floor(watchDuration / 60)}h {watchDuration % 60}min
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Vitesse moyenne</p>
              <p className="text-xl font-semibold">{averageSpeed()} km/h</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Prix par km</p>
              <p className="text-xl font-semibold">{pricePerKm()} FCFA/km</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Mise à jour..." : "Création..."}
              </>
            ) : initialData ? (
              "Mettre à jour la route"
            ) : (
              "Créer la route"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
