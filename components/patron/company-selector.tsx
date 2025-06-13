"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface CompanySelectorProps {
  selectedCompanyId: string | null;
  onSelectCompany: Dispatch<SetStateAction<string | null>>;
  ownerId: string; // The ID of the patron
}

export function CompanySelector({
  selectedCompanyId,
  onSelectCompany,
  ownerId,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/patron/companies/active?ownerId=${ownerId}`
        );
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
          // If no company is selected and there are companies, select the first one
          if (!selectedCompanyId && data.length > 0) {
            onSelectCompany(data[0].id);
          }
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les entreprises actives.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching active companies:", error);
        toast({
          title: "Erreur",
          description:
            "Une erreur inattendue est survenue lors du chargement des entreprises actives.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (ownerId) {
      fetchCompanies();
    }
  }, [ownerId, selectedCompanyId, onSelectCompany, toast]);

  const handleCompanyChange = async (companyId: string) => {
    onSelectCompany(companyId);
    try {
      // Optionally, send a request to update the active company in the session/backend
      await fetch("/api/patron/set-active-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      toast({
        title: "Entreprise sélectionnée",
        description: "L'entreprise active a été mise à jour.",
      });
    } catch (error) {
      console.error("Error setting active company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de définir l'entreprise active.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sélectionner une Entreprise</CardTitle>
        <CardDescription>
          Gérez les données spécifiques à une entreprise.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chargement des entreprises...</p>
          </div>
        ) : companies.length > 0 ? (
          <Select
            value={selectedCompanyId || ""}
            onValueChange={handleCompanyChange}
          >
            <SelectTrigger className="w-full">
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
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>Aucune entreprise active trouvée.</p>
            <p className="text-sm">Veuillez créer une entreprise d'abord.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
