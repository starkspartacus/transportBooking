"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCitiesByCountryCode,
  getCommunesByCity,
} from "@/constants/countries";

interface CitySelectProps {
  country: string;
  city: string;
  commune: string;
  onCityChange: (city: string) => void;
  onCommuneChange: (commune: string) => void;
  cityError?: string;
  communeError?: string;
}

export function CitySelect({
  country,
  city,
  commune,
  onCityChange,
  onCommuneChange,
  cityError,
  communeError,
}: CitySelectProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  // Update cities when country changes
  useEffect(() => {
    if (country) {
      const cities = getCitiesByCountryCode(country);
      setAvailableCities(cities.map((c) => c.name));
      setAvailableCommunes([]);
    } else {
      setAvailableCities([]);
      setAvailableCommunes([]);
    }
  }, [country]);

  // Update communes when city changes
  useEffect(() => {
    if (country && city) {
      const communes = getCommunesByCity(country, city);
      setAvailableCommunes(communes);
    } else {
      setAvailableCommunes([]);
    }
  }, [country, city]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* City Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm sm:text-base">
          <MapPin className="h-4 w-4" />
          Ville <span className="text-red-500">*</span>
        </Label>
        <Select value={city} onValueChange={onCityChange} disabled={!country}>
          <SelectTrigger
            className={cn(
              "transition-all duration-200 text-sm sm:text-base h-9 sm:h-10",
              cityError ? "border-red-500" : "focus:border-blue-500",
              !country && "opacity-50"
            )}
          >
            <SelectValue placeholder="Choisir la ville" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availableCities.map((cityName) => (
              <SelectItem key={cityName} value={cityName}>
                <span className="text-sm sm:text-base">{cityName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cityError && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 animate-in slide-in-from-left-2">
            <AlertCircle className="h-3 w-3" />
            {cityError}
          </div>
        )}
      </div>

      {/* Commune Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm sm:text-base">
          <MapPin className="h-4 w-4" />
          Commune
        </Label>
        <Select
          value={commune}
          onValueChange={onCommuneChange}
          disabled={!city}
        >
          <SelectTrigger
            className={cn(
              "transition-all duration-200 text-sm sm:text-base h-9 sm:h-10",
              communeError ? "border-red-500" : "focus:border-blue-500",
              !city && "opacity-50"
            )}
          >
            <SelectValue placeholder="Choisir la commune" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availableCommunes.map((communeName) => (
              <SelectItem key={communeName} value={communeName}>
                <span className="text-sm sm:text-base">{communeName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {communeError && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 animate-in slide-in-from-left-2">
            <AlertCircle className="h-3 w-3" />
            {communeError}
          </div>
        )}
      </div>
    </div>
  );
}
