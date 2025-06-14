"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Search, Clock, Bus, Filter, Star, Heart, Luggage } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ALL_COUNTRIES } from "@/constants/countries";
import { TripCard } from "@/components/search/trip-card"; // Import TripCard
import type { TripWithDetails } from "@/lib/types"; // Import TripWithDetails type

interface Company {
  id: string;
  name: string;
  logo: string;
  country: string;
  city: string;
  commune: string;
  rating?: number;
  totalTrips?: number;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  status: string;
  expiresAt: string;
  totalAmount: number;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  trip: {
    departureTime: string;
    arrivalTime: string;
    route: {
      departureLocation: string;
      arrivalLocation: string;
    };
    bus: {
      plateNumber: string;
      model: string;
      brand?: string;
    };
    company: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  tickets: Array<{
    id: string;
    ticketNumber: string;
    qrCode?: string;
    status: string;
    seatNumber: number;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    method: string;
  }>;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trips, setTrips] = useState<TripWithDetails[]>([]); // Use TripWithDetails
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<TripWithDetails[]>([]); // Use TripWithDetails
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(
    null
  );
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    companyId: "",
    country: "",
    city: "",
    commune: "",
    departureTime: "",
    searchQuery: "",
    priceRange: "",
    amenities: "",
    sortBy: "departure",
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  useEffect(() => {
    fetchCompanies();
    fetchTrips();
    fetchReservations();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trips, filters]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      // Fetch all trips without specific filters initially
      const response = await fetch("/api/trips");
      const result = await response.json();
      if (response.ok) {
        setTrips(result.trips);
        setFilteredTrips(result.trips);
      } else {
        console.error("Failed to fetch trips:", result.error);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/client/reservations");
      const data = await response.json();
      if (response.ok) {
        setReservations(data);
      } else {
        console.error(
          "Failed to fetch reservations:",
          data.error,
          data.details
        );
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem("favorite-companies");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (companyId: string) => {
    const newFavorites = favorites.includes(companyId)
      ? favorites.filter((id) => id !== companyId)
      : [...favorites, companyId];

    setFavorites(newFavorites);
    localStorage.setItem("favorite-companies", JSON.stringify(newFavorites));
  };

  const handleCountryChange = (country: string) => {
    setFilters((prev) => ({ ...prev, country, city: "", commune: "" }));
    const countryData = ALL_COUNTRIES.find((c) => c.name === country);
    setAvailableCities(countryData?.cities?.map((c) => c.name) || []);
    setAvailableCommunes([]);
  };

  const handleCityChange = (city: string) => {
    setFilters((prev) => ({ ...prev, city, commune: "" }));
    const countryData = ALL_COUNTRIES.find((c) => c.name === filters.country);
    const cityData = countryData?.cities?.find((c) => c.name === city);
    setAvailableCommunes(cityData?.communes || []);
  };

  const applyFilters = () => {
    if (!Array.isArray(trips)) {
      setFilteredTrips([]);
      return;
    }

    let filtered = [...trips];

    // Apply company filter
    if (filters.companyId && filters.companyId !== "all") {
      filtered = filtered.filter(
        (trip) => trip.company.id === filters.companyId
      );
    }

    // Apply country filter (departure or arrival country)
    if (filters.country && filters.country !== "all") {
      filtered = filtered.filter(
        (trip) =>
          trip.route.departureCountry === filters.country ||
          trip.route.arrivalCountry === filters.country
      );
    }

    // Apply city filter (departure or arrival city)
    if (filters.city && filters.city !== "all") {
      filtered = filtered.filter(
        (trip) =>
          trip.route.departureLocation.includes(filters.city) ||
          trip.route.arrivalLocation.includes(filters.city)
      );
    }

    // Apply departure time filter
    if (filters.departureTime && filters.departureTime !== "all") {
      const selectedHour = Number.parseInt(filters.departureTime);
      filtered = filtered.filter((trip) => {
        const departureHour = new Date(trip.departureTime).getHours();
        // Filter for trips departing within the specified 6-hour block
        if (selectedHour === 6) return departureHour >= 6 && departureHour < 12;
        if (selectedHour === 12)
          return departureHour >= 12 && departureHour < 18;
        if (selectedHour === 18)
          return departureHour >= 18 && departureHour <= 23;
        if (selectedHour === 0) return departureHour >= 0 && departureHour < 6;
        return true; // Should not happen with valid values
      });
    }

    // Apply price range filter
    if (filters.priceRange && filters.priceRange !== "all") {
      const [min, maxStr] = filters.priceRange.split("-");
      const minPrice = Number(min);
      const maxPrice = maxStr ? Number(maxStr) : Number.POSITIVE_INFINITY;

      filtered = filtered.filter((trip) => {
        const price = trip.currentPrice;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.route.departureLocation.toLowerCase().includes(query) ||
          trip.route.arrivalLocation.toLowerCase().includes(query) ||
          trip.company.name.toLowerCase().includes(query) ||
          trip.bus.model.toLowerCase().includes(query) ||
          trip.bus.brand?.toLowerCase().includes(query) ||
          trip.bus.model?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.currentPrice - b.currentPrice;
        case "price-high":
          return b.currentPrice - a.currentPrice;
        case "rating":
          return (b.company.rating || 0) - (a.company.rating || 0);
        case "departure":
        default:
          return (
            new Date(a.departureTime).getTime() -
            new Date(b.departureTime).getTime()
          );
      }
    });

    setFilteredTrips(filtered);
  };

  const resetFilters = () => {
    setFilters({
      companyId: "",
      country: "",
      city: "",
      commune: "",
      departureTime: "",
      searchQuery: "",
      priceRange: "",
      amenities: "",
      sortBy: "departure",
    });
    setAvailableCities([]);
    setAvailableCommunes([]);
  };

  const bookTrip = (trip: TripWithDetails) => {
    setSelectedTrip(trip);
    router.push(`/booking/${trip.id}`);
  };

  const viewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const cancelReservation = async (reservationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?"))
      return;

    try {
      const response = await fetch(
        `/api/client/reservations/${reservationId}/cancel`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchReservations();
        setSelectedReservation(null);
        alert("Réservation annulée avec succès");
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("Erreur lors de l'annulation de la réservation");
    }
  };

  const shareTrip = (trip: TripWithDetails) => {
    if (navigator.share) {
      navigator.share({
        title: `Voyage ${trip.route.departureLocation} - ${trip.route.arrivalLocation}`,
        text: `Découvrez ce voyage avec ${trip.company.name}`,
        url: `${window.location.origin}/trips/${trip.id}`, // Share specific trip URL
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/trips/${trip.id}`
      );
      alert("Lien copié dans le presse-papiers");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            En attente
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Confirmée
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Annulée
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Expirée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Programmé
          </Badge>
        );
      case "BOARDING":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Embarquement
          </Badge>
        );
      case "DEPARTED":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            En route
          </Badge>
        );
      case "ARRIVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Arrivé
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Annulé
          </Badge>
        );
      case "DELAYED":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Retardé
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">TransportApp</h1>
            <p className="text-sm text-gray-600">
              Bonjour, {session?.user?.name}
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenue, {session?.user?.name}
              </h1>
              <p className="text-gray-600">
                Trouvez et réservez votre prochain voyage
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button
                variant="outline"
                onClick={() => router.push("/settings")}
              >
                Mon profil
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-green-600"
                onClick={() => router.push("/search")}
              >
                Rechercher un voyage
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="trips" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trips">Voyages</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Voyages disponibles
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, sortBy: value }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="departure">Heure départ</SelectItem>
                        <SelectItem value="price-low">
                          Prix croissant
                        </SelectItem>
                        <SelectItem value="price-high">
                          Prix décroissant
                        </SelectItem>
                        <SelectItem value="rating">Note</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                {/* Search and Filters */}
                <div
                  className={`space-y-4 transition-all duration-300 ease-in-out ${
                    showFilters
                      ? "max-h-screen opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Rechercher un voyage..."
                          className="pl-8"
                          value={filters.searchQuery}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              searchQuery: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetFilters}>
                      Réinitialiser
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label>Entreprise</Label>
                      <Select
                        value={filters.companyId}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, companyId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Toutes les entreprises
                          </SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Pays</Label>
                      <Select
                        value={filters.country}
                        onValueChange={handleCountryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les pays</SelectItem>
                          {ALL_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Ville</Label>
                      <Select
                        value={filters.city}
                        onValueChange={handleCityChange}
                        disabled={!filters.country}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
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
                      <Label>Prix</Label>
                      <Select
                        value={filters.priceRange}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, priceRange: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les prix</SelectItem>
                          <SelectItem value="0-5000">0 - 5 000 FCFA</SelectItem>
                          <SelectItem value="5000-10000">
                            5 000 - 10 000 FCFA
                          </SelectItem>
                          <SelectItem value="10000-20000">
                            10 000 - 20 000 FCFA
                          </SelectItem>
                          <SelectItem value="20000">20 000+ FCFA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Heure</Label>
                      <Select
                        value={filters.departureTime}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            departureTime: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toute heure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toute heure</SelectItem>
                          <SelectItem value="6">Matin (6h-12h)</SelectItem>
                          <SelectItem value="12">
                            Après-midi (12h-18h)
                          </SelectItem>
                          <SelectItem value="18">Soir (18h-24h)</SelectItem>
                          <SelectItem value="0">Nuit (0h-6h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Trip List */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">
                        Chargement des voyages...
                      </p>
                    </div>
                  ) : filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun voyage ne correspond à vos critères</p>
                      <Button variant="link" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mes Réservations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservations.length > 0 ? (
                  reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {reservation.trip.route.departureLocation} →{" "}
                            {reservation.trip.route.arrivalLocation}
                          </p>
                          <p className="text-sm text-gray-600">
                            Code Réservation:{" "}
                            <span className="font-mono text-blue-700">
                              {reservation.reservationNumber}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Départ: {formatDate(reservation.trip.departureTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Arrivée: {formatDate(reservation.trip.arrivalTime)}
                          </p>
                          {reservation.tickets.map((ticket) => (
                            <p
                              key={ticket.id}
                              className="text-sm text-gray-600"
                            >
                              Siège {ticket.seatNumber}: {ticket.ticketNumber}
                            </p>
                          ))}
                          <p className="text-sm text-gray-600">
                            Montant:{" "}
                            <span className="font-bold text-green-600">
                              {reservation.totalAmount.toLocaleString()} FCFA
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(reservation.status)}
                          {reservation.status === "PENDING" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelReservation(reservation.id)}
                            >
                              Annuler
                            </Button>
                          )}
                          {reservation.tickets.some(
                            (ticket) => ticket.qrCode
                          ) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setShowQRCode(true);
                              }}
                            >
                              Voir QR Code
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Luggage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Vous n'avez aucune réservation pour le moment.</p>
                    <Button
                      variant="link"
                      onClick={() => router.push("/search")}
                    >
                      Rechercher un voyage
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Entreprises Partenaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {company.logo ? (
                            <img
                              src={company.logo || "/placeholder.svg"}
                              alt={company.name}
                              className="w-14 h-14 rounded-full object-contain"
                            />
                          ) : (
                            <Bus className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{company.name}</h3>
                          <p className="text-sm text-gray-600">
                            {company.city}, {company.country}
                          </p>
                          {company.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(company.rating)}
                              <span className="text-xs text-gray-600">
                                ({company.rating})
                              </span>
                            </div>
                          )}
                          {company.totalTrips !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              {company.totalTrips} voyages disponibles
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFavorite(company.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                favorites.includes(company.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              router.push(`/companies/${company.id}`)
                            }
                          >
                            Voir les voyages
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune entreprise partenaire trouvée.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code Dialog */}
      {selectedReservation && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            showQRCode ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center space-y-4 transform transition-transform duration-300 scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900">
              Votre Billet QR Code
            </h3>
            {selectedReservation.tickets.some((ticket) => ticket.qrCode) ? (
              <>
                {selectedReservation.tickets.map((ticket) => (
                  <p
                    key={ticket.id}
                    className="text-sm text-gray-700 font-medium"
                  >
                    Siège {ticket.seatNumber}: {ticket.ticketNumber}
                  </p>
                ))}
                <p className="text-xs text-gray-500">
                  Présentez ces QR codes au caissier pour validation.
                </p>
              </>
            ) : (
              <p className="text-red-500">QR Codes non disponibles.</p>
            )}
            <Button onClick={() => setShowQRCode(false)} className="w-full">
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
