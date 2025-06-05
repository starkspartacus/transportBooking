"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Clock, Bus, Ticket, AlertCircle, CheckCircle2, X, Filter } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface Company {
  id: string
  name: string
  logo: string
  country: string
  city: string
  commune: string
}

interface Trip {
  id: string
  departureTime: string
  arrivalTime: string
  availableSeats: number
  status: string
  route: {
    name: string
    price: number
    departure: {
      name: string
      city: string
      country: string
    }
    arrival: {
      name: string
      city: string
      country: string
    }
  }
  bus: {
    plateNumber: string
    model: string
  }
  company: {
    id: string
    name: string
    logo: string
  }
}

interface Reservation {
  id: string
  reservationCode: string
  status: string
  expiresAt: string
  totalAmount: number
  trip: {
    departureTime: string
    arrivalTime: string
    route: {
      departure: {
        name: string
      }
      arrival: {
        name: string
      }
    }
  }
  seat: {
    number: string
  }
  ticket?: {
    ticketCode: string
    qrCode: string
    status: string
  }
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    companyId: "",
    country: "",
    city: "",
    commune: "",
    departureTime: "",
    searchQuery: "",
  })

  // Countries, cities, communes data
  const countries = ["Sénégal", "Côte d'Ivoire", "Mali", "Burkina Faso", "Togo", "Bénin"]
  const cities = {
    Sénégal: ["Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor"],
    "Côte d'Ivoire": ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro"],
    Mali: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes"],
    "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora"],
    Togo: ["Lomé", "Sokodé", "Kara", "Atakpamé", "Dapaong"],
    Bénin: ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Bohicon"],
  }
  const communes = {
    Dakar: ["Plateau", "Médina", "Fann", "Mermoz", "Ouakam"],
    Abidjan: ["Cocody", "Yopougon", "Adjamé", "Plateau", "Marcory"],
    Bamako: ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V"],
  }

  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([])

  useEffect(() => {
    fetchCompanies()
    fetchTrips()
    fetchReservations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [trips, filters])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      const data = await response.json()
      setTrips(data)
      setFilteredTrips(data)
    } catch (error) {
      console.error("Error fetching trips:", error)
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/client/reservations")
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error("Error fetching reservations:", error)
    }
  }

  const handleCountryChange = (country: string) => {
    setFilters((prev) => ({ ...prev, country, city: "", commune: "" }))
    setAvailableCities(cities[country as keyof typeof cities] || [])
    setAvailableCommunes([])
  }

  const handleCityChange = (city: string) => {
    setFilters((prev) => ({ ...prev, city, commune: "" }))
    setAvailableCommunes(communes[city as keyof typeof communes] || [])
  }

  const applyFilters = () => {
    let filtered = [...trips]

    // Apply company filter
    if (filters.companyId) {
      filtered = filtered.filter((trip) => trip.company.id === filters.companyId)
    }

    // Apply country filter
    if (filters.country) {
      filtered = filtered.filter(
        (trip) => trip.route.departure.country === filters.country || trip.route.arrival.country === filters.country,
      )
    }

    // Apply city filter
    if (filters.city) {
      filtered = filtered.filter(
        (trip) => trip.route.departure.city === filters.city || trip.route.arrival.city === filters.city,
      )
    }

    // Apply departure time filter
    if (filters.departureTime) {
      const selectedHour = Number.parseInt(filters.departureTime)
      filtered = filtered.filter((trip) => {
        const departureHour = new Date(trip.departureTime).getHours()
        return departureHour === selectedHour
      })
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (trip) =>
          trip.route.departure.name.toLowerCase().includes(query) ||
          trip.route.arrival.name.toLowerCase().includes(query) ||
          trip.company.name.toLowerCase().includes(query),
      )
    }

    setFilteredTrips(filtered)
  }

  const resetFilters = () => {
    setFilters({
      companyId: "",
      country: "",
      city: "",
      commune: "",
      departureTime: "",
      searchQuery: "",
    })
    setAvailableCities([])
    setAvailableCommunes([])
  }

  const bookTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    router.push(`/booking/${trip.id}`)
  }

  const viewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
  }

  const cancelReservation = async (reservationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return

    try {
      const response = await fetch(`/api/client/reservations/${reservationId}/cancel`, {
        method: "POST",
      })

      if (response.ok) {
        fetchReservations()
        setSelectedReservation(null)
        alert("Réservation annulée avec succès")
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de l'annulation")
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      alert("Erreur lors de l'annulation de la réservation")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En attente
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Confirmée
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Annulée
          </Badge>
        )
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Expirée
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Programmé
          </Badge>
        )
      case "BOARDING":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Embarquement
          </Badge>
        )
      case "DEPARTED":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            En route
          </Badge>
        )
      case "ARRIVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Arrivé
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Annulé
          </Badge>
        )
      case "DELAYED":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Retardé
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bienvenue, {session?.user?.name}</h1>
              <p className="text-gray-600">Trouvez et réservez votre prochain voyage</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push("/profile")}>
                Mon profil
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600" onClick={() => router.push("/search")}>
                Rechercher un voyage
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trips">Voyages disponibles</TabsTrigger>
            <TabsTrigger value="reservations">Mes réservations</TabsTrigger>
            <TabsTrigger value="companies">Entreprises</TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Voyages disponibles
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters((prev) => ({ ...prev, showFilters: !prev.showFilters }))}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search and Filters */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Rechercher un voyage..."
                          className="pl-8"
                          value={filters.searchQuery}
                          onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetFilters}>
                      Réinitialiser
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Entreprise</Label>
                      <Select
                        value={filters.companyId}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, companyId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les entreprises" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les entreprises</SelectItem>
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
                      <Select value={filters.country} onValueChange={handleCountryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les pays" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les pays</SelectItem>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Ville</Label>
                      <Select value={filters.city} onValueChange={handleCityChange} disabled={!filters.country}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les villes" />
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
                      <Label>Heure de départ</Label>
                      <Select
                        value={filters.departureTime}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, departureTime: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toute heure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toute heure</SelectItem>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Trip List */}
                <div className="space-y-4">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                {trip.company.logo ? (
                                  <img
                                    src={trip.company.logo || "/placeholder.svg"}
                                    alt={trip.company.name}
                                    className="w-6 h-6"
                                  />
                                ) : (
                                  <Bus className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <span className="font-medium">{trip.company.name}</span>
                              {getTripStatusBadge(trip.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium">{trip.route.departure.name}</p>
                                    <p className="text-sm text-gray-600">{formatDate(trip.departureTime)}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium">{trip.route.arrival.name}</p>
                                    <p className="text-sm text-gray-600">{formatDate(trip.arrivalTime)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Bus className="h-3 w-3 text-gray-600" />
                                <span>{trip.bus.model}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-600" />
                                <span>
                                  {Math.round(
                                    (new Date(trip.arrivalTime).getTime() - new Date(trip.departureTime).getTime()) /
                                      (1000 * 60),
                                  )}{" "}
                                  min
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {trip.availableSeats} places disponibles
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-2xl font-bold text-green-600">
                              {trip.route.price.toLocaleString()} FCFA
                            </div>
                            <Button onClick={() => bookTrip(trip)} disabled={trip.availableSeats === 0}>
                              {trip.availableSeats === 0 ? "Complet" : "Réserver"}
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
                      <div key={reservation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {reservation.reservationCode}
                              </span>
                              {getStatusBadge(reservation.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium">{reservation.trip.route.departure.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(reservation.trip.departureTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium">{reservation.trip.route.arrival.name}</p>
                                    <p className="text-sm text-gray-600">{formatDate(reservation.trip.arrivalTime)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Ticket className="h-3 w-3 text-gray-600" />
                                <span>Siège {reservation.seat.number}</span>
                              </div>
                              {reservation.status === "PENDING" && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                  <span>Expire le {formatDate(reservation.expiresAt)}</span>
                                </div>
                              )}
                              {reservation.ticket && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Billet émis
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xl font-bold text-green-600">
                              {reservation.totalAmount.toLocaleString()} FCFA
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => viewReservation(reservation)}>
                                Détails
                              </Button>
                              {reservation.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => cancelReservation(reservation.id)}
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
                    <Button variant="link" onClick={() => router.push("/search")}>
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
                    <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {company.logo ? (
                            <img src={company.logo || "/placeholder.svg"} alt={company.name} className="w-8 h-8" />
                          ) : (
                            <Bus className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{company.name}</h3>
                          <p className="text-sm text-gray-600">
                            {company.city}, {company.country}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setFilters((prev) => ({ ...prev, companyId: company.id }))}
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
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Détails de la réservation</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Reservation Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Code de réservation</p>
                      <p className="font-mono font-medium">{selectedReservation.reservationCode}</p>
                    </div>
                    {getStatusBadge(selectedReservation.status)}
                  </div>

                  {/* Trip Details */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium">Détails du voyage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Départ</p>
                        <p className="font-medium">{selectedReservation.trip.route.departure.name}</p>
                        <p className="text-sm">{formatDate(selectedReservation.trip.departureTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Arrivée</p>
                        <p className="font-medium">{selectedReservation.trip.route.arrival.name}</p>
                        <p className="text-sm">{formatDate(selectedReservation.trip.arrivalTime)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Siège</p>
                      <p className="font-medium">{selectedReservation.seat.number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Montant</p>
                      <p className="font-medium text-green-600">
                        {selectedReservation.totalAmount.toLocaleString()} FCFA
                      </p>
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
                          <p className="text-sm text-gray-600">Code du billet</p>
                          <p className="font-mono font-medium">{selectedReservation.ticket.ticketCode}</p>
                        </div>

                        <div className="flex flex-col items-center">
                          {showQRCode ? (
                            <div className="bg-white p-4 rounded-lg">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedReservation.ticket.qrCode}`}
                                alt="QR Code"
                                className="w-48 h-48"
                              />
                              <p className="text-center text-sm mt-2 font-mono">{selectedReservation.ticket.qrCode}</p>
                            </div>
                          ) : (
                            <Button onClick={() => setShowQRCode(true)}>Afficher le QR Code</Button>
                          )}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <p>
                              Présentez ce billet et une pièce d'identité valide au guichet pour embarquer. Le billet
                              est personnel et non transférable.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    {selectedReservation.status === "PENDING" && (
                      <Button variant="destructive" onClick={() => cancelReservation(selectedReservation.id)}>
                        Annuler la réservation
                      </Button>
                    )}
                    <Button onClick={() => setSelectedReservation(null)}>Fermer</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
