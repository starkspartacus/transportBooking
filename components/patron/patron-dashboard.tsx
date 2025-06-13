"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Archive } from "lucide-react"; // Import Archive icon
import { CompanySelector } from "./company-selector";
import TripManagement from "./trip-management";
import BusFleetManagement from "./bus-fleet-management";
import EmployeeManagement from "./employee-management";
import CompanyManagement from "./company-management";
import EnhancedRouteManagement from "./enhanced-route-management";
import { useSocket } from "@/components/ui/socket-provider"; // Import useSocket

interface PatronDashboardProps {
  initialStats: {
    totalCompanies: number;
    activeCompanies: number;
    pendingCompanies: number;
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    totalBuses: number;
    operationalBuses: number;
    totalEmployees: number;
  };
}

export function PatronDashboard({ initialStats }: PatronDashboardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [stats, setStats] = useState(initialStats);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const { socket } = useSocket(); // Get socket instance from context

  useEffect(() => {
    if (session?.user?.companyId && session.user.role === "PATRON") {
      setSelectedCompanyId(session.user.companyId);
    }
  }, [session]);

  useEffect(() => {
    if (socket && selectedCompanyId) {
      socket.emit("join-company", selectedCompanyId);

      const handleTripStatusUpdate = (data: any) => {
        toast({
          title: "Mise à jour du statut du voyage",
          description: `Voyage ${data.route} est maintenant ${data.status}.`,
          duration: 3000,
        });
        // Optionally refetch trips for trip management component
        // This might be handled by the TripManagement component itself
      };

      socket.on("trip-status-updated", handleTripStatusUpdate);

      return () => {
        socket.off("trip-status-updated", handleTripStatusUpdate);
      };
    }
  }, [socket, selectedCompanyId, toast]);

  const handleArchivePastTrips = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une entreprise.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/patron/trips/archive-past", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Archivage réussi",
          description: data.message,
        });
        // Optionally refresh trip data here if needed
      } else {
        toast({
          title: "Erreur d'archivage",
          description:
            data.error || "Une erreur est survenue lors de l'archivage.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error archiving trips:", error);
      toast({
        title: "Erreur inattendue",
        description: "Impossible d'archiver les voyages passés.",
        variant: "destructive",
      });
    }
  };

  const handleCheckTripStatuses = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une entreprise.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/patron/trips/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Mise à jour des statuts",
          description: data.message,
        });
        // Optionally refresh trip data here if needed
      } else {
        toast({
          title: "Erreur de mise à jour des statuts",
          description:
            data.error || "Une erreur est survenue lors de la mise à jour.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking trip statuses:", error);
      toast({
        title: "Erreur inattendue",
        description:
          "Impossible de vérifier et mettre à jour les statuts des voyages.",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return <p>Chargement de la session...</p>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100/40 dark:bg-gray-800/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-bold">Tableau de bord du Patron</h1>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Total Compagnies</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Vue d&apos;ensemble de toutes les compagnies enregistrées.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalCompanies}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.activeCompanies} actives, {stats.pendingCompanies} en
                  attente
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Total Voyages</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Nombre total de voyages programmés et terminés.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalTrips}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.activeTrips} actifs, {stats.completedTrips} terminés
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Total Bus</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Flotte totale de bus et leur statut.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalBuses}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.operationalBuses} opérationnels
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Total Employés</CardTitle>
                <CardDescription className="max-w-xs text-balance leading-relaxed">
                  Nombre total d&apos;employés enregistrés.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalEmployees}</div>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleArchivePastTrips} className="flex-1">
              <Archive className="mr-2 h-4 w-4" /> Archiver les voyages passés
            </Button>
            <Button onClick={handleCheckTripStatuses} className="flex-1">
              <Clock className="mr-2 h-4 w-4" /> Vérifier les statuts des
              voyages
            </Button>
          </div>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="companies">Compagnies</TabsTrigger>
              <TabsTrigger value="trips">Voyages</TabsTrigger>
              <TabsTrigger value="buses">Bus</TabsTrigger>
              <TabsTrigger value="employees">Employés</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activités Récentes</CardTitle>
                  <CardDescription>
                    Les 10 dernières activités dans votre système.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Placeholder for Recent Activities */}
                  <div className="text-center text-gray-500">
                    Chargement des activités...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="companies" className="mt-4">
              <CompanyManagement ownerId={session.user.id} />
            </TabsContent>
            <TabsContent value="trips" className="mt-4">
              {selectedCompanyId ? (
                <TripManagement companyId={selectedCompanyId} />
              ) : (
                <p className="text-center text-gray-500">
                  Veuillez sélectionner une entreprise pour gérer les voyages.
                </p>
              )}
            </TabsContent>
            <TabsContent value="buses" className="mt-4">
              {selectedCompanyId ? (
                <BusFleetManagement companyId={selectedCompanyId} />
              ) : (
                <p className="text-center text-gray-500">
                  Veuillez sélectionner une entreprise pour gérer les bus.
                </p>
              )}
            </TabsContent>
            <TabsContent value="employees" className="mt-4">
              {selectedCompanyId ? (
                <EmployeeManagement companyId={selectedCompanyId} />
              ) : (
                <p className="text-center text-gray-500">
                  Veuillez sélectionner une entreprise pour gérer les employés.
                </p>
              )}
            </TabsContent>
            <TabsContent value="routes" className="mt-4">
              {selectedCompanyId ? (
                <EnhancedRouteManagement companyId={selectedCompanyId} />
              ) : (
                <p className="text-center text-gray-500">
                  Veuillez sélectionner une entreprise pour gérer les routes.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <CompanySelector
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={setSelectedCompanyId}
            ownerId={session.user.id}
          />
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des revenus</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for Revenue Chart */}
              <div className="text-center text-gray-500">
                Graphique des revenus à venir...
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
