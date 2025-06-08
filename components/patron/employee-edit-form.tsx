"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Save } from "lucide-react";
import { CascadingSelect } from "@/components/ui/cascading-select";
import { PhoneInput } from "@/components/ui/phone-input";

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  role: string;
  employeeRole?: string;
  country?: string;
  city?: string;
  commune?: string;
}

const employeeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  role: z.enum(["GESTIONNAIRE", "CAISSIER"]),
  country: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeEditForm({
  employeeId,
}: {
  employeeId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      countryCode: "",
      role: "CAISSIER",
      country: "",
      city: "",
      commune: "",
    },
  });

  // Mémoriser les valeurs du formulaire pour éviter les re-renders
  const formValues = form.getValues();
  const [watchedValues, setWatchedValues] = useState({
    countryCode: formValues.countryCode || "",
    phone: formValues.phone || "",
    country: formValues.country || "",
    city: formValues.city || "",
    commune: formValues.commune || "",
  });

  // Mettre à jour les valeurs surveillées seulement quand nécessaire
  useEffect(() => {
    const subscription = form.watch((value) => {
      setWatchedValues({
        countryCode: value.countryCode || "",
        phone: value.phone || "",
        country: value.country || "",
        city: value.city || "",
        commune: value.commune || "",
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const fetchEmployeeDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        const employeeData = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          countryCode: data.countryCode || "",
          role: (data.role || "CAISSIER") as "GESTIONNAIRE" | "CAISSIER",
          country: data.country || "",
          city: data.city || "",
          commune: data.commune || "",
        };
        form.reset(employeeData);
        setWatchedValues({
          countryCode: employeeData.countryCode,
          phone: employeeData.phone,
          country: employeeData.country,
          city: employeeData.city,
          commune: employeeData.commune,
        });
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            "Erreur lors de la récupération des détails de l'employé"
        );
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Erreur lors de la récupération des détails de l'employé");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, form]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);

  const onSubmit = useCallback(
    async (data: EmployeeFormData) => {
      try {
        const response = await fetch(`/api/company/employees/${employeeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          toast({
            title: "Employé mis à jour",
            description:
              "Les informations de l'employé ont été mises à jour avec succès",
          });
          router.push(`/patron/employees/${employeeId}`);
        } else {
          const errorData = await response.json();
          toast({
            title: "Erreur",
            description:
              errorData.error || "Erreur lors de la mise à jour de l'employé",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error updating employee:", error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la mise à jour de l'employé",
          variant: "destructive",
        });
      }
    },
    [employeeId, toast, router]
  );

  // Callbacks stables pour éviter les re-renders
  const handleCountryCodeChange = useCallback(
    (value: string) => {
      form.setValue("countryCode", value);
    },
    [form]
  );

  const handlePhoneChange = useCallback(
    (value: string) => {
      form.setValue("phone", value);
    },
    [form]
  );

  const handleCountryChange = useCallback(
    (value: string) => {
      form.setValue("country", value);
    },
    [form]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      form.setValue("city", value);
    },
    [form]
  );

  const handleCommuneChange = useCallback(
    (value: string) => {
      form.setValue("commune", value);
    },
    [form]
  );

  const handleBackToDetails = useCallback(() => {
    router.push(`/patron/employees/${employeeId}`);
  }, [router, employeeId]);

  const handleBackToList = useCallback(() => {
    router.push("/patron/employees");
  }, [router]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleBackToList}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste des employés
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBackToDetails}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux détails
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier l'employé</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GESTIONNAIRE">
                            Gestionnaire
                          </SelectItem>
                          <SelectItem value="CAISSIER">Caissier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Composant téléphone avec valeurs mémorisées */}
                <div>
                  <PhoneInput
                    countryCodeValue={watchedValues.countryCode}
                    phoneValue={watchedValues.phone}
                    onCountryCodeChange={handleCountryCodeChange}
                    onPhoneChange={handlePhoneChange}
                  />
                </div>
              </div>

              {/* Composant de sélection en cascade avec valeurs mémorisées */}
              <CascadingSelect
                countryValue={watchedValues.country}
                cityValue={watchedValues.city}
                communeValue={watchedValues.commune}
                onCountryChange={handleCountryChange}
                onCityChange={handleCityChange}
                onCommuneChange={handleCommuneChange}
              />

              <CardFooter className="flex justify-between px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToDetails}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {form.formState.isSubmitting
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
