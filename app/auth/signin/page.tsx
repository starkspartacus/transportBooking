"use client";

import type React from "react";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Users, Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Chargement dynamique du composant caissier
const DynamicCaissierLoginForm = dynamic(
  () =>
    import("@/components/auth/caissier-login-form").then((mod) => ({
      default: mod.CaissierLoginForm,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600">Chargement...</p>
        </div>
      </Card>
    ),
  }
);

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Connexion</h1>
          <p className="text-slate-600">Choisissez votre type de connexion</p>
        </div>

        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="caissier" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Caissiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Connexion Standard
                </CardTitle>
                <CardDescription>
                  Connectez-vous avec votre compte utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardLoginForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="caissier">
            <DynamicCaissierLoginForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StandardLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
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
        // Fetch user data to determine role
        const userResponse = await fetch("/api/auth/me");
        const userData = await userResponse.json();

        // Redirect based on role
        let redirectPath = "/";
        let roleName = "Utilisateur";

        switch (userData.role) {
          case "ADMIN":
            redirectPath = "/admin";
            roleName = "Administrateur";
            break;
          case "PATRON":
            redirectPath = "/patron";
            roleName = "Patron";
            break;
          case "GESTIONNAIRE":
            redirectPath = "/gestionnaire";
            roleName = "Gestionnaire";
            break;
          case "CAISSIER":
            redirectPath = "/caissier";
            roleName = "Caissier";
            break;
          case "CLIENT":
            redirectPath = "/client";
            roleName = "Client";
            break;
          default:
            redirectPath = "/";
        }

        toast.success(`Bienvenue ${userData.name}!`, {
          description: `Vous êtes connecté en tant que ${roleName}`,
        });

        router.push(redirectPath);
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Mail className="h-4 w-4 text-blue-600" />
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="exemple@email.com"
            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Lock className="h-4 w-4 text-blue-600" />
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full h-10 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>

      <div className="text-center">
        <a
          href="/auth/forgot-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Mot de passe oublié?
        </a>
      </div>
    </div>
  );
}
