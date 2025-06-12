"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const bookingFormSchema = z.object({
  passengerName: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères"),
  passengerEmail: z.string().email("Email invalide"),
  passengerPhone: z.string().min(8, "Numéro de téléphone invalide"),
  countryCode: z.string().default("+221"),
  numberOfSeats: z.coerce.number().int().min(1).max(10),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD"]),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface GuestBookingFormProps {
  trip: any;
  departureCity: string;
  arrivalCity: string;
}

export default function GuestBookingForm({
  trip,
  departureCity,
  arrivalCity,
}: GuestBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengerName: "",
      passengerEmail: "",
      passengerPhone: "",
      countryCode: "+221",
      numberOfSeats: 1,
      paymentMethod: "CASH",
      emergencyContact: "",
      emergencyPhone: "",
      specialRequests: "",
    },
  });

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);

    try {
      const totalAmount = trip.currentPrice * data.numberOfSeats;

      const response = await fetch("/api/bookings/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tripId: trip.id,
          totalAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur s'est produite");
      }

      setBookingDetails(result);
      setBookingComplete(true);
      toast({
        title: "Réservation réussie",
        description: "Votre réservation a été enregistrée avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.message || "Une erreur s'est produite lors de la réservation",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (bookingComplete && bookingDetails) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800">
            Réservation confirmée !
          </h2>
          <p className="text-green-600 mt-2">
            Votre réservation a été enregistrée avec succès.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            Détails de la réservation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Numéro de réservation</p>
              <p className="font-medium">
                {bookingDetails.reservation.reservationNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Passager</p>
              <p className="font-medium">
                {bookingDetails.reservation.passengerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trajet</p>
              <p className="font-medium">
                {bookingDetails.trip.departureCity} →{" "}
                {bookingDetails.trip.arrivalCity}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Compagnie</p>
              <p className="font-medium">{bookingDetails.trip.company}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant total</p>
              <p className="font-medium text-primary">
                {bookingDetails.reservation.totalAmount.toLocaleString()} FCFA
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode de paiement</p>
              <p className="font-medium">
                {bookingDetails.reservation.paymentMethod === "CASH"
                  ? "Espèces (à la gare)"
                  : bookingDetails.reservation.paymentMethod === "MOBILE_MONEY"
                  ? "Mobile Money"
                  : "Carte bancaire"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
          {bookingDetails.reservation.paymentMethod === "CASH" ? (
            <p className="text-blue-700">
              Veuillez vous présenter à la gare au moins 30 minutes avant le
              départ avec votre numéro de réservation pour effectuer le paiement
              et récupérer votre ticket.
            </p>
          ) : bookingDetails.reservation.paymentMethod === "MOBILE_MONEY" ? (
            <p className="text-blue-700">
              Vous recevrez bientôt une notification pour effectuer le paiement
              par Mobile Money. Votre réservation sera confirmée après réception
              du paiement.
            </p>
          ) : (
            <p className="text-blue-700">
              Votre paiement est en cours de traitement. Vous recevrez une
              confirmation par email une fois le paiement validé.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex-1 sm:flex-initial"
          >
            Retour à l'accueil
          </Button>
          <Button
            onClick={() => router.push("/search")}
            className="flex-1 sm:flex-initial"
          >
            Rechercher d'autres voyages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="passengerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez votre nom complet" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passengerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passengerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="bg-gray-100 border border-r-0 rounded-l-md px-3 flex items-center text-gray-600">
                      +221
                    </div>
                    <Input
                      className="rounded-l-none"
                      placeholder="77 123 45 67"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de places</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    {...field}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value);
                      if (value > 0 && value <= 10) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-800 mb-4">
            Contact d'urgence (optionnel)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du contact d'urgence" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone du contact</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 rounded-l-md px-3 flex items-center text-gray-600">
                        +221
                      </div>
                      <Input
                        className="rounded-l-none"
                        placeholder="77 123 45 67"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Demandes spéciales (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Indiquez toute demande particulière (assistance, bagages spéciaux, etc.)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-800 mb-4">Mode de paiement</h3>
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2 bg-white border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="CASH" id="cash" />
                      <FormLabel
                        htmlFor="cash"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">Paiement à la gare</div>
                        <div className="text-sm text-gray-500">
                          Payez en espèces au guichet avant le départ
                        </div>
                      </FormLabel>
                    </div>
                    <div className="flex items-center space-x-2 bg-white border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="MOBILE_MONEY" id="mobile" />
                      <FormLabel
                        htmlFor="mobile"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">Mobile Money</div>
                        <div className="text-sm text-gray-500">
                          Orange Money, Wave, Free Money, etc.
                        </div>
                      </FormLabel>
                    </div>
                    <div className="flex items-center space-x-2 bg-white border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="CARD" id="card" />
                      <FormLabel
                        htmlFor="card"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">Carte bancaire</div>
                        <div className="text-sm text-gray-500">
                          Visa, Mastercard, etc.
                        </div>
                      </FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">Prix total</p>
              <p className="text-2xl font-bold text-primary">
                {(
                  trip.currentPrice * form.watch("numberOfSeats")
                ).toLocaleString()}{" "}
                FCFA
              </p>
              <p className="text-xs text-gray-500">
                {form.watch("numberOfSeats")}{" "}
                {form.watch("numberOfSeats") > 1 ? "places" : "place"} x{" "}
                {trip.currentPrice.toLocaleString()} FCFA
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                "Confirmer la réservation"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            En confirmant cette réservation, vous acceptez les conditions
            générales de vente et la politique de confidentialité.
          </p>
        </div>
      </form>
    </Form>
  );
}
