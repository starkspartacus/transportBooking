"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Phone } from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/constants/countries";

export function EmployeeLoginModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+225");
  const [code, setCode] = useState("");

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
        description: "Redirection vers votre dashboard...",
      });

      setIsOpen(false);

      // Rediriger vers le tableau de bord approprié
      if (data.user?.role === "CAISSIER") {
        router.push("/caissier");
      } else if (data.user?.role === "GESTIONNAIRE") {
        router.push("/gestionnaire");
      } else {
        router.push("/dashboard");
      }
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

  const resetForm = () => {
    setPhone("");
    setCode("");
    setCountryCode("+225");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700"
        >
          <CreditCard className="h-4 w-4" />
          Dashboard Caissier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Connexion Caissier
          </DialogTitle>
          <DialogDescription>
            Connectez-vous avec votre numéro de téléphone et votre code
            d'authentification
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Numéro de téléphone
            </Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country.id} value={country.phonePrefix}>
                      {country.flag} {country.phonePrefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="01 23 45 67 89"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code d'authentification</Label>
            <Input
              id="code"
              placeholder="EMP-XXXXXX"
              value={code}
              onChange={handleCodeChange}
              className="uppercase font-mono text-center"
              required
            />
            <p className="text-xs text-gray-500">
              Entrez le code fourni par votre patron
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !phone || !code}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
