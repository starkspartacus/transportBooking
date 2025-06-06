"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Building,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  role: string;
  employeeRole?: string;
  country?: string;
  city?: string;
  commune?: string;
  createdAt: string;
  lastLogin?: string;
  companyId?: string;
}

export default function EmployeeDetails({
  employeeId,
}: {
  employeeId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            "Erreur lors de la récupération des détails de l'employé"
        );
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Erreur lors de la récupération des détails de l'employé");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;

    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Employé supprimé",
          description: "L'employé a été supprimé avec succès",
        });
        router.push("/patron/employees");
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.error || "Erreur lors de la suppression de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'employé",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non disponible";
    try {
      return format(new Date(dateString), "dd MMMM yyyy à HH:mm", {
        locale: fr,
      });
    } catch {
      return "Date invalide";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-600">{error || "Employé non trouvé"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/patron/employees")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste des employés
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fullName =
    employee.name ||
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const location = [employee.commune, employee.city, employee.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/patron/employees")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/patron/employees/${employeeId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <p className="text-gray-500">{employee.email}</p>
            </div>
            <Badge
              variant={
                employee.role === "GESTIONNAIRE" ? "default" : "secondary"
              }
              className="text-sm"
            >
              {employee.role === "GESTIONNAIRE" ? "Gestionnaire" : "Caissier"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Informations de contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>
                      {employee.countryCode || ""} {employee.phone}
                    </span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Informations professionnelles
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>
                    Rôle:{" "}
                    {employee.role === "GESTIONNAIRE"
                      ? "Gestionnaire"
                      : "Caissier"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Ajouté le: {formatDate(employee.createdAt)}</span>
                </div>
                {employee.lastLogin && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      Dernière connexion: {formatDate(employee.lastLogin)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-lg">Activité récente</h3>
            <p className="text-gray-500 text-center py-4">
              Les données d'activité ne sont pas encore disponibles pour cet
              employé.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/patron/employees")}
          >
            Retour à la liste
          </Button>
          <Button
            onClick={() => router.push(`/patron/employees/${employeeId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
