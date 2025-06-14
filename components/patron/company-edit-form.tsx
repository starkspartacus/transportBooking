"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building, ArrowLeft, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALL_COUNTRIES,
  getCitiesByCountryCode,
  getCommunesByCity,
} from "@/constants/countries";

const companyEditSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().min(1, "Code pays requis"),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  address: z.string().min(10, "Adresse complète requise"),
  country: z.string().min(1, "Pays requis"),
  city: z.string().min(1, "Ville requise"),
  commune: z.string().optional(),
  taxId: z.string().optional(),
  foundedYear: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]),
  isActive: z.boolean(),
});

type CompanyEditFormData = z.infer<typeof companyEditSchema>;

interface CompanyEditFormProps {
  companyId: string;
}

export default function CompanyEditForm({ companyId }: CompanyEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  const form = useForm<CompanyEditFormData>({
    resolver: zodResolver(companyEditSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      countryCode: "+225",
      address: "",
      country: "",
      city: "",
      commune: "",
      website: "",
      taxId: "",
      foundedYear: "",
      size: "SMALL",
      isActive: true,
    },
  });

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`);
      if (response.ok) {
        const company = await response.json();

        // Remplir le formulaire avec les données existantes
        form.reset({
          name: company.name,
          description: company.description || "",
          email: company.email,
          phone: company.phone,
          countryCode: company.countryCode,
          address: company.address,
          country: company.country,
          city: company.city,
          commune: company.commune || "",
          website: company.website || "",
          taxId: company.taxId || "",
          foundedYear: company.foundedYear?.toString() || "",
          size: company.size,
          isActive: company.isActive,
        });

        // Charger les villes et communes
        const countryCode = ALL_COUNTRIES.find(
          (c) => c.name === company.country
        )?.code;
        if (countryCode) {
          setSelectedCountry(countryCode);
          const cities = getCitiesByCountryCode(countryCode);
          setAvailableCities(cities.map((city) => city.name));

          if (company.city) {
            const communes = getCommunesByCity(countryCode, company.city);
            setAvailableCommunes(communes);
          }
        }
      } else {
        throw new Error("Entreprise non trouvée");
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'entreprise",
        variant: "destructive",
      });
      router.push("/patron/companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = ALL_COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(countryCode);
      const cities = getCitiesByCountryCode(countryCode);
      setAvailableCities(cities.map((city) => city.name));
      setAvailableCommunes([]);
      form.setValue("country", country.name);
      form.setValue("city", "");
      form.setValue("commune", "");
    }
  };

  const handleCityChange = (city: string) => {
    const communes = getCommunesByCity(selectedCountry, city);
    setAvailableCommunes(communes);
    form.setValue("city", city);
    form.setValue("commune", "");
  };

  const onSubmit = async (data: CompanyEditFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Succès !",
          description: "Les informations de l'entreprise ont été mises à jour.",
        });
        router.push(`/patron/companies/${companyId}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier l'entreprise
          </h1>
          <p className="text-gray-600">
            Mettez à jour les informations de votre entreprise
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille de l'entreprise *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner la taille" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SMALL">
                            Petite entreprise (1-10 employés)
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            Moyenne entreprise (11-50 employés)
                          </SelectItem>
                          <SelectItem value="LARGE">
                            Grande entreprise (51-200 employés)
                          </SelectItem>
                          <SelectItem value="ENTERPRISE">
                            Entreprise (200+ employés)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre entreprise..."
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@entreprise.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site web</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.entreprise.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code pays *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_COUNTRIES.map((country) => (
                            <SelectItem
                              key={country.code}
                              value={country.phonePrefix}
                            >
                              {country.flag} {country.phonePrefix}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="01 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Localisation */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adresse complète..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel>Pays *</FormLabel>
                  <Select
                    onValueChange={handleCountryChange}
                    value={selectedCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_COUNTRIES.map((country) => (
                        <SelectItem key={country.id} value={country.code}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleCityChange}
                        disabled={!selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir la ville" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
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
                  name="commune"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commune</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!form.watch("city")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir la commune" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCommunes.map((commune) => (
                            <SelectItem key={commune} value={commune}>
                              {commune}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Informations légales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: TAX789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foundedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année de création</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 2020"
                          min="1900"
                          max={new Date().getFullYear()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Statut */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut de l'entreprise</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Une entreprise inactive ne peut pas créer de nouveaux
                      voyages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Mettre à jour
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
