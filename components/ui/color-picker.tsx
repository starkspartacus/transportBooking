"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  textColor: string;
}

interface ColorPickerProps {
  colors: ColorOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ColorPicker({
  colors,
  value,
  onValueChange,
  placeholder = "Sélectionner une couleur",
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedColor = colors.find((color) => color.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedColor ? (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span>{selectedColor.name}</span>
            </div>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-60 overflow-auto">
          {colors.map((color) => (
            <div
              key={color.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                value === color.id && "bg-accent"
              )}
              onClick={() => {
                onValueChange(color.id);
                setOpen(false);
              }}
            >
              <div
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center"
                style={{ backgroundColor: color.hex }}
              >
                {value === color.id && (
                  <Check
                    className="w-3 h-3"
                    style={{ color: color.textColor }}
                  />
                )}
              </div>
              <span className="flex-1">{color.name}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
