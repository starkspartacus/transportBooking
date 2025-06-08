"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { Loader2, CreditCard, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CaissierLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("CI");
  const [code, setCode] = useState("");

  const handlePhoneChange = (value: string, country: any) => {
    setPhone(value);
    if (country?.iso2) {
      setCountryCode(country.iso2);
    }
  };

  const formatCode = (input: string) => {
    const alphanumeric = input.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
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
      // Vérifier d'abord le code d'accès
      const verifyResponse = await fetch("/api/auth/employee-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          countryCode,
          code,
          role: "CAISSIER",
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Code invalide");
      }

      // Si la vérification réussit, connecter avec NextAuth
      const result = await signIn("credentials", {
        phone,
        countryCode,
        code,
        role: "CAISSIER",
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Erreur de connexion");
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre espace caissier",
      });

      // Rediriger vers le dashboard caissier
      router.push("/caissier");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Espace Caissier
          </h1>
          <p className="text-gray-600">Connectez-vous pour gérer les ventes</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Connexion sécurisée
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Utilisez votre code d'accès fourni par votre gestionnaire
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Phone Input */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone
                </Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  defaultCountry="CI"
                  placeholder="Votre numéro de téléphone"
                  className="w-full"
                  required
                />
              </div>

              {/* Access Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Code d'accès
                </Label>
                <Input
                  id="code"
                  placeholder="EMP-XXXXXX"
                  value={code}
                  onChange={handleCodeChange}
                  className="uppercase font-mono text-center text-lg tracking-wider"
                  required
                />
                <p className="text-xs text-gray-500 text-center">
                  Code fourni par votre gestionnaire (format: EMP-XXXXXX)
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Première connexion ?</p>
                    <p>
                      Demandez votre code d'accès à votre gestionnaire. Ce code
                      est unique et sécurisé.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Accéder à mon espace
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Retour à la connexion générale
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-100">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">
              Gestion des ventes
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-100">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">
              Validation sécurisée
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
