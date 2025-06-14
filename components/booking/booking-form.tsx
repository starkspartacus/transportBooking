"use client";

import { useState, useMemo, useEffect } from "react";
import { useSocket } from "@/components/ui/socket-provider";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, CreditCard, ArrowLeft, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/auth/phone-input";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TripWithDetails } from "@/lib/types"; // Import TripWithDetails

// Type pour les détails de passager
const passengerSchema = z.object({
  seatNumber: z.string(), // Add seatNumber to link passenger to seat
  name: z.string().min(2, "Le nom est requis."),
  phone: z.string().min(8, "Le numéro de téléphone est requis."),
  countryCode: z.string().optional(),
  email: z.string().email("Email invalide.").optional().or(z.literal("")), // Added email field
});

// Schéma du formulaire de réservation
const formSchema = z.object({
  selectedSeats: z
    .array(z.string())
    .min(1, "Veuillez choisir au moins un siège.")
    .max(2, "Vous ne pouvez réserver que 2 sièges maximum."),
  passengers: z.array(passengerSchema), // Removed length constraint, will validate manually
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE_MONEY"], {
    required_error: "Veuillez choisir un mode de paiement.",
  }),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  trip: TripWithDetails; // Utilisez TripWithDetails ici
  onBookingComplete: (booking: any) => void;
}

