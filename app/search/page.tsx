"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Filter, Search } from "lucide-react";
import Link from "next/link";
import TripCard from "@/components/search/trip-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { TripWithDetails, SearchFilters } from "@/lib/types"; // Import types from lib/types.ts

interface Company {
  id: string;
  name: string;
}

export default function SearchPage() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTrips, setTotalTrips] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: "",
    type: "",
    dateFrom: new Date(),
    dateTo: new Date(),
    companyId: "",
    routeId: "",
    busId: "",
    driverId: "",
    passengerName: "",
    paymentStatus: undefined,
    reservationStatus: undefined,
    page: 1,
    limit: 10,
    sortBy: "departure",
    sortOrder: "asc",
  });

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetchTrips();
    fetchCompanies();
  }, [filters, currentPage]); // Re-fetch when filters or page changes

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());

      const response = await fetch(`/api/trips?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
        setTotalTrips(data.totalCount || 0);
      } else {
        console.error("Failed to fetch trips:", response.statusText);
        setTrips([]);
        setTotalTrips(0);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
      setTotalTrips(0);
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

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number | Date | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearch = () => {
    setCurrentPage(1); // Ensure search starts from page 1
    fetchTrips();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = useMemo(
    () => Math.ceil(totalTrips / itemsPerPage),
    [totalTrips, itemsPerPage]
  );

  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5; // Number of page links to show directly

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > maxPagesToShow - 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      // Show pages around current page
      const startPage = Math.max(
        2,
        currentPage - Math.floor(maxPagesToShow / 2) + 1
      );
      const endPage = Math.min(
        totalPages - 1,
        currentPage + Math.floor(maxPagesToShow / 2) - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - Math.floor(maxPagesToShow / 2) + 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
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
                      value={filters.query}
                      onChange={(e) =>
                        handleFilterChange("query", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">Ville d'arrivée</Label>
                    <Input
                      id="to"
                      placeholder="Ex: Thiès"
                      value={filters.query}
                      onChange={(e) =>
                        handleFilterChange("query", e.target.value)
                      }
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
                    value={filters.dateFrom?.toISOString().split("T")[0]}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", new Date(e.target.value))
                    }
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
                      value={filters.query}
                      onChange={(e) =>
                        handleFilterChange("query", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.query}
                      onChange={(e) =>
                        handleFilterChange("query", e.target.value)
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Company */}
                <div>
                  <Label>Compagnie</Label>
                  <Select
                    value={filters.companyId}
                    onValueChange={(value) =>
                      handleFilterChange("companyId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les compagnies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les compagnies</SelectItem>
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
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
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
                {totalTrips} voyage{totalTrips !== 1 ? "s" : ""} trouvé
                {totalTrips !== 1 ? "s" : ""}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(itemsPerPage)].map((_, i) => (
                  <Card
                    key={i}
                    className="animate-pulse border-l-4 border-l-gray-300"
                  >
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
                      <div className="h-10 bg-gray-200 rounded w-32 ml-auto mt-6"></div>
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
                        query: "",
                        status: "",
                        type: "",
                        dateFrom: new Date(),
                        dateTo: new Date(),
                        companyId: "",
                        routeId: "",
                        busId: "",
                        driverId: "",
                        passengerName: "",
                        paymentStatus: undefined,
                        reservationStatus: undefined,
                        page: 1,
                        limit: 10,
                        sortBy: "departure",
                        sortOrder: "asc",
                      })
                    }
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                      {renderPaginationItems()}
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
