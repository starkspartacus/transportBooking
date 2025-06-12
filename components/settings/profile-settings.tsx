"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Camera,
  Save,
  RefreshCw,
  Edit3,
  Sparkles,
  Heart,
} from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/constants/countries";

interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  city: string;
  commune: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  language: string;
  theme: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+225",
    country: "CI",
    city: "",
    commune: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    nationality: "CI",
    language: "fr",
    theme: "light",
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
    },
  });

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        firstName: session.user.name.split(" ")[0] || "",
        lastName: session.user.name.split(" ")[1] || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
        countryCode: session.user.countryCode || "+225",
        country: session.user.country || "CI",
        city: session.user.city || "Abidjan",
        commune: session.user.commune || "Abidjan",
        address: session.user.address || "",
        dateOfBirth: session.user.dateOfBirth
          ? new Date(session.user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: session.user.gender || "MALE",
        nationality: session.user.nationality || "CI",
        language: session.user.language || "fr",
        theme: session.user.theme || "light",
        notificationPreferences: session.user.notificationPreferences || {
          email: true,
          sms: true,
          push: true,
        },
      });
    }
  }, [session]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        await update(); // Mettre à jour la session
        setIsEditing(false);
        toast({
          title: "✅ Profil mis à jour",
          description: "Vos informations ont été sauvegardées avec succès",
        });
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec avatar */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Profil Personnel
                </h2>
                <p className="text-sm text-gray-600 font-normal">
                  Gérez vos informations personnelles
                </p>
              </div>
            </CardTitle>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={
                isEditing
                  ? "border-2"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              }
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? "Annuler" : "Modifier"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                  {profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {profileData.name || "Nom non défini"}
              </h3>
              <p className="text-gray-600 mb-2">{profileData.email}</p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {profileData.city || "Ville non définie"}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  {profileData.countryCode} {profileData.phone || "Non défini"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
              <User className="h-5 w-5" />
            </div>
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label
                htmlFor="firstName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <User className="h-4 w-4 text-blue-500" />
                Prénom
              </Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                disabled={!isEditing}
                className="mt-2 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label
                htmlFor="lastName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <User className="h-4 w-4 text-green-500" />
                Nom
              </Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                disabled={!isEditing}
                className="mt-2 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Mail className="h-4 w-4 text-purple-500" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={!isEditing}
                className="mt-2 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="h-4 w-4 text-orange-500" />
                Téléphone
              </Label>
              <div className="flex gap-2 mt-2">
                <Select
                  value={profileData.countryCode}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, countryCode: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="w-24 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  className="border-2 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="dateOfBirth"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Calendar className="h-4 w-4 text-pink-500" />
                Date de naissance
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
                disabled={!isEditing}
                className="mt-2 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label
                htmlFor="gender"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Heart className="h-4 w-4 text-red-500" />
                Genre
              </Label>
              <Select
                value={profileData.gender}
                onValueChange={(value) =>
                  setProfileData((prev) => ({ ...prev, gender: value }))
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-2 border-2">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Homme</SelectItem>
                  <SelectItem value="FEMALE">Femme</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-500" />
              Adresse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={profileData.country}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, country: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-2 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.flag} {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  className="mt-2 border-2 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  value={profileData.commune}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      commune: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  className="mt-2 border-2 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse complète</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  className="mt-2 border-2 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Préférences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-500" />
              Préférences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Langue</Label>
                <Select
                  value={profileData.language}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, language: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-2 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="theme">Thème</Label>
                <Select
                  value={profileData.theme}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, theme: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-2 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Clair</SelectItem>
                    <SelectItem value="dark">🌙 Sombre</SelectItem>
                    <SelectItem value="auto">🔄 Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-2"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
