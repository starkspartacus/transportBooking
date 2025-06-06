"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  isActive: boolean;
  isVerified: boolean;
}

export function CompanySelector() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      // Récupérer toutes les entreprises
      const companiesRes = await fetch("/api/patron/companies");
      const companiesData = await companiesRes.json();

      // Récupérer l'entreprise active
      const activeCompanyRes = await fetch("/api/patron/companies/active");
      const activeCompanyData = await activeCompanyRes.json();

      setCompanies(companiesData);
      setActiveCompany(activeCompanyData);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos entreprises",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    try {
      const response = await fetch("/api/patron/companies/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCompany(data.company);
        toast({
          title: "Entreprise changée",
          description: `Vous travaillez maintenant avec ${data.company.name}`,
        });

        // Rafraîchir la page pour mettre à jour les données
        router.refresh();
      }
    } catch (error) {
      console.error("Error changing company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer d'entreprise",
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  const createNewCompany = () => {
    setOpen(false);
    setShowNewDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Sélectionner une entreprise"
            className="flex items-center justify-between w-64"
          >
            <div className="flex items-center gap-2 truncate">
              {activeCompany ? (
                <>
                  <Avatar className="h-6 w-6">
                    {activeCompany.logo ? (
                      <AvatarImage
                        src={activeCompany.logo || "/placeholder.svg"}
                        alt={activeCompany.name}
                      />
                    ) : (
                      <AvatarFallback>
                        {activeCompany.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="truncate">{activeCompany.name}</span>
                  {!activeCompany.isVerified && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      En attente
                    </Badge>
                  )}
                </>
              ) : (
                <span>Sélectionner une entreprise</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Rechercher une entreprise..." />
            <CommandList>
              <CommandEmpty>Aucune entreprise trouvée</CommandEmpty>
              <CommandGroup heading="Vos entreprises">
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.id}
                    onSelect={() => handleCompanyChange(company.id)}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      {company.logo ? (
                        <AvatarImage
                          src={company.logo || "/placeholder.svg"}
                          alt={company.name}
                        />
                      ) : (
                        <AvatarFallback>
                          {company.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="truncate">{company.name}</span>
                    {!company.isVerified && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        En attente
                      </Badge>
                    )}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        activeCompany?.id === company.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={createNewCompany}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une nouvelle entreprise
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Créer une nouvelle entreprise
            </DialogTitle>
          </DialogHeader>

          {/* Formulaire de création d'entreprise */}
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Formulaire de création d'entreprise à implémenter ici.
            </p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowNewDialog(false)}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
