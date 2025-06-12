"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Trip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  company: {
    name: string;
  };
  bus: {
    model: string;
    brand?: string;
  };
}

interface GuestBookingFormProps {
  trip: Trip;
  onBookingComplete: (bookingData: any) => void;
}

export default function GuestBookingForm({
  trip,
  onBookingComplete,
}: GuestBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Passenger Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+221",

    // Additional Info
    emergencyContact: "",
    emergencyPhone: "",
    specialRequests: "",

    // Booking Details
    numberOfSeats: 1,
    paymentMethod: "CASH", // CASH, MOBILE_MONEY, CARD
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    }
    if (formData.numberOfSeats > trip.availableSeats) {
      newErrors.numberOfSeats = `Maximum ${trip.availableSeats} places disponibles`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        tripId: trip.id,
        passengerName: `${formData.firstName} ${formData.lastName}`,
        passengerEmail: formData.email,
        passengerPhone: formData.phone,
        countryCode: formData.countryCode,
        numberOfSeats: formData.numberOfSeats,
        totalAmount: trip.price * formData.numberOfSeats,
        paymentMethod: formData.paymentMethod,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        specialRequests: formData.specialRequests,
      };

      const response = await fetch("/api/bookings/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Réservation créée avec succès !");
        onBookingComplete(result);
      } else {
        toast.error(result.error || "Erreur lors de la réservation");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = trip.price * formData.numberOfSeats;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Trip Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Récapitulatif du voyage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Trajet</p>
              <p className="font-semibold">
                {trip.departureCity} → {trip.arrivalCity}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Compagnie</p>
              <p className="font-semibold">{trip.company.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horaire</p>
              <p className="font-semibold">
                {trip.departureTime} - {trip.arrivalTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Véhicule</p>
              <p className="font-semibold">
                {trip.bus.brand} {trip.bus.model}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passenger Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations du passager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className={`pl-10 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) =>
                        handleInputChange("countryCode", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+221">🇸🇳 +221</SelectItem>
                        <SelectItem value="+225">🇨🇮 +225</SelectItem>
                        <SelectItem value="+228">🇹🇬 +228</SelectItem>
                        <SelectItem value="+229">🇧🇯 +229</SelectItem>
                        <SelectItem value="+226">🇧🇫 +226</SelectItem>
                        <SelectItem value="+223">🇲🇱 +223</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        className={`pl-10 ${
                          errors.phone ? "border-red-500" : ""
                        }`}
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Contact d'urgence (optionnel)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Nom du contact</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        handleInputChange("emergencyContact", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Téléphone</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        handleInputChange("emergencyPhone", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Demandes spéciales</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Allergies, besoins spéciaux, etc."
                    value={formData.specialRequests}
                    onChange={(e) =>
                      handleInputChange("specialRequests", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Détails de la réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="numberOfSeats">Nombre de places</Label>
                  <Select
                    value={formData.numberOfSeats.toString()}
                    onValueChange={(value) =>
                      handleInputChange("numberOfSeats", Number.parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: Math.min(trip.availableSeats, 10) },
                        (_, i) => i + 1
                      ).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} place{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.numberOfSeats && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.numberOfSeats}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prix unitaire</span>
                    <span>{trip.price.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre de places</span>
                    <span>{formData.numberOfSeats}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">
                      {totalPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Mode de paiement</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleInputChange("paymentMethod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Paiement à la gare</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CARD">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentMethod === "CASH" && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Vous devrez payer à la gare avant le départ. Présentez
                      votre code de réservation.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                  disabled={loading}
                  size="lg"
                >
                  {loading
                    ? "Réservation en cours..."
                    : "Confirmer la réservation"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