export default function BookingForm({
  trip,
  onBookingComplete,
}: BookingFormProps) {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]); // Seats already confirmed
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]); // Current user's selected seats

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedSeats: [],
      passengers: [],
      paymentMethod: "CASH", // Default payment method
    },
    mode: "onChange",
  });

  const { watch, setValue, formState, getValues, trigger } = form;

  const currentSelectedSeats = watch("selectedSeats");
  const currentPassengers = watch("passengers");
  const currentPaymentMethod = watch("paymentMethod");

  // Initialize occupied seats from trip data
  useEffect(() => {
    if (trip.reservations) {
      const confirmedSeats = trip.reservations.flatMap((res) =>
        res.status === "CONFIRMED" ||
        res.status === "CHECKED_IN" ||
        res.status === "PENDING" // Include PENDING reservations as occupied
          ? res.seatNumbers.map((s) => s.toString())
          : []
      );
      setOccupiedSeats(confirmedSeats);
    }
  }, [trip.reservations]);

  // Listen for real-time updates for confirmed reservations
  useEffect(() => {
    if (socket) {
      const handleNewReservation = (data: any) => {
        if (data.reservation && data.reservation.tripId === trip.id) {
          const newOccupiedSeats = data.reservation.seatNumbers.map(
            (s: number) => s.toString()
          );
          setOccupiedSeats((prev) =>
            Array.from(new Set([...prev, ...newOccupiedSeats]))
          );
          toast({
            title: "Mise à jour en temps réel",
            description: `Un siège a été réservé sur ce voyage : ${newOccupiedSeats.join(
              ", "
            )}`,
            variant: "info",
          });
        }
      };

      socket.on("new-reservation", handleNewReservation);

      // Clean up on unmount
      return () => {
        socket.off("new-reservation", handleNewReservation);
      };
    }
  }, [socket, trip.id, toast]);

  const generateSeatNumbers = (capacity: number) => {
    return Array.from(
      { length: capacity },
      (_, i) => `${Math.floor(i / 4) + 1}${String.fromCharCode(65 + (i % 4))}`
    );
  };

  const allSeats = useMemo(
    () => generateSeatNumbers(trip.bus.capacity),
    [trip.bus.capacity]
  );

  const handleSeatClick = (seatNumber: string) => {
    if (occupiedSeats.includes(seatNumber)) {
      toast({
        title: "Siège non disponible",
        description: "Ce siège est déjà réservé.",
        variant: "destructive",
      });
      return;
    }

    const currentSeats = getValues("selectedSeats");
    if (currentSeats.includes(seatNumber)) {
      setValue(
        "selectedSeats",
        currentSeats.filter((s) => s !== seatNumber)
      );
    } else {
      if (currentSeats.length < 2) {
        setValue("selectedSeats", [...currentSeats, seatNumber]);
      } else {
        toast({
          title: "Limite de sièges atteinte",
          description: "Vous ne pouvez réserver que 2 sièges maximum.",
          variant: "warning",
        });
      }
    }
    // Update passenger form fields when seats change
    const newSelectedSeats = form.getValues("selectedSeats");
    const newPassengers = newSelectedSeats.map((seat) => {
      const existingPassenger = currentPassengers.find(
        (p) => p.seatNumber === seat
      );
      return (
        existingPassenger || {
          seatNumber: seat,
          name: "",
          phone: "",
          countryCode: "",
          email: "",
        }
      ); // Added email
    });
    setValue("passengers", newPassengers);
  };

  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger("selectedSeats");
      if (isValid) {
        // Initialize passenger details for newly selected seats
        const updatedPassengers = getValues("selectedSeats").map((seat) => {
          const existing = getValues("passengers").find(
            (p) => p.seatNumber === seat
          );
          return (
            existing || {
              seatNumber: seat,
              name: "",
              phone: "",
              countryCode: "",
              email: "",
            }
          ); // Added email
        });
        setValue("passengers", updatedPassengers);
      }
    } else if (currentStep === 2) {
      isValid = await trigger("passengers");
      if (isValid) {
        const passengers = getValues("passengers");
        if (passengers.length !== currentSelectedSeats.length) {
          isValid = false;
          toast({
            title: "Erreur de passagers",
            description:
              "Veuillez fournir les détails pour chaque siège sélectionné.",
            variant: "destructive",
          });
        } else if (passengers.some((p) => !p.name || !p.phone)) {
          isValid = false;
          toast({
            title: "Informations manquantes",
            description:
              "Veuillez remplir le nom et le numéro de téléphone pour tous les passagers.",
            variant: "destructive",
          });
        }
      }
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Informations manquantes",
        description:
          "Veuillez remplir tous les champs requis avant de passer à l'étape suivante.",
        variant: "destructive",
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (values: BookingFormValues) => {
    setIsLoading(true);
    try {
      let response;
      let bookingData;

      if (values.paymentMethod === "MOBILE_MONEY") {
        // Initiate CinetPay payment
        response = await fetch("/api/payments/mobile-money/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: trip.id,
            passengerName:
              values.passengers[0]?.name || session?.user?.name || "Passager",
            passengerPhone:
              values.passengers[0]?.phone || session?.user?.phone || "",
            passengerEmail:
              values.passengers[0]?.email || session?.user?.email || "",
            seatNumbers: values.selectedSeats.map((s) =>
              Number.parseInt(s, 10)
            ), // Pass as numbers
            totalAmount: trip.currentPrice * values.selectedSeats.length,
            companyId: trip.company.id,
            passengerDetails: values.passengers, // Pass full passenger details for callback
          }),
        });
        bookingData = await response.json();

        if (response.ok) {
          onBookingComplete({
            paymentRequired: true,
            paymentUrl: bookingData.paymentUrl,
            message: bookingData.message,
          });
        } else {
          toast({
            title: "Erreur de paiement",
            description:
              bookingData.error ||
              "Une erreur est survenue lors de l'initialisation du paiement.",
            variant: "destructive",
          });
        }
      } else {
        // Direct booking for CASH or CARD (tickets generated immediately)
        response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: trip.id,
            selectedSeats: values.selectedSeats.map((seat, index) => ({
              seatNumber: seat,
              name:
                values.passengers[index]?.name ||
                session?.user?.name ||
                "Passager",
              phone:
                values.passengers[index]?.phone || session?.user?.phone || "",
              countryCode:
                values.passengers[index]?.countryCode ||
                session?.user?.countryCode ||
                "",
              email:
                values.passengers[index]?.email || session?.user?.email || "",
            })),
            paymentMethod: values.paymentMethod,
          }),
        });
        bookingData = await response.json();

        if (response.ok) {
          // Generate WhatsApp message content
          const ticketNumbers = bookingData.tickets
            .map((t: any) => t.ticketNumber)
            .join(", ");
          const whatsappMessage = encodeURIComponent(
            `Félicitations pour votre réservation ! Voici vos codes de ticket: ${ticketNumbers}. Scannez les QR codes en gare. Vous devrez être en gare 2 heures avant le départ afin de confirmer votre réservation en caisse.`
          );
          const passengerPhone =
            values.passengers[0]?.phone || session?.user?.phone || "";
          const countryCode =
            values.passengers[0]?.countryCode ||
            session?.user?.countryCode ||
            "";

          const fullPhoneNumberForWhatsapp = `${countryCode.replace(
            /\+/g,
            ""
          )}${passengerPhone.replace(/^0+/, "")}`;
          const whatsappLink = `https://wa.me/${fullPhoneNumberForWhatsapp}?text=${whatsappMessage}`;

          onBookingComplete({
            ...bookingData,
            paymentRequired: false,
            whatsappLink: whatsappLink,
            whatsappMessage: decodeURIComponent(whatsappMessage),
          });
        } else {
          toast({
            title: "Erreur de réservation",
            description:
              bookingData.error ||
              "Une erreur est survenue lors de la réservation.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Erreur inattendue",
        description: "Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableSeatsCount = trip.bus.capacity - occupiedSeats.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Trip Details (always visible) */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Départ</p>
              <p className="font-medium">{trip.route.departureLocation}</p>
              <p className="text-sm text-gray-600">
                {new Date(trip.departureTime).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Arrivée</p>
              <p className="font-medium">{trip.route.arrivalLocation}</p>
              <p className="text-sm text-gray-600">
                {new Date(trip.arrivalTime).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {availableSeatsCount} places disponibles
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {trip.bus.plateNumber}
              </Badge>{" "}
            </div>
            <div className="text-2xl font-bold text-green-600">
              {trip.currentPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Step 1: Seat Selection */}
        {currentStep === 1 && (
          <div className="transition-all duration-300 ease-in-out">
            <Label className="text-base font-medium">
              Choisir votre siège(s)
            </Label>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {allSeats.map((seatNumber) => {
                const isOccupied = occupiedSeats.includes(seatNumber);
                const isSelected = currentSelectedSeats.includes(seatNumber);
                const isAvailable = !isOccupied;

                return (
                  <Button
                    key={seatNumber}
                    variant={
                      isSelected
                        ? "default"
                        : isOccupied
                        ? "destructive"
                        : "outline"
                    }
                    className={cn(
                      "h-12 transition-all duration-200",
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      isOccupied &&
                        "bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300"
                    )}
                    onClick={() => handleSeatClick(seatNumber)}
                    disabled={isOccupied}
                  >
                    {seatNumber}
                  </Button>
                );
              })}
            </div>
            {formState.errors.selectedSeats && (
              <p className="text-sm font-medium text-destructive mt-2">
                {formState.errors.selectedSeats.message}
              </p>
            )}
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={currentSelectedSeats.length === 0}
              className="mt-6 w-full transition-all duration-200"
            >
              Suivant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Passenger Details */}
        {currentStep === 2 && (
          <div className="transition-all duration-300 ease-in-out">
            <h3 className="text-base font-medium mb-4">
              Détails du/des passager(s)
            </h3>
            {currentSelectedSeats.length > 0 ? (
              currentSelectedSeats.map((seat, index) => (
                <Card
                  key={seat}
                  className="mb-4 p-4 shadow-sm transition-all duration-200"
                >
                  <CardTitle className="text-lg mb-4">Siège {seat}</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom Complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du passager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro WhatsApp</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              onCountryCodeChange={(code) =>
                                setValue(
                                  `passengers.${index}.countryCode`,
                                  code
                                )
                              }
                              initialCountryCode={getValues(
                                `passengers.${index}.countryCode`
                              )} // Pass initial country code
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optionnel)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Email du passager"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun siège sélectionné. Veuillez revenir à l'étape précédente.
              </p>
            )}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="transition-all duration-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={
                  !formState.isValid ||
                  currentPassengers.length === 0 ||
                  currentPassengers.some((p) => !p.name || !p.phone)
                }
                className="transition-all duration-200"
              >
                Suivant <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Method & Summary */}
        {currentStep === 3 && (
          <div className="transition-all duration-300 ease-in-out">
            <h3 className="text-base font-medium mb-4">Mode de paiement</h3>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <Button
                        type="button"
                        variant={field.value === "CASH" ? "default" : "outline"}
                        className="flex items-center gap-2 transition-all duration-200"
                        onClick={() => field.onChange("CASH")}
                      >
                        <CreditCard className="h-4 w-4" />
                        Espèces à la gare
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "CARD" ? "default" : "outline"}
                        className="flex items-center gap-2 transition-all duration-200"
                        onClick={() => field.onChange("CARD")}
                      >
                        <CreditCard className="h-4 w-4" />
                        Carte bancaire
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === "MOBILE_MONEY" ? "default" : "outline"
                        }
                        className="flex items-center gap-2 transition-all duration-200"
                        onClick={() => field.onChange("MOBILE_MONEY")}
                      >
                        <CreditCard className="h-4 w-4" />
                        Mobile Money
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Booking Summary */}
            <div className="bg-secondary/10 p-4 rounded-lg mt-6 shadow-sm">
              <h3 className="font-medium mb-2">Résumé de la réservation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Siège(s):</span>
                  <span className="font-medium">
                    {currentSelectedSeats.join(", ")}
                  </span>
                </div>
                {currentSelectedSeats.map((seat, index) => (
                  <div
                    key={seat}
                    className="flex justify-between text-xs text-gray-700 ml-4"
                  >
                    <span>
                      Passager {index + 1} (Siège {seat}):
                    </span>
                    <span className="font-medium">
                      {currentPassengers[index]?.name} (
                      {currentPassengers[index]?.phone})
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Prix total:</span>
                  <span className="font-medium">
                    {(
                      trip.currentPrice * currentSelectedSeats.length
                    ).toLocaleString()}{" "}
                    FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode de paiement:</span>
                  <span className="font-medium">
                    {currentPaymentMethod === "CASH"
                      ? "Espèces"
                      : currentPaymentMethod === "CARD"
                      ? "Carte"
                      : "Mobile Money"}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Button */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="transition-all duration-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="transition-all duration-200"
              >
                {isLoading
                  ? "Réservation en cours..."
                  : "Confirmer la réservation"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
