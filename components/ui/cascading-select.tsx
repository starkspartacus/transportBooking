"use client";

import { useState, useEffect } from "react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AFRICAN_COUNTRIES,
  getCountryByCode,
  getCommunesByCity,
} from "@/constants/countries";

interface CascadingSelectProps {
  countryValue?: string;
  cityValue?: string;
  communeValue?: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  className?: string;
}

export function CascadingSelect({
  countryValue = "",
  cityValue = "",
  communeValue = "",
  onCountryChange,
  onCityChange,
  onCommuneChange,
  className,
}: CascadingSelectProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  // Initialiser les villes lorsque le pays change
  useEffect(() => {
    if (countryValue) {
      const country = getCountryByCode(countryValue);
      if (country) {
        const cities = country.cities.map((city) => city.name);
        setAvailableCities(cities);

        // Réinitialiser la ville et la commune si le pays change
        if (!cities.includes(cityValue)) {
          onCityChange("");
          onCommuneChange("");
        }
      } else {
        setAvailableCities([]);
        onCityChange("");
        onCommuneChange("");
      }
    } else {
      setAvailableCities([]);
      onCityChange("");
      onCommuneChange("");
    }
  }, [countryValue, cityValue, onCityChange, onCommuneChange]);

  // Initialiser les communes lorsque la ville change
  useEffect(() => {
    if (countryValue && cityValue) {
      const communes = getCommunesByCity(countryValue, cityValue);
      setAvailableCommunes(communes);

      // Réinitialiser la commune si la ville change
      if (!communes.includes(communeValue)) {
        onCommuneChange("");
      }
    } else {
      setAvailableCommunes([]);
      onCommuneChange("");
    }
  }, [countryValue, cityValue, communeValue, onCommuneChange]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <FormItem>
        <FormLabel>Pays</FormLabel>
        <Select value={countryValue} onValueChange={onCountryChange}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pays" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {AFRICAN_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Ville</FormLabel>
        <Select
          value={cityValue}
          onValueChange={onCityChange}
          disabled={!countryValue || availableCities.length === 0}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une ville" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Commune</FormLabel>
        <Select
          value={communeValue}
          onValueChange={onCommuneChange}
          disabled={!cityValue || availableCommunes.length === 0}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une commune" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {availableCommunes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </div>
  );
}
