"use client";

import { useState, useEffect } from "react";
import { CompanyApprovalCard } from "@/components/admin/company-approval-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, RefreshCw, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  licenseNumber: string;
  status: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, activeTab, companies]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/companies");
      if (!response.ok)
        throw new Error("Erreur lors du chargement des entreprises");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Impossible de charger les entreprises");
    } finally {
      setIsLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (company) => company.status === activeTab.toUpperCase()
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleApproveCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}/approve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erreur lors de l'approbation");

      // Update local state
      setCompanies(
        companies.map((company) =>
          company.id === id ? { ...company, status: "APPROVED" } : company
        )
      );
    } catch (error) {
      console.error("Error approving company:", error);
      throw error;
    }
  };

  const handleRejectCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}/reject`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erreur lors du rejet");

      // Update local state
      setCompanies(
        companies.map((company) =>
          company.id === id ? { ...company, status: "REJECTED" } : company
        )
      );
    } catch (error) {
      console.error("Error rejecting company:", error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Chargement des entreprises...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher une entreprise..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuvées</TabsTrigger>
          <TabsTrigger value="rejected">Rejetées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderCompanyList(filteredCompanies)}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {renderCompanyList(filteredCompanies)}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {renderCompanyList(filteredCompanies)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {renderCompanyList(filteredCompanies)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderCompanyList(companies: Company[]) {
    if (companies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucune entreprise trouvée</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "Essayez de modifier vos critères de recherche"
              : activeTab !== "all"
              ? `Aucune entreprise avec le statut "${activeTab}"`
              : "Aucune entreprise n'a été enregistrée"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {companies.map((company) => (
          <CompanyApprovalCard
            key={company.id}
            company={company}
            onApprove={handleApproveCompany}
            onReject={handleRejectCompany}
          />
        ))}
      </div>
    );
  }
}
