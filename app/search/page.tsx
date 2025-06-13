"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripCard } from "@/components/search/trip-card";
import type { TripWithDetails, SearchFilters } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AFRICAN_COUNTRIES, type Country } from "@/constants/countries";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [totalTrips, setTotalTrips] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    from: searchParams?.get("from") || "",
    to: searchParams?.get("to") || "",
    date: searchParams?.get("date")
      ? new Date(searchParams.get("date") as string)
      : new Date(),
    minPrice: searchParams?.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : 0,
    maxPrice: searchParams?.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : 0,
    company: searchParams?.get("company") || "all",
    sortBy: searchParams?.get("sortBy") || "departure",
    departureCountry: searchParams?.get("departureCountry") || "",
    arrivalCountry: searchParams?.get("arrivalCountry") || "",
  });

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/trips?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      const data = await response.json();
      setTrips(data.trips);
      setTotalTrips(data.totalCount);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError("Impossible de charger les voyages. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCountries = useCallback(async () => {
    try {
      setAvailableCountries(AFRICAN_COUNTRIES.map((country) => country.name));
    } catch (err) {
      console.error("Error setting countries:", err);
    }
  }, []);

  const fetchCities = useCallback(
    async (country: string, type: "departure" | "arrival") => {
      if (!country) {
        setAvailableCities([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/locations/cities?country=${country}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch cities for ${country}`);
        }
        const data = await response.json();
        setAvailableCities(data.cities);
      } catch (err) {
        console.error(`Error fetching cities for ${country}:`, err);
        setAvailableCities([]);
      }
    },
    []
  );

  useEffect(() => {
    fetchTrips();
    fetchCountries();
  }, [fetchTrips, fetchCountries]);

  useEffect(() => {
    if (filters.departureCountry) {
      fetchCities(filters.departureCountry, "departure");
    } else {
      setAvailableCities([]);
    }
  }, [filters.departureCountry, fetchCities]);

  useEffect(() => {
    if (filters.arrivalCountry) {
      fetchCities(filters.arrivalCountry, "arrival");
    } else {
      setAvailableCities([]);
    }
  }, [filters.arrivalCountry, fetchCities]);

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | Date | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value instanceof Date ? format(value, "yyyy-MM-dd") : value,
    }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, String(value));
      }
    });
    router.push(`/search?${params.toString()}`);
    fetchTrips(); // Re-fetch trips with new filters
  };

  const sortOptions = [
    { value: "departure", label: "Heure de départ" },
    { value: "price", label: "Prix (croissant)" },
    { value: "price_desc", label: "Prix (décroissant)" },
    { value: "duration", label: "Durée du voyage" },
  ];

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Section */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" /> Filtres de recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label
                htmlFor="departureCountry"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pays de départ
              </label>
              <Select
                value={filters.departureCountry || ""}
                onValueChange={(value) =>
                  handleFilterChange("departureCountry", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="from"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ville de départ
              </label>
              <Select
                value={filters.from || ""}
                onValueChange={(value) => handleFilterChange("from", value)}
                disabled={
                  !filters.departureCountry || availableCities.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="arrivalCountry"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pays d'arrivée
              </label>
              <Select
                value={filters.arrivalCountry || ""}
                onValueChange={(value) =>
                  handleFilterChange("arrivalCountry", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="to"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ville d'arrivée
              </label>
              <Select
                value={filters.to || ""}
                onValueChange={(value) => handleFilterChange("to", value)}
                disabled={
                  !filters.arrivalCountry || availableCities.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date de voyage
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.date
                      ? format(new Date(filters.date), "dd/MM/yyyy")
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.date ? new Date(filters.date) : undefined}
                    onSelect={(date) =>
                      handleFilterChange("date", date || null)
                    }
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fourchette de prix (FCFA)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pays
              </label>
              <Select
                value={filters.company || "all"}
                onValueChange={(value) => handleFilterChange("company", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Trier par
              </label>
              <Select
                value={filters.sortBy || "departure"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Heure de départ" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300"
            >
              <Search className="mr-2 h-4 w-4" /> Rechercher
            </Button>
          </CardContent>
        </Card>

        {/* Trip Results Section */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Recherche de voyages
          </h2>
          <p className="text-gray-600">{totalTrips} voyages trouvés</p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : trips.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Aucun voyage trouvé pour vos critères de recherche.
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
