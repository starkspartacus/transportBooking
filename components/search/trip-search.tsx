"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Calendar } from "lucide-react";

interface TripSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export interface SearchFilters {
  from: string;
  to: string;
  date: string;
  passengers: number;
}

export default function TripSearch({
  onSearch,
  loading = false,
}: TripSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Get today's date for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* From */}
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Départ
            </Label>
            <Input
              id="from"
              placeholder="Ville de départ"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Arrivée
            </Label>
            <Input
              id="to"
              placeholder="Ville d'arrivée"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              min={today}
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <Label htmlFor="passengers">Passagers</Label>
            <Select
              value={filters.passengers.toString()}
              onValueChange={(value) =>
                handleFilterChange("passengers", Number.parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} passager{num > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600"
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
