"use client";

import type React from "react";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Phone, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AFRICAN_COUNTRIES, type Country } from "@/constants/countries";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    countryCode: "+221", // Default to Senegal
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier: formData.identifier,
        password: formData.password,
        countryCode: loginType === "phone" ? formData.countryCode : undefined,
        redirect: false,
      });

      if (result?.error) {
        console.error("Sign in error:", result.error);
      } else {
        // Get the session to determine user role
        const session = await getSession();
        if (session?.user?.role) {
          // Redirect based on user role
          switch (session.user.role) {
            case "CLIENT":
              router.push("/client");
              break;
            case "CASHIER":
              router.push("/caissier");
              break;
            case "MANAGER":
              router.push("/gestionnaire");
              break;
            case "PATRON":
              router.push("/patron");
              break;
            case "ADMIN":
              router.push("/admin");
              break;
            default:
              router.push(callbackUrl);
          }
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, countryCode: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Connexion
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error === "CredentialsSignin"
                  ? "Identifiants incorrects. Veuillez réessayer."
                  : "Une erreur s'est produite. Veuillez réessayer."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              type="button"
              variant={loginType === "email" ? "default" : "outline"}
              onClick={() => setLoginType("email")}
              className="flex-1"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              type="button"
              variant={loginType === "phone" ? "default" : "outline"}
              onClick={() => setLoginType("phone")}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              Téléphone
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {loginType === "email"
                  ? "Adresse email"
                  : "Numéro de téléphone"}
              </Label>
              <div className="flex space-x-2">
                {loginType === "phone" && (
                  <Select
                    value={formData.countryCode}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((country: Country) => (
                        <SelectItem
                          key={country.code}
                          value={country.phonePrefix}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.phonePrefix}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  id="identifier"
                  type={loginType === "email" ? "email" : "tel"}
                  placeholder={
                    loginType === "email" ? "votre@email.com" : "123456789"
                  }
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      identifier: e.target.value,
                    }))
                  }
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continuer avec
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Pas encore de compte ?{" "}
            </span>
            <Link href="/auth/signup" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
