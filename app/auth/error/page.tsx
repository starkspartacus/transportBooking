"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "Il y a un problème avec la configuration du serveur.",
  AccessDenied: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
  Verification: "Le token de vérification a expiré ou a déjà été utilisé.",
  Default: "Une erreur s'est produite lors de la connexion.",
  CredentialsSignin:
    "Identifiants incorrects. Veuillez vérifier votre email/téléphone et mot de passe.",
  EmailSignin: "Impossible d'envoyer l'email de connexion.",
  OAuthSignin: "Erreur lors de la connexion avec le fournisseur OAuth.",
  OAuthCallback: "Erreur lors du callback OAuth.",
  OAuthCreateAccount: "Impossible de créer le compte OAuth.",
  EmailCreateAccount: "Impossible de créer le compte avec cet email.",
  Callback: "Erreur lors du callback d'authentification.",
  OAuthAccountNotLinked: "Ce compte OAuth n'est pas lié à un compte existant.",
  SessionRequired: "Vous devez être connecté pour accéder à cette page.",
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "Default";

  const getErrorMessage = (errorCode: string): string => {
    return errorMessages[errorCode] || errorMessages.Default;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">
            Erreur d'authentification
          </CardTitle>
          <CardDescription className="mt-2">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Retourner à la connexion</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Retourner à l'accueil</Link>
          </Button>
          {error === "Configuration" && (
            <div className="text-center text-sm text-gray-600">
              <p>Si le problème persiste, contactez l'administrateur.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
