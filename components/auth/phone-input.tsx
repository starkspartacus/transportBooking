"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  prefix: string;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  prefix,
  error,
  required = false,
  label = "Téléphone",
  placeholder = "Numéro de téléphone",
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm sm:text-base">
        <Phone className="h-4 w-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex">
        <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md text-sm text-gray-600">
          {prefix}
        </div>
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
