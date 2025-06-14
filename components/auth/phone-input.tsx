"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_COUNTRIES, getCountryByCode } from "@/constants/countries";
import { useEffect, useState } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryCodeChange: (code: string) => void;
  initialCountryCode?: string; // New prop for initial country code
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  onCountryCodeChange,
  initialCountryCode,
  error,
  required = false,
  label = "Téléphone",
  placeholder = "Numéro de téléphone",
}: PhoneInputProps) {
  const defaultCountry =
    ALL_COUNTRIES.find((c) => c.code === "SN") || ALL_COUNTRIES[0]; // Default to Senegal or first country
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    initialCountryCode || defaultCountry.code
  );

  useEffect(() => {
    // If initialCountryCode changes from parent, update internal state
    if (initialCountryCode && initialCountryCode !== selectedCountryCode) {
      setSelectedCountryCode(initialCountryCode);
    }
  }, [initialCountryCode]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    onCountryCodeChange(countryCode);
  };

  const currentCountry = getCountryByCode(selectedCountryCode);
  const prefix = currentCountry ? currentCountry.phonePrefix : "+";

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm sm:text-base">
        <Phone className="h-4 w-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex">
        <Select onValueChange={handleCountryChange} value={selectedCountryCode}>
          <SelectTrigger className="w-[100px] rounded-r-none border-r-0">
            <SelectValue placeholder="Pays">
              {currentCountry
                ? `${currentCountry.flag} ${currentCountry.phonePrefix}`
                : "Select"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ALL_COUNTRIES.map((country) => (
              <SelectItem key={country.id} value={country.code}>
                {country.flag} {country.name} ({country.phonePrefix})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "rounded-l-none transition-all duration-200 text-sm sm:text-base h-9 sm:h-10",
            error ? "border-red-500" : "focus:border-blue-500"
          )}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 animate-in slide-in-from-left-2">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
