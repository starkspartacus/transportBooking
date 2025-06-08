import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès non autorisé
          </CardTitle>
          <CardDescription className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500">
            <p>Cette page est réservée aux utilisateurs autorisés.</p>
            <p>
              Veuillez vous connecter avec un compte approprié ou contacter
              l'administrateur.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <LogIn className="mr-2 h-4 w-4" />
                Se connecter
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Code d'erreur: 403 - Forbidden
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
