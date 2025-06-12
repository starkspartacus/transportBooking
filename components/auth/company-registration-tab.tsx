"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Building2, FileText, Lock, Loader2 } from "lucide-react";
import {
  AFRICAN_COUNTRIES,
  getCitiesByCountryCode,
  getCommunesByCity,
} from "@/constants/countries";
import { InputField } from "./input-field";
import { CountrySelect } from "./country-select";
import { CitySelect } from "./city-select";
import { PhoneInput } from "./phone-input";
import { PasswordInput } from "./password-input";

interface FormErrors {
  [key: string]: string;
}

interface CompanyRegistrationTabProps {
  onSuccess: (message: string) => void;
  onError: (errors: FormErrors) => void;
  errors: FormErrors;
  clearErrors: () => void;
}

export function CompanyRegistrationTab({
  onSuccess,
  onError,
  errors,
  clearErrors,
}: CompanyRegistrationTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  const [form, setForm] = useState({
    // Owner info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    commune: "",
    address: "",
    // Company info
    companyName: "",
    companyDescription: "",
    companyEmail: "",
    companyAddress: "",
    licenseNumber: "",
  });

  const handleCountryChange = (countryCode: string) => {
    clearErrors();
    const country = AFRICAN_COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(countryCode);
      const cities = getCitiesByCountryCode(countryCode);
      setAvailableCities(cities.map((city) => city.name));
      setAvailableCommunes([]);
      setForm((prev) => ({
        ...prev,
        country: countryCode,
        city: "",
        commune: "",
      }));
    }
  };

  const handleCityChange = (city: string) => {
    clearErrors();
    const communes = getCommunesByCity(selectedCountry, city);
    setAvailableCommunes(communes);
    setForm((prev) => ({ ...prev, city, commune: "" }));
  };

  const getSelectedCountryPrefix = () => {
    const country = AFRICAN_COUNTRIES.find((c) => c.code === selectedCountry);
    return country?.phonePrefix || "+XXX";
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Owner validation
    if (!form.firstName?.trim()) newErrors.firstName = "Prénom requis";
    if (!form.lastName?.trim()) newErrors.lastName = "Nom requis";
    if (!form.email?.trim()) newErrors.email = "Email requis";
    if (!form.phone?.trim()) newErrors.phone = "Téléphone requis";
    if (!form.password?.trim()) newErrors.password = "Mot de passe requis";
    if (form.password && form.password.length < 8)
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!form.country) newErrors.country = "Pays requis";
    if (!form.city) newErrors.city = "Ville requise";

    // Company validation
    if (!form.companyName?.trim())
      newErrors.companyName = "Nom de l'entreprise requis";
    if (!form.companyEmail?.trim())
      newErrors.companyEmail = "Email de l'entreprise requis";
    if (!form.companyAddress?.trim())
      newErrors.companyAddress = "Adresse de l'entreprise requise";
    if (!form.licenseNumber?.trim())
      newErrors.licenseNumber = "Numéro de licence requis";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      onError(formErrors);
      return;
    }

    setIsLoading(true);
    try {
      const selectedCountryData = AFRICAN_COUNTRIES.find(
        (c) => c.code === form.country
      );

      const response = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Données du responsable
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          password: form.password,
          countryCode: selectedCountryData?.phonePrefix,
          country: form.country,
          city: form.city,
          commune: form.commune,
          address: form.address,
          // Données de l'entreprise
          companyName: form.companyName,
          companyDescription: form.companyDescription,
          companyEmail: form.companyEmail,
          companyAddress: form.companyAddress,
          licenseNumber: form.licenseNumber,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(
          "Inscription de l'entreprise réussie! En attente de validation."
        );
        // Reset form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          country: "",
          city: "",
          commune: "",
          address: "",
          companyName: "",
          companyDescription: "",
          companyEmail: "",
          companyAddress: "",
          licenseNumber: "",
        });
        setSelectedCountry("");
        setAvailableCities([]);
        setAvailableCommunes([]);
      } else {
        if (result.errors) {
          const apiErrors: FormErrors = {};
          result.errors.forEach((error: any) => {
            apiErrors[error.path[0]] = error.message;
          });
          onError(apiErrors);
        } else {
          onError({
            general: result.message || "Erreur lors de l'inscription",
          });
        }
      }
    } catch (error) {
      console.error("Company registration error:", error);
      onError({ general: "Erreur lors de l'inscription de l'entreprise" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Owner Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-medium">
            Informations du responsable
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InputField
            id="ownerFirstName"
            label="Prénom du responsable"
            value={form.firstName}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, firstName: value }))
            }
            placeholder="Prénom"
            required
            error={errors.firstName}
          />
          <InputField
            id="ownerLastName"
            label="Nom du responsable"
            value={form.lastName}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, lastName: value }))
            }
            placeholder="Nom"
            required
            error={errors.lastName}
          />
        </div>

        <InputField
          id="ownerEmail"
          label="Email du responsable"
          type="email"
          value={form.email}
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          placeholder="email@exemple.com"
          required
          error={errors.email}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <CountrySelect
            value={form.country}
            onChange={handleCountryChange}
            error={errors.country}
            required
          />
          <PhoneInput
            value={form.phone}
            onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            prefix={getSelectedCountryPrefix()}
            error={errors.phone}
            required
          />
        </div>

        <CitySelect
          country={form.country}
          city={form.city}
          commune={form.commune}
          onCityChange={handleCityChange}
          onCommuneChange={(commune) =>
            setForm((prev) => ({ ...prev, commune }))
          }
          cityError={errors.city}
        />

        <InputField
          id="ownerAddress"
          label="Adresse du responsable"
          value={form.address}
          onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
          placeholder="Adresse complète"
        />
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          <h3 className="text-base sm:text-lg font-medium">
            Informations de l'entreprise
          </h3>
        </div>

        <InputField
          id="companyName"
          label="Nom de l'entreprise"
          value={form.companyName}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, companyName: value }))
          }
          placeholder="Nom de votre entreprise"
          required
          error={errors.companyName}
        />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4" />
            Description de l'entreprise
          </Label>
          <Textarea
            value={form.companyDescription}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                companyDescription: e.target.value,
              }))
            }
            placeholder="Décrivez votre entreprise de transport..."
            className="min-h-[80px] sm:min-h-[100px] transition-all duration-200 focus:border-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InputField
            id="companyEmail"
            label="Email de l'entreprise"
            type="email"
            value={form.companyEmail}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, companyEmail: value }))
            }
            placeholder="contact@entreprise.com"
            required
            error={errors.companyEmail}
          />
          <InputField
            id="licenseNumber"
            label="Numéro de licence"
            value={form.licenseNumber}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, licenseNumber: value }))
            }
            placeholder="Numéro de licence de transport"
            required
            error={errors.licenseNumber}
          />
        </div>

        <InputField
          id="companyAddress"
          label="Adresse de l'entreprise"
          value={form.companyAddress}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, companyAddress: value }))
          }
          placeholder="Adresse complète de l'entreprise"
          required
          error={errors.companyAddress}
        />
      </div>

      {/* Password */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-medium">Sécurité</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <PasswordInput
            id="companyPassword"
            label="Mot de passe"
            value={form.password}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, password: value }))
            }
            error={errors.password}
            required
          />
          <PasswordInput
            id="companyConfirmPassword"
            label="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, confirmPassword: value }))
            }
            error={errors.confirmPassword}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] h-10 sm:h-12 text-sm sm:text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inscription en cours...
          </>
        ) : (
          "Créer mon compte entreprise"
        )}
      </Button>
    </form>
  );
}
