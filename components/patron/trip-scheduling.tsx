"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { TripType, TripStatus } from "@prisma/client"; // Ensure enums are imported
import type { Bus, Route as RouteType } from "@/lib/types";

const formSchema = z.object({
  routeId: z.string().min(1, "Veuillez sélectionner une route."),
  busId: z.string().min(1, "Veuillez sélectionner un bus."),
  departureDate: z.date({
    required_error: "Une date de départ est requise.",
  }),
  departureTime: z.string().min(1, "Une heure de départ est requise."),
  arrivalDate: z.date({
    required_error: "Une date d'arrivée est requise.",
  }),
  arrivalTime: z.string().min(1, "Une heure d'arrivée est requise."),
  basePrice: z
    .string()
    .transform((val) => Number.parseFloat(val))
    .refine((val) => val > 0, {
      message: "Le prix de base doit être un nombre positif.",
    }),
  availableSeats: z.preprocess(
    (val) => Number.parseInt(val as string, 10),
    z.number().int().positive().optional()
  ),
  status: z.nativeEnum(TripStatus).default(TripStatus.SCHEDULED),
  tripType: z.nativeEnum(TripType).default(TripType.STANDARD),
  services: z.string().optional(),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  boardingStartTime: z.string().optional().nullable(), // New field
  boardingEndTime: z.string().optional().nullable(), // New field
});

interface TripSchedulingProps {
  companyId: string;
  onTripCreated?: () => void;
}

export function TripScheduling({
  companyId,
  onTripCreated,
}: TripSchedulingProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: "",
      busId: "",
      departureTime: "",
      arrivalTime: "",
      basePrice: 0,
      availableSeats: undefined,
      status: TripStatus.SCHEDULED,
      tripType: TripType.STANDARD,
      services: "",
      driverName: "",
      driverPhone: "",
      notes: "",
      boardingStartTime: "", // Initialize new fields
      boardingEndTime: "", // Initialize new fields
    },
  });

  // Fetch buses and routes for the selected company
  useEffect(() => {
    if (companyId) {
      const fetchResources = async () => {
        setIsLoading(true);
        try {
          const [busesRes, routesRes] = await Promise.all([
            fetch(`/api/patron/buses?companyId=${companyId}`),
            fetch(`/api/patron/routes?companyId=${companyId}`),
          ]);

          if (busesRes.ok) {
            const busesData = await busesRes.json();
            setBuses(busesData);
          } else {
            console.error("Failed to fetch buses");
            toast({
              title: "Erreur",
              description: "Impossible de charger les bus.",
              variant: "destructive",
            });
          }

          if (routesRes.ok) {
            const routesData = await routesRes.json();
            setRoutes(routesData);
          } else {
            console.error("Failed to fetch routes");
            toast({
              title: "Erreur",
              description: "Impossible de charger les routes.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching resources:", error);
          toast({
            title: "Erreur",
            description:
              "Une erreur inattendue est survenue lors du chargement des ressources.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchResources();
    }
  }, [companyId, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session || session.user.role !== "PATRON") {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas la permission de créer un voyage.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const departureDateTime = new Date(
        values.departureDate as unknown as string
      );
      const [depHour, depMinute] = (values.departureTime as string)
        .split(":")
        .map(Number);
      departureDateTime.setHours(depHour, depMinute, 0, 0);

      const arrivalDateTime = new Date(values.arrivalDate as unknown as string);
      const [arrHour, arrMinute] = (values.arrivalTime as string)
        .split(":")
        .map(Number);
      arrivalDateTime.setHours(arrHour, arrMinute, 0, 0);

      let boardingStartDateTime: Date | null = null;
      if (values.boardingStartTime) {
        boardingStartDateTime = new Date(
          values.departureDate as unknown as string
        ); // Base on departure date for boarding
        const [bsHour, bsMinute] = (values.boardingStartTime as string)
          .split(":")
          .map(Number);
        boardingStartDateTime.setHours(bsHour, bsMinute, 0, 0);
      }

      let boardingEndDateTime: Date | null = null;
      if (values.boardingEndTime) {
        boardingEndDateTime = new Date(
          values.departureDate as unknown as string
        ); // Base on departure date for boarding
        const [beHour, beMinute] = (values.boardingEndTime as string)
          .split(":")
          .map(Number);
        boardingEndDateTime.setHours(beHour, beMinute, 0, 0);
      }

      const response = await fetch("/api/patron/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          departureTime: departureDateTime.toISOString(),
          arrivalTime: arrivalDateTime.toISOString(),
          basePrice: values.basePrice,
          companyId: companyId,
          boardingStartTime: boardingStartDateTime?.toISOString() || null, // Send as ISO string or null
          boardingEndTime: boardingEndDateTime?.toISOString() || null, // Send as ISO string or null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Voyage créé",
          description: "Le nouveau voyage a été programmé avec succès.",
        });
        form.reset(); // Reset form fields
        onTripCreated?.(); // Callback to refresh parent component if needed
      } else {
        toast({
          title: "Erreur",
          description:
            data.error ||
            "Une erreur est survenue lors de la création du voyage.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Erreur inattendue",
        description: "Impossible de créer le voyage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold">Programmer un nouveau voyage</h2>

        <FormField
          control={form.control}
          name="routeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une route" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.departureLocation} - {route.arrivalLocation} (
                      {route.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>La route que ce voyage suivra.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="busId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bus</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un bus" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.plateNumber} ({bus.model} - {bus.capacity} places)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Le bus attribué à ce voyage.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="departureDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de départ</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  La date à laquelle le voyage débutera.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de départ</FormLabel>
                <FormControl>
                  <TimePicker
                    time={field.value}
                    setTime={field.onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  L&apos;heure exacte de départ du voyage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="arrivalDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d&apos;arrivée</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  La date estimée d&apos;arrivée du voyage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="arrivalTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure d&apos;arrivée</FormLabel>
                <FormControl>
                  <TimePicker
                    time={field.value}
                    setTime={field.onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  L&apos;heure exacte d&apos;arrivée du voyage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="boardingStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de début d&apos;embarquement</FormLabel>
                <FormControl>
                  <TimePicker
                    time={field.value || ""}
                    setTime={field.onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Heure à laquelle l&apos;embarquement commencera.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="boardingEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de fin d&apos;embarquement</FormLabel>
                <FormControl>
                  <TimePicker
                    time={field.value || ""}
                    setTime={field.onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Heure à laquelle l&apos;embarquement se terminera.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix de base du billet</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Le prix unitaire de base pour un billet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableSeats"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Places disponibles</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Nombre de places disponibles pour ce voyage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut du voyage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TripStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Le statut actuel du voyage.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tripType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de voyage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de voyage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TripType).map((type) => (
                    <SelectItem key={type as string} value={type as string}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Le type de ce voyage (standard, spécial, etc.).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services (séparés par des virgules)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Ex: AC, WIFI, TV</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du chauffeur</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Nom du chauffeur affecté au voyage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driverPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone du chauffeur</FormLabel>
              <FormControl>
                <Input type="tel" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Numéro de téléphone du chauffeur.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes additionnelles</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Toute information supplémentaire pertinente pour ce voyage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Programmation..." : "Programmer le voyage"}
        </Button>
      </form>
    </Form>
  );
}
