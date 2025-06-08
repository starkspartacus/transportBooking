"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CaissierLoginData {
  phone: string;
  countryCode: string;
  code: string;
}

export function CaissierLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CaissierLoginData>({
    defaultValues: {
      phone: "",
      countryCode: "CI",
      code: "",
    },
  });

  const onSubmit = async (data: CaissierLoginData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        phone: data.phone,
        countryCode: data.countryCode,
        code: data.code,
        role: "CAISSIER",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Échec de la connexion", {
          description: "Téléphone ou code d'accès incorrect",
        });
      } else {
        toast.success("Connexion réussie !", {
          description: "Redirection vers votre espace caissier...",
        });
        router.push("/caissier");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur de connexion", {
        description: "Une erreur s'est produite lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Connexion Caissier
        </CardTitle>
        <CardDescription className="text-center">
          Connectez-vous avec votre téléphone et code d'accès
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              rules={{
                required: "Le numéro de téléphone est requis",
                minLength: {
                  value: 8,
                  message: "Le numéro doit contenir au moins 8 chiffres",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      phoneValue={field.value}
                      countryCodeValue={form.watch("countryCode")}
                      onPhoneChange={(value) => {
                        field.onChange(value);
                        form.setValue("phone", value);
                      }}
                      onCountryCodeChange={(value) => {
                        form.setValue("countryCode", value);
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              rules={{
                required: "Le code d'accès est requis",
                minLength: {
                  value: 6,
                  message: "Le code doit contenir au moins 6 caractères",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code d'accès</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Entrez votre code d'accès"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Contactez votre superviseur si vous n'avez pas de code d'accès</p>
        </div>
      </CardContent>
    </Card>
  );
}
