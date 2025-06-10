"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import type { Route } from "@/types/route";
import type { Bus } from "@/types/bus";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  routeId: z.string().min(1, {
    message: "Veuillez sélectionner un itinéraire.",
  }),
  busId: z.string().min(1, {
    message: "Veuillez sélectionner un bus.",
  }),
  departureTime: z.string().min(1, {
    message: "Veuillez entrer une heure de départ.",
  }),
  status: z.enum(["SCHEDULED", "BOARDING", "IN_TRANSIT"]),
  availableSeats: z.number().min(1, {
    message: "Veuillez entrer le nombre de places disponibles.",
  }),
  price: z.number().min(1, {
    message: "Veuillez entrer le prix du voyage.",
  }),
});

export default function NewTripPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'ID de l'entreprise active depuis la session ou le localStorage
        const companyId =
          localStorage.getItem("activeCompanyId") ||
          sessionStorage.getItem("activeCompanyId");

        if (!companyId) {
          console.error("No active company ID found");
          return;
        }

        // Fetch routes
        const routesResponse = await fetch(
          `/api/patron/routes?companyId=${companyId}`
        );
        if (routesResponse.ok) {
          const routesData = await routesResponse.json();
          setRoutes(Array.isArray(routesData) ? routesData : []);
        }

        // Fetch buses
        const busesResponse = await fetch(
          `/api/patron/buses?companyId=${companyId}`
        );
        if (busesResponse.ok) {
          const busesData = await busesResponse.json();
          setBuses(Array.isArray(busesData) ? busesData : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: "",
      busId: "",
      status: "SCHEDULED",
      departureTime: "",
      availableSeats: 1,
      price: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("Voyage créé avec succès!");
        router.push("/patron/trips");
      } else {
        toast.error("Erreur lors de la création du voyage.");
      }
    } catch (error) {
      toast.error("Erreur lors de la création du voyage.");
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau voyage</CardTitle>
          <CardDescription>
            Veuillez remplir le formulaire ci-dessous pour créer un nouveau
            voyage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="routeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Itinéraire</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un itinéraire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem
                            key={route.id}
                            value={route.id.toString()}
                          >
                            {route.departureCountry} → {route.arrivalCountry}
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
                name="busId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un bus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buses.map((bus) => (
                          <SelectItem key={bus.id} value={bus.id.toString()}>
                            {bus.plateNumber} - {bus.model}
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
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de départ</FormLabel>
                    <FormControl>
                      <Input placeholder="HH:MM" {...field} />
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
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Programmé</SelectItem>
                        <SelectItem value="BOARDING">Embarquement</SelectItem>
                        <SelectItem value="IN_TRANSIT">En route</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Créer</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
