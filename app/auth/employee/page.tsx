"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("CI"); // Côte d'Ivoire par défaut
  const [code, setCode] = useState("");

  const handlePhoneChange = (value: string, country: any) => {
    setPhone(value);
    if (country?.iso2) {
      setCountryCode(country.iso2);
    }
  };

  const formatCode = (input: string) => {
    // Accepter uniquement les caractères alphanumériques
    const alphanumeric = input.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

    // Limiter à 10 caractères (EMP-XXXXXX)
    return alphanumeric.slice(0, 10);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !code) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          countryCode,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de la connexion");
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Rediriger vers le tableau de bord approprié
      router.push(data.redirectTo || "/");
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Connexion Employé
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous avec votre numéro de téléphone et votre code unique
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                defaultCountry="CI"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code d&apos;authentification</Label>
              <Input
                id="code"
                placeholder="EMP-XXXXXX"
                value={code}
                onChange={handleCodeChange}
                className="uppercase"
                required
              />
              <p className="text-xs text-gray-500">
                Entrez le code fourni par votre employeur
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
