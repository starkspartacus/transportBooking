"use client";

import type React from "react";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else if (result?.ok) {
        // Récupérer les informations de l'utilisateur pour déterminer le rôle
        try {
          const response = await fetch("/api/auth/me");
          if (!response.ok)
            throw new Error(
              "Erreur lors de la récupération des données utilisateur"
            );

          const userData = await response.json();

          // Rediriger en fonction du rôle
          let redirectPath = "/";

          switch (userData.role) {
            case "ADMIN":
              redirectPath = "/admin";
              break;
            case "PATRON":
              redirectPath = "/patron";
              break;
            case "GESTIONNAIRE":
              redirectPath = "/gestionnaire";
              break;
            case "CAISSIER":
              redirectPath = "/caissier";
              break;
            case "CLIENT":
              redirectPath = "/client";
              break;
            default:
              redirectPath = "/";
          }

          toast.success(`Bienvenue, ${userData.name || "utilisateur"}!`);
          router.push(redirectPath);
          router.refresh();
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle:", error);
          // En cas d'erreur, rediriger vers la page d'accueil par défaut
          router.push("/");
          router.refresh();
        }
      }
    } catch (error) {
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="exemple@email.com"
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            Mot de passe
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </div>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <div className="text-center">
        <a
          href="/auth/forgot-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Mot de passe oublié?
        </a>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>
    </div>
  );
}
