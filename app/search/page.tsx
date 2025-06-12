"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  Users,
  Filter,
  Search,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Trip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  bus: {
    id: string;
    model: string;
    brand?: string;
    features: string[];
  };
  route: {
    id: string;
    name: string;
    distance: number;
    estimatedDuration: number;
  };
}

export default function SearchPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    date: "",
    minPrice: "",
    maxPrice: "",
    company: "",
    sortBy: "price",
  });

  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    fetchTrips();
    fetchCompanies();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/trips?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchTrips();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : ""}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                TransportApp
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="outline">Se connecter</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres de recherche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Origin/Destination */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="from">Ville de départ</Label>
                    <Input
                      id="from"
                      placeholder="Ex: Dakar"
                      value={filters.from}
                      onChange={(e) =>
                        handleFilterChange("from", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">Ville d'arrivée</Label>
                    <Input
                      id="to"
                      placeholder="Ex: Thiès"
                      value={filters.to}
                      onChange={(e) => handleFilterChange("to", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Date */}
                <div>
                  <Label htmlFor="date">Date de voyage</Label>
                  <Input
                    id="date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                  />
                </div>

                <Separator />

                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Fourchette de prix (FCFA)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Company */}
                <div>
                  <Label>Compagnie</Label>
                  <Select
                    value={filters.company}
                    onValueChange={(value) =>
                      handleFilterChange("company", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les compagnies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les compagnies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Sort */}
                <div>
                  <Label>Trier par</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Prix croissant</SelectItem>
                      <SelectItem value="price_desc">
                        Prix décroissant
                      </SelectItem>
                      <SelectItem value="departure">Heure de départ</SelectItem>
                      <SelectItem value="duration">Durée du voyage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full"
                  disabled={loading}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Recherche..." : "Rechercher"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Recherche de voyages
              </h1>
              <p className="text-gray-600">
                {trips.length} voyage{trips.length !== 1 ? "s" : ""} trouvé
                {trips.length !== 1 ? "s" : ""}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun voyage trouvé
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Essayez de modifier vos critères de recherche
                  </p>
                  <Button
                    onClick={() =>
                      setFilters({
                        from: "",
                        to: "",
                        date: "",
                        minPrice: "",
                        maxPrice: "",
                        company: "",
                        sortBy: "price",
                      })
                    }
                  >
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Trip Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">
                                {trip.departureCity}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-semibold">
                                {trip.arrivalCity}
                              </span>
                            </div>
                            <Badge variant="secondary">
                              {trip.company.name}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(
                                  new Date(`2000-01-01T${trip.departureTime}`),
                                  "HH:mm"
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(`2000-01-01T${trip.arrivalTime}`),
                                  "HH:mm"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {trip.availableSeats} places disponibles
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDuration(trip.route.estimatedDuration)}
                              </span>
                            </div>
                          </div>

                          {/* Bus Features */}
                          {trip.bus.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {trip.bus.features
                                .slice(0, 4)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {trip.bus.features.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{trip.bus.features.length - 4} autres
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Price and Action */}
                        <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                              <DollarSign className="h-5 w-5" />
                              {formatPrice(trip.price)} FCFA
                            </div>
                            <p className="text-sm text-gray-500">
                              par personne
                            </p>
                          </div>

                          <Link href={`/booking/${trip.id}`}>
                            <Button
                              className="bg-gradient-to-r from-blue-600 to-green-600"
                              disabled={trip.availableSeats === 0}
                            >
                              {trip.availableSeats === 0
                                ? "Complet"
                                : "Réserver"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
