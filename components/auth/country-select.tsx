"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, MapPin } from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/constants/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function CountrySelect({
  value,
  onChange,
  error,
  required = false,
  label = "Pays",
}: CountrySelectProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm sm:text-base">
        <MapPin className="h-4 w-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "transition-all duration-200 text-sm sm:text-base h-9 sm:h-10",
            error ? "border-red-500" : "focus:border-blue-500"
          )}
        >
          <SelectValue placeholder="Choisir le pays" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {AFRICAN_COUNTRIES.map((country) => (
            <SelectItem key={country.id} value={country.code}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span className="text-sm sm:text-base">{country.name}</span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  ({country.phonePrefix})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 animate-in slide-in-from-left-2">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
