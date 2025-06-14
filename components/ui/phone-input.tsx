"use client";

import { useState, useEffect } from "react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_COUNTRIES } from "@/constants/countries";

interface PhoneInputProps {
  countryCodeValue?: string;
  phoneValue?: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  className?: string;
}

export function PhoneInput({
  countryCodeValue = "",
  phoneValue = "",
  onCountryCodeChange,
  onPhoneChange,
  className,
}: PhoneInputProps) {
  const [prefixes, setPrefixes] = useState<
    { code: string; prefix: string; flag: string }[]
  >([]);

  useEffect(() => {
    // Extraire les préfixes téléphoniques des pays
    const countryPrefixes = ALL_COUNTRIES.map((country) => ({
      code: country.code,
      prefix: country.phonePrefix,
      flag: country.flag,
    }));
    setPrefixes(countryPrefixes);
  }, []);

  return (
    <div className={`flex gap-4 ${className}`}>
      <FormItem className="w-1/3">
        <FormLabel>Indicatif</FormLabel>
        <Select value={countryCodeValue} onValueChange={onCountryCodeChange}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Indicatif" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {prefixes.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.flag} {item.prefix}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      <FormItem className="w-2/3">
        <FormLabel>Téléphone</FormLabel>
        <FormControl>
          <Input
            placeholder="77 123 45 67"
            value={phoneValue}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}
