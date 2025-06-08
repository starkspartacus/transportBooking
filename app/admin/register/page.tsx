"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Shield, EyeOff, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères"),
  secretKey: z.string().min(1, "La clé secrète est requise"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [secretKeyVerified, setSecretKeyVerified] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      secretKey: "",
    },
  });

  const verifySecretKey = async (secretKey: string) => {
    if (!secretKey) return;

    setVerifyingKey(true);
    try {
      const response = await fetch("/api/admin/check-secret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      const result = await response.json();

      if (result.valid) {
        setSecretKeyVerified(true);
        toast.success("Clé secrète valide");
      } else {
        setSecretKeyVerified(false);
        toast.error("Clé secrète invalide");
      }
    } catch (error) {
      console.error("Error verifying secret key:", error);
      toast.error("Erreur lors de la vérification de la clé");
      setSecretKeyVerified(false);
    } finally {
      setVerifyingKey(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!secretKeyVerified) {
      await verifySecretKey(data.secretKey);
      if (!secretKeyVerified) return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur s'est produite");
      }

      toast.success("Compte administrateur créé avec succès");
      router.push("/admin");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du compte"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à l'accueil
            </Link>
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Créer un compte administrateur
          </CardTitle>
          <CardDescription className="text-center">
            Cette page est réservée à la création de comptes administrateurs
            système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clé secrète</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••••"
                          {...field}
                          className={
                            secretKeyVerified ? "border-green-500" : ""
                          }
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => verifySecretKey(field.value)}
                        disabled={verifyingKey || !field.value}
                      >
                        {verifyingKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Vérifier"
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {secretKeyVerified && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••••"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !secretKeyVerified}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer le compte administrateur"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Cette page est protégée et nécessite une clé secrète fournie par le
            créateur de l'application.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
