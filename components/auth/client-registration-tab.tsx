"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chrome, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { AFRICAN_COUNTRIES } from "@/constants/countries";
import { InputField } from "./input-field";
import { CountrySelect } from "./country-select";
import { CitySelect } from "./city-select";
import { PhoneInput } from "./phone-input";
import { PasswordInput } from "./password-input";
import { SuccessAnimation } from "./success-animation";

interface FormErrors {
  [key: string]: string;
}

interface ClientRegistrationTabProps {
  onSuccess: (message: string) => void;
  onError: (errors: FormErrors) => void;
  errors: FormErrors;
  clearErrors: () => void;
}

export function ClientRegistrationTab({
  onSuccess,
  onError,
  errors,
  clearErrors,
}: ClientRegistrationTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [clientForm, setClientForm] = useState({
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
  });

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!clientForm.firstName?.trim()) newErrors.firstName = "Prénom requis";
    if (!clientForm.lastName?.trim()) newErrors.lastName = "Nom requis";
    if (!clientForm.email?.trim()) newErrors.email = "Email requis";
    if (!clientForm.phone?.trim()) newErrors.phone = "Téléphone requis";
    if (!clientForm.password?.trim())
      newErrors.password = "Mot de passe requis";
    if (clientForm.password && clientForm.password.length < 8)
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    if (clientForm.password !== clientForm.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!clientForm.country) newErrors.country = "Pays requis";
    if (!clientForm.city) newErrors.city = "Ville requise";

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
        (c) => c.code === clientForm.country
      );

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${clientForm.firstName} ${clientForm.lastName}`,
          email: clientForm.email,
          phone: clientForm.phone,
          password: clientForm.password,
          countryCode: selectedCountryData?.phonePrefix,
          country: clientForm.country,
          city: clientForm.city,
          commune: clientForm.commune,
          address: clientForm.address,
          role: "CLIENT",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessAnimation(true);
        // Reset form
        setClientForm({
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
        });
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
      console.error("Registration error:", error);
      onError({ general: "Erreur lors de l'inscription" });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCountryPrefix = () => {
    const country = AFRICAN_COUNTRIES.find(
      (c) => c.code === clientForm.country
    );
    return country?.phonePrefix || "+XXX";
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            label="Prénom"
            value={clientForm.firstName}
            onChange={(value: string) =>
              setClientForm((prev) => ({ ...prev, firstName: value }))
            }
            placeholder="Votre prénom"
            required
            error={errors.firstName}
          />
          <InputField
            id="lastName"
            label="Nom"
            value={clientForm.lastName}
            onChange={(value: string) =>
              setClientForm((prev) => ({ ...prev, lastName: value }))
            }
            placeholder="Votre nom"
            required
            error={errors.lastName}
          />
        </div>

        <InputField
          id="email"
          label="Email"
          type="email"
          value={clientForm.email}
          onChange={(value: string) =>
            setClientForm((prev) => ({ ...prev, email: value }))
          }
          placeholder="votre@email.com"
          required
          error={errors.email}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CountrySelect
            value={clientForm.country}
            onChange={(country: string) =>
              setClientForm((prev) => ({
                ...prev,
                country,
                city: "",
                commune: "",
              }))
            }
            error={errors.country}
            required
          />
          <PhoneInput
            value={clientForm.phone}
            onChange={(phone: string) =>
              setClientForm((prev) => ({ ...prev, phone }))
            }
            prefix={getSelectedCountryPrefix()}
            error={errors.phone}
            required
          />
        </div>

        <CitySelect
          country={clientForm.country}
          city={clientForm.city}
          commune={clientForm.commune}
          onCityChange={(city: string) =>
            setClientForm((prev) => ({ ...prev, city, commune: "" }))
          }
          onCommuneChange={(commune: string) =>
            setClientForm((prev) => ({ ...prev, commune }))
          }
          cityError={errors.city}
        />

        <InputField
          id="address"
          label="Adresse"
          value={clientForm.address}
          onChange={(value: string) =>
            setClientForm((prev) => ({ ...prev, address: value }))
          }
          placeholder="Adresse complète"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PasswordInput
            id="password"
            label="Mot de passe"
            value={clientForm.password}
            onChange={(value: string) =>
              setClientForm((prev) => ({ ...prev, password: value }))
            }
            required
            error={errors.password}
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirmer le mot de passe"
            value={clientForm.confirmPassword}
            onChange={(value: string) =>
              setClientForm((prev) => ({ ...prev, confirmPassword: value }))
            }
            required
            error={errors.confirmPassword}
          />
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] h-11 sm:h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "Créer mon compte client"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full hover:bg-gray-50 transition-all duration-200 h-11 sm:h-12"
            onClick={() => signIn("google")}
          >
            <Chrome className="h-4 w-4 mr-2" />
            Continuer avec Google
          </Button>
        </div>
      </form>

      <SuccessAnimation
        isVisible={showSuccessAnimation}
        title="🎉 Bienvenue !"
        message="Votre compte client a été créé avec succès ! Vous pouvez maintenant vous connecter et commencer à réserver vos billets de transport."
        onClose={() => setShowSuccessAnimation(false)}
        onContinue={() => {
          setShowSuccessAnimation(false);
          signIn();
        }}
        type="client"
      />
    </>
  );
}
