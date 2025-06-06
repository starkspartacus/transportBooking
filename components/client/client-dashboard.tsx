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
import {
  Search,
  MapPin,
  Clock,
  Bus,
  Ticket,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
  Star,
  Heart,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AFRICAN_COUNTRIES } from "@/constants/countries";

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

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  status: string;
  route: {
    name: string;
    price: number;
    departure: {
      name: string;
      city: string;
      country: string;
    };
    arrival: {
      name: string;
      city: string;
      country: string;
    };
  };
  bus: {
    plateNumber: string;
    model: string;
    amenities?: string[];
  };
  company: {
    id: string;
    name: string;
    logo: string;
    rating?: number;
  };
}

interface Reservation {
  id: string;
  reservationCode: string;
  status: string;
  expiresAt: string;
  totalAmount: number;
  trip: {
    departureTime: string;
    arrivalTime: string;
    route: {
      departure: {
        name: string;
      };
      arrival: {
        name: string;
      };
    };
  };
  seat: {
    number: string;
  };
  ticket?: {
    ticketCode: string;
    qrCode: string;
    status: string;
  };
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch("/api/trips");
      const data = await response.json();
      setTrips(data);
      setFilteredTrips(data);
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
      setReservations(data);
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
    const countryData = AFRICAN_COUNTRIES.find((c) => c.name === country);
    setAvailableCities(countryData?.cities.map((c) => c.name) || []);
    setAvailableCommunes([]);
  };

  const handleCityChange = (city: string) => {
    setFilters((prev) => ({ ...prev, city, commune: "" }));
    const countryData = AFRICAN_COUNTRIES.find(
      (c) => c.name === filters.country
    );
    const cityData = countryData?.cities.find((c) => c.name === city);
    setAvailableCommunes(cityData?.communes || []);
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // Apply company filter
    if (filters.companyId) {
      filtered = filtered.filter(
        (trip) => trip.company.id === filters.companyId
      );
    }

    // Apply country filter
    if (filters.country) {
      filtered = filtered.filter(
        (trip) =>
          trip.route.departure.country === filters.country ||
          trip.route.arrival.country === filters.country
      );
    }

    // Apply city filter
    if (filters.city) {
      filtered = filtered.filter(
        (trip) =>
          trip.route.departure.city === filters.city ||
          trip.route.arrival.city === filters.city
      );
    }

    // Apply departure time filter
    if (filters.departureTime) {
      const selectedHour = Number.parseInt(filters.departureTime);
      filtered = filtered.filter((trip) => {
        const departureHour = new Date(trip.departureTime).getHours();
        return departureHour === selectedHour;
      });
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((trip) => {
        const price = trip.route.price;
        return price >= min && (max ? price <= max : true);
      });
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.route.departure.name.toLowerCase().includes(query) ||
          trip.route.arrival.name.toLowerCase().includes(query) ||
          trip.company.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.route.price - b.route.price;
        case "price-high":
          return b.route.price - a.route.price;
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

  const bookTrip = (trip: Trip) => {
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

  const shareTrip = (trip: Trip) => {
    if (navigator.share) {
      navigator.share({
        title: `Voyage ${trip.route.departure.name} - ${trip.route.arrival.name}`,
        text: `Découvrez ce voyage avec ${trip.company.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
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
              <Button variant="outline" onClick={() => router.push("/profile")}>
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
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          showFilters: !prev.showFilters,
                        }))
                      }
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                {/* Search and Filters */}
                <div className="space-y-4">
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
                          {AFRICAN_COUNTRIES.map((country) => (
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
                      <div
                        key={trip.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                {trip.company.logo ? (
                                  <img
                                    src={
                                      trip.company.logo || "/placeholder.svg"
                                    }
                                    alt={trip.company.name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <Bus className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {trip.company.name}
                                  </span>
                                  {trip.company.rating && (
                                    <div className="flex items-center gap-1">
                                      {renderStars(trip.company.rating)}
                                      <span className="text-xs text-gray-600">
                                        ({trip.company.rating})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleFavorite(trip.company.id)
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      favorites.includes(trip.company.id)
                                        ? "fill-red-500 text-red-500"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => shareTrip(trip)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">
                                      {trip.route.departure.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(trip.departureTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">
                                      {trip.route.arrival.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(trip.arrivalTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Bus className="h-3 w-3 text-gray-600" />
                                <span className="truncate">
                                  {trip.bus.model}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-600" />
                                <span>
                                  {Math.round(
                                    (new Date(trip.arrivalTime).getTime() -
                                      new Date(trip.departureTime).getTime()) /
                                      (1000 * 60)
                                  )}{" "}
                                  min
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {trip.availableSeats} places
                              </Badge>
                              {getTripStatusBadge(trip.status)}
                            </div>

                            {trip.bus.amenities &&
                              trip.bus.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {trip.bus.amenities
                                    .slice(0, 3)
                                    .map((amenity, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {amenity}
                                      </Badge>
                                    ))}
                                  {trip.bus.amenities.length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +{trip.bus.amenities.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="flex flex-col items-end gap-2 lg:min-w-[120px]">
                            <div className="text-xl lg:text-2xl font-bold text-green-600">
                              {trip.route.price.toLocaleString()} FCFA
                            </div>
                            <Button
                              onClick={() => bookTrip(trip)}
                              disabled={trip.availableSeats === 0}
                              className="w-full lg:w-auto"
                            >
                              {trip.availableSeats === 0
                                ? "Complet"
                                : "Réserver"}
                            </Button>
                          </div>
                        </div>
                      </div>
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
                  <Ticket className="h-5 w-5" />
                  Mes réservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {reservation.reservationCode}
                              </span>
                              {getStatusBadge(reservation.status)}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">
                                      {reservation.trip.route.departure.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(
                                        reservation.trip.departureTime
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">
                                      {reservation.trip.route.arrival.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(reservation.trip.arrivalTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Ticket className="h-3 w-3 text-gray-600" />
                                <span>Siège {reservation.seat.number}</span>
                              </div>
                              {reservation.status === "PENDING" && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs">
                                    Expire le{" "}
                                    {formatDate(reservation.expiresAt)}
                                  </span>
                                </div>
                              )}
                              {reservation.ticket && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Billet émis
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-lg lg:text-xl font-bold text-green-600">
                              {reservation.totalAmount.toLocaleString()} FCFA
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => viewReservation(reservation)}
                              >
                                Détails
                              </Button>
                              {reservation.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    cancelReservation(reservation.id)
                                  }
                                >
                                  Annuler
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Vous n'avez pas encore de réservation</p>
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
                  Entreprises de transport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {company.logo ? (
                            <img
                              src={company.logo || "/placeholder.svg"}
                              alt={company.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Bus className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">
                              {company.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(company.id)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favorites.includes(company.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {company.city}, {company.country}
                          </p>
                          {company.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(company.rating)}
                              <span className="text-xs text-gray-600">
                                ({company.totalTrips} voyages)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            companyId: company.id,
                          }))
                        }
                      >
                        Voir les voyages
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reservation Details Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    Détails de la réservation
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReservation(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Reservation Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Code de réservation
                      </p>
                      <p className="font-mono font-medium">
                        {selectedReservation.reservationCode}
                      </p>
                    </div>
                    {getStatusBadge(selectedReservation.status)}
                  </div>

                  {/* Trip Details */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium">Détails du voyage</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Départ</p>
                        <p className="font-medium">
                          {selectedReservation.trip.route.departure.name}
                        </p>
                        <p className="text-sm">
                          {formatDate(selectedReservation.trip.departureTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Arrivée</p>
                        <p className="font-medium">
                          {selectedReservation.trip.route.arrival.name}
                        </p>
                        <p className="text-sm">
                          {formatDate(selectedReservation.trip.arrivalTime)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Siège</p>
                        <p className="font-medium">
                          {selectedReservation.seat.number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Montant</p>
                        <p className="font-medium text-green-600">
                          {selectedReservation.totalAmount.toLocaleString()}{" "}
                          FCFA
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  {selectedReservation.ticket && (
                    <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium">Billet émis</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            Code du billet
                          </p>
                          <p className="font-mono font-medium">
                            {selectedReservation.ticket.ticketCode}
                          </p>
                        </div>

                        <div className="flex flex-col items-center">
                          {showQRCode ? (
                            <div className="bg-white p-4 rounded-lg">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedReservation.ticket.qrCode}`}
                                alt="QR Code"
                                className="w-48 h-48"
                              />
                              <p className="text-center text-sm mt-2 font-mono break-all">
                                {selectedReservation.ticket.qrCode}
                              </p>
                            </div>
                          ) : (
                            <Button onClick={() => setShowQRCode(true)}>
                              Afficher le QR Code
                            </Button>
                          )}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <p>
                              Présentez ce billet et une pièce d'identité valide
                              au guichet pour embarquer. Le billet est personnel
                              et non transférable.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col lg:flex-row justify-end gap-3">
                    {selectedReservation.status === "PENDING" && (
                      <Button
                        variant="destructive"
                        onClick={() =>
                          cancelReservation(selectedReservation.id)
                        }
                      >
                        Annuler la réservation
                      </Button>
                    )}
                    <Button onClick={() => setSelectedReservation(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
