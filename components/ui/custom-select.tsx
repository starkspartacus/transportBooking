"use client";

import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  onAddCustom?: (customValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customLabel?: string;
}

export function CustomSelect({
  options,
  value,
  onValueChange,
  onAddCustom,
  placeholder = "Sélectionner une option",
  searchPlaceholder = "Rechercher...",
  allowCustom = false,
  customLabel = "Ajouter personnalisé",
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  // Mémorisation pour éviter les re-calculs
  const selectedOption = React.useMemo(
    () => options.find((option) => option.id === value),
    [options, value]
  );

  const filteredOptions = React.useMemo(
    () =>
      options.filter((option) =>
        option.name.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  // Callbacks stables
  const handleAddCustom = React.useCallback(() => {
    if (customValue.trim() && onAddCustom) {
      onAddCustom(customValue.trim());
      setCustomValue("");
      setShowCustomInput(false);
      setOpen(false);
    }
  }, [customValue, onAddCustom]);

  const handleOptionSelect = React.useCallback(
    (optionId: string) => {
      onValueChange(optionId);
      setOpen(false);
      setSearch("");
    },
    [onValueChange]
  );

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearch("");
      setShowCustomInput(false);
      setCustomValue("");
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? selectedOption.name : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center px-3 py-2 cursor-pointer hover:bg-accent",
                value === option.id && "bg-accent"
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === option.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="flex-1">{option.name}</span>
            </div>
          ))}

          {filteredOptions.length === 0 && search && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          )}

          {allowCustom && (
            <>
              <Separator />
              {!showCustomInput ? (
                <div
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-blue-600"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>{customLabel}</span>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Entrer une valeur personnalisée"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustom();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddCustom}
                      disabled={!customValue.trim()}
                    >
                      Ajouter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomValue("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
