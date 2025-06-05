"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Bus, CalendarIcon, Clock, MapPin, Plus, Search, AlertCircle, Edit, Trash2 } from "lucide-react"

interface Route {
  id: string
  name: string
  departure: {
    id: string
    name: string
  }
  arrival: {
    id: string
    name: string
  }
  price: number
  distance: number
  duration: number
}

interface BusType {
  id: string
  plateNumber: string
  model: string
  capacity: number
  isActive: boolean
}

interface Trip {
  id: string
  departureTime: string
  arrivalTime: string
  status: string
  availableSeats: number
  route: Route
  bus: BusType
}

interface Company {
  id: string
  name: string
}

export default function TripManagement() {
  const { data: session } = useSession()
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<BusType[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  // Form state
  const [tripForm, setTripForm] = useState({
    routeId: "",
    busId: "",
    departureDate: new Date(),
    departureTime: "08:00",
    status: "SCHEDULED",
  })

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    routeId: "",
    busId: "",
    date: null as Date | null,
    searchQuery: "",
  })

  useEffect(() => {
    if (session?.user?.companyId) {
      setSelectedCompanyId(session.user.companyId)
      fetchTrips(session.user.companyId)
      fetchRoutes(session.user.companyId)
      fetchBuses(session.user.companyId)
    } else if (session?.user?.role === "ADMIN") {
      fetchCompanies()
    }
  }, [session])

  useEffect(() => {
    if (selectedCompanyId) {
      fetchTrips(selectedCompanyId)
      fetchRoutes(selectedCompanyId)
      fetchBuses(selectedCompanyId)
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const fetchTrips = async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/trips?companyId=${companyId}`)
      const data = await response.json()
      setTrips(data)
    } catch (error) {
      console.error("Error fetching trips:", error)
    }
  }

  const fetchRoutes = async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/routes?companyId=${companyId}`)
      const data = await response.json()
      setRoutes(data)
    } catch (error) {
      console.error("Error fetching routes:", error)
    }
  }

  const fetchBuses = async (companyId: string) => {
    try {
      const response = await fetch(`/api/company/buses?companyId=${companyId}`)
      const data = await response.json()
      setBuses(data)
    } catch (error) {
      console.error("Error fetching buses:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Combine date and time
      const departureDateTime = new Date(tripForm.departureDate)
      const [hours, minutes] = tripForm.departureTime.split(":").map(Number)
      departureDateTime.setHours(hours, minutes)

      const selectedRoute = routes.find((route) => route.id === tripForm.routeId)
      if (!selectedRoute) {
        throw new Error("Route not found")
      }

      // Calculate arrival time based on route duration (in minutes)
      const arrivalDateTime = new Date(departureDateTime.getTime() + selectedRoute.duration * 60 * 1000)

      const payload = {
        routeId: tripForm.routeId,
        busId: tripForm.busId,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        status: tripForm.status,
        companyId: selectedCompanyId,
      }

      let response
      if (isEditMode && selectedTrip) {
        response = await fetch(`/api/company/trips/${selectedTrip.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch("/api/company/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        fetchTrips(selectedCompanyId)
        resetForm()
        setIsDialogOpen(false)
      } else {
        const data = await response.json()
        alert(data.error || "Une erreur est survenue")
      }
    } catch (error) {
      console.error("Error saving trip:", error)
      alert("Une erreur est survenue lors de l'enregistrement du voyage")
    } finally {
      setIsLoading(false)
    }
  }

  const editTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsEditMode(true)

    const departureDate = new Date(trip.departureTime)
    const hours = departureDate.getHours().toString().padStart(2, "0")
    const minutes = departureDate.getMinutes().toString().padStart(2, "0")

    setTripForm({
      routeId: trip.route.id,
      busId: trip.bus.id,
      departureDate,
      departureTime: `${hours}:${minutes}`,
      status: trip.status,
    })

    setIsDialogOpen(true)
  }

  const deleteTrip = async (tripId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) return

    try {
      const response = await fetch(`/api/company/trips/${tripId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTrips(selectedCompanyId)
      } else {
        const data = await response.json()
        alert(data.error || "Une erreur est survenue lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert("Une erreur est survenue lors de la suppression du voyage")
    }
  }

  const updateTripStatus = async (tripId: string, status: string) => {
    try {
      const response = await fetch(`/api/company/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchTrips(selectedCompanyId)
      } else {
        const data = await response.json()
        alert(data.error || "Une erreur est survenue lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Error updating trip status:", error)
      alert("Une erreur est survenue lors de la mise à jour du statut")
    }
  }

  const resetForm = () => {
    setTripForm({
      routeId: "",
      busId: "",
      departureDate: new Date(),
      departureTime: "08:00",
      status: "SCHEDULED",
    })
    setSelectedTrip(null)
    setIsEditMode(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programmé</Badge>
      case "BOARDING":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Embarquement</Badge>
      case "DEPARTED":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">En route</Badge>
      case "ARRIVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Arrivé</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulé</Badge>
      case "DELAYED":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Retardé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr })
  }

  const filteredTrips = trips.filter((trip) => {
    // Apply status filter
    if (filters.status && trip.status !== filters.status) return false

    // Apply route filter
    if (filters.routeId && trip.route.id !== filters.routeId) return false

    // Apply bus filter
    if (filters.busId && trip.bus.id !== filters.busId) return false

    // Apply date filter
    if (filters.date) {
      const tripDate = new Date(trip.departureTime)
      const filterDate = new Date(filters.date)
      if (
        tripDate.getDate() !== filterDate.getDate() ||
        tripDate.getMonth() !== filterDate.getMonth() ||
        tripDate.getFullYear() !== filterDate.getFullYear()
      ) {
        return false
      }
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return (
        trip.route.name.toLowerCase().includes(query) ||
        trip.route.departure.name.toLowerCase().includes(query) ||
        trip.route.arrival.name.toLowerCase().includes(query) ||
        trip.bus.plateNumber.toLowerCase().includes(query)
      )
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Voyages</h1>
          <p className="text-gray-600">Programmez et gérez vos départs</p>
        </div>

        <div className="flex items-center gap-4">
          {session?.user?.role === "ADMIN" && (
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Programmer un voyage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Modifier le voyage" : "Programmer un nouveau voyage"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="routeId">Itinéraire *</Label>
                  <Select
                    value={tripForm.routeId}
                    onValueChange={(value) => setTripForm((prev) => ({ ...prev, routeId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un itinéraire" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} ({route.departure.name} → {route.arrival.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="busId">Bus *</Label>
                  <Select
                    value={tripForm.busId}
                    onValueChange={(value) => setTripForm((prev) => ({ ...prev, busId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses
                        .filter((bus) => bus.isActive)
                        .map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.plateNumber} - {bus.model} ({bus.capacity} places)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date de départ *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tripForm.departureDate ? (
                            format(tripForm.departureDate, "dd MMMM yyyy", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tripForm.departureDate}
                          onSelect={(date) => date && setTripForm((prev) => ({ ...prev, departureDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="departureTime">Heure de départ *</Label>
                    <Input
                      id="departureTime"
                      type="time"
                      value={tripForm.departureTime}
                      onChange={(e) => setTripForm((prev) => ({ ...prev, departureTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={tripForm.status}
                    onValueChange={(value) => setTripForm((prev) => ({ ...prev, status: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Programmé</SelectItem>
                      <SelectItem value="BOARDING">Embarquement</SelectItem>
                      <SelectItem value="DEPARTED">En route</SelectItem>
                      <SelectItem value="ARRIVED">Arrivé</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                      <SelectItem value="DELAYED">Retardé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tripForm.routeId && tripForm.busId && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Informations du voyage</p>
                        <p className="text-sm">
                          {routes.find((r) => r.id === tripForm.routeId)?.name} •{" "}
                          {buses.find((b) => b.id === tripForm.busId)?.model} •{" "}
                          {buses.find((b) => b.id === tripForm.busId)?.capacity} places
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading
                      ? "Enregistrement..."
                      : isEditMode
                        ? "Mettre à jour le voyage"
                        : "Programmer le voyage"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
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
              <Button variant="outline" onClick={() => setFilters({
                status: "",
                routeId: "",
                busId: "",
                date: null,
                searchQuery: "",
              })}>
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Statut</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    <SelectItem value="SCHEDULED">Programmé</SelectItem>
                    <SelectItem value="BOARDING">Embarquement</SelectItem>
                    <SelectItem value="DEPARTED">En route</SelectItem>
                    <SelectItem value="ARRIVED">Arrivé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                    <SelectItem value="DELAYED">Retardé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Itinéraire</Label>
                <Select
                  value={filters.routeId}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, routeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les itinéraires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les itinéraires</SelectItem>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bus</Label>
                <Select
                  value={filters.busId}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, busId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les bus</SelectItem>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.plateNumber} - {bus.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.date ? (
                        format(filters.date, "dd MMMM yyyy", { locale: fr })
                      ) : (
                        <span>Toutes les dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.date || undefined}
                      onSelect={(date) => setFilters((prev) => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Voyages programmés ({filteredTrips.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => (
                <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{trip.route.name}</span>
                        {getStatusBadge(trip.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium">{trip.route.departure.name}</p>
                              <p className="text-sm text-gray-600">{formatDateTime(trip.departureTime)}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium">{trip.route.arrival.name}</p>
                              <p className="text-sm text-gray-600">{formatDateTime(trip.arrivalTime)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Bus className="h-3 w-3 text-gray-600" />
                          <span>{trip.bus.plateNumber} - {trip.bus.model}</span>
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
                          {trip.availableSeats}/{trip.bus.capacity} places disponibles
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editTrip(trip)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTrip(trip.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>

                      <div className=\"flex
