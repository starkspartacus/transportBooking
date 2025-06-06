"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        form.reset({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          countryCode: data.countryCode || "",
          role: data.role || "CAISSIER",
          country: data.country || "",
          city: data.city || "",
          commune: data.commune || "",
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
  };

  const onSubmit = async (data: EmployeeFormData) => {
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
  };

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
              onClick={() => router.push("/patron/employees")}
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
        <Button
          variant="outline"
          onClick={() => router.push(`/patron/employees/${employeeId}`)}
        >
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
                        defaultValue={field.value}
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

                {/* Composant téléphone dynamique */}
                <div>
                  <PhoneInput
                    countryCodeValue={form.watch("countryCode") || ""}
                    phoneValue={form.watch("phone") || ""}
                    onCountryCodeChange={(value) =>
                      form.setValue("countryCode", value)
                    }
                    onPhoneChange={(value) => form.setValue("phone", value)}
                  />
                </div>
              </div>

              {/* Composant de sélection en cascade pour pays, ville, commune */}
              <CascadingSelect
                countryValue={form.watch("country") || ""}
                cityValue={form.watch("city") || ""}
                communeValue={form.watch("commune") || ""}
                onCountryChange={(value) => form.setValue("country", value)}
                onCityChange={(value) => form.setValue("city", value)}
                onCommuneChange={(value) => form.setValue("commune", value)}
              />

              <CardFooter className="flex justify-between px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/patron/employees/${employeeId}`)}
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
