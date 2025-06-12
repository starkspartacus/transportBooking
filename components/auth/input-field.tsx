"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm sm:text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "transition-all duration-200 text-sm sm:text-base h-9 sm:h-10",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "focus:border-blue-500 focus:ring-blue-500",
            className
          )}
          required={required}
        />
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
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
