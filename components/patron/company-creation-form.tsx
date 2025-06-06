"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Users,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { AFRICAN_COUNTRIES } from "@/constants/countries";

// Schema de validation pour le formulaire d'entreprise
const companySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().min(1, "Code pays requis"),
  address: z.string().min(10, "Adresse complète requise"),
  country: z.string().min(1, "Pays requis"),
  city: z.string().min(1, "Ville requise"),
  commune: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  licenseNumber: z.string().min(3, "Numéro de licence requis"),
  taxId: z.string().optional(),
  foundedYear: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]),
  operatingCountries: z
    .array(z.string())
    .min(1, "Au moins un pays d'opération requis"),
  services: z.array(z.string()).min(1, "Au moins un service requis"),
  vehicleTypes: z
    .array(z.string())
    .min(1, "Au moins un type de véhicule requis"),
});

type CompanyFormData = z.infer<typeof companySchema>;

const COMPANY_SERVICES = [
  { id: "passenger", label: "Transport de passagers", icon: Users },
  { id: "cargo", label: "Transport de marchandises", icon: Building },
  { id: "express", label: "Service express", icon: CheckCircle },
  { id: "luxury", label: "Transport de luxe", icon: Building },
  { id: "intercity", label: "Transport interurbain", icon: MapPin },
  { id: "international", label: "Transport international", icon: Globe },
];

const VEHICLE_TYPES = [
  { id: "minibus", label: "Minibus (8-15 places)", capacity: "8-15" },
  { id: "bus", label: "Bus standard (16-35 places)", capacity: "16-35" },
  { id: "coach", label: "Car de tourisme (36-55 places)", capacity: "36-55" },
  { id: "luxury_bus", label: "Bus de luxe (20-45 places)", capacity: "20-45" },
  {
    id: "double_decker",
    label: "Bus à étage (60-80 places)",
    capacity: "60-80",
  },
];

export default function CompanyCreationForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingCountries, setOperatingCountries] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>(
    []
  );

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
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
      licenseNumber: "",
      taxId: "",
      foundedYear: "",
      size: "SMALL",
      operatingCountries: [],
      services: [],
      vehicleTypes: [],
    },
  });

  const addOperatingCountry = (countryCode: string) => {
    if (!operatingCountries.includes(countryCode)) {
      const newCountries = [...operatingCountries, countryCode];
      setOperatingCountries(newCountries);
      form.setValue("operatingCountries", newCountries);
    }
  };

  const removeOperatingCountry = (countryCode: string) => {
    const newCountries = operatingCountries.filter((c) => c !== countryCode);
    setOperatingCountries(newCountries);
    form.setValue("operatingCountries", newCountries);
  };

  const toggleService = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter((s) => s !== serviceId)
      : [...selectedServices, serviceId];
    setSelectedServices(newServices);
    form.setValue("services", newServices);
  };

  const toggleVehicleType = (typeId: string) => {
    const newTypes = selectedVehicleTypes.includes(typeId)
      ? selectedVehicleTypes.filter((t) => t !== typeId)
      : [...selectedVehicleTypes, typeId];
    setSelectedVehicleTypes(newTypes);
    form.setValue("vehicleTypes", newTypes);
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof CompanyFormData)[] => {
    switch (step) {
      case 1:
        return ["name", "description", "size"];
      case 2:
        return [
          "email",
          "phone",
          "countryCode",
          "address",
          "country",
          "city",
          "licenseNumber",
        ];
      case 3:
        return ["operatingCountries"];
      case 4:
        return ["services", "vehicleTypes"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/patron/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          operatingCountries: operatingCountries,
          services: selectedServices,
          vehicleTypes: selectedVehicleTypes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Succès !",
          description:
            "Votre entreprise a été créée avec succès. Elle est en attente de vérification.",
        });
        router.push(`/patron/companies/${result.company.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Informations de base
              </h2>
              <p className="text-gray-600">
                Commençons par les informations essentielles de votre entreprise
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Transport Express Abidjan"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choisissez un nom professionnel et mémorable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description de l'entreprise *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre entreprise, vos services, votre mission..."
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Une description détaillée aidera les clients à mieux vous
                      connaître
                    </FormDescription>
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
                      defaultValue={field.value}
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Contact et localisation
              </h2>
              <p className="text-gray-600">
                Informations de contact et adresse de votre entreprise
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email professionnel *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="contact@votreentreprise.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code pays *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AFRICAN_COUNTRIES.map((country) => (
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adresse complète de votre siège social..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays *</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir le pays" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AFRICAN_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.flag} {country.name}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Abidjan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de licence *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Ex: LIC123456"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Zones d'opération
              </h2>
              <p className="text-gray-600">
                Dans quels pays votre entreprise opère-t-elle ?
              </p>
            </div>

            <div>
              <FormLabel>Pays d'opération *</FormLabel>
              <FormDescription className="mb-3">
                Sélectionnez tous les pays où votre entreprise opère
              </FormDescription>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {AFRICAN_COUNTRIES.map((country) => (
                  <Button
                    key={country.code}
                    type="button"
                    variant={
                      operatingCountries.includes(country.code)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      operatingCountries.includes(country.code)
                        ? removeOperatingCountry(country.code)
                        : addOperatingCountry(country.code)
                    }
                    className="justify-start"
                  >
                    <span className="mr-2">{country.flag}</span>
                    {country.name}
                  </Button>
                ))}
              </div>

              {operatingCountries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {operatingCountries.map((countryCode) => {
                    const country = AFRICAN_COUNTRIES.find(
                      (c) => c.code === countryCode
                    );
                    return (
                      <Badge key={countryCode} variant="secondary">
                        {country?.flag} {country?.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Services et véhicules
              </h2>
              <p className="text-gray-600">
                Quels services proposez-vous et quels types de véhicules
                utilisez-vous ?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <FormLabel>Services proposés *</FormLabel>
                <FormDescription className="mb-3">
                  Sélectionnez tous les services que vous proposez
                </FormDescription>

                <div className="grid grid-cols-2 gap-3">
                  {COMPANY_SERVICES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <Card
                        key={service.id}
                        className={`cursor-pointer transition-all ${
                          selectedServices.includes(service.id)
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{service.label}</span>
                            {selectedServices.includes(service.id) && (
                              <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <FormLabel>Types de véhicules *</FormLabel>
                <FormDescription className="mb-3">
                  Sélectionnez les types de véhicules de votre flotte
                </FormDescription>

                <div className="space-y-3">
                  {VEHICLE_TYPES.map((vehicle) => (
                    <Card
                      key={vehicle.id}
                      className={`cursor-pointer transition-all ${
                        selectedVehicleTypes.includes(vehicle.id)
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => toggleVehicleType(vehicle.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{vehicle.label}</div>
                            <div className="text-sm text-gray-500">
                              Capacité: {vehicle.capacity} passagers
                            </div>
                          </div>
                          {selectedVehicleTypes.includes(vehicle.id) && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            Créer une nouvelle entreprise
          </h1>
          <p className="text-gray-600">
            Étape {currentStep} sur {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Précédent
                </Button>

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Création en cours...
                      </>
                    ) : (
                      "Créer l'entreprise"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
