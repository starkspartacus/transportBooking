"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Eye, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeRole?: string;
  status?: string;
  hireDate?: string;
  lastLogin?: string;
  createdAt: string;
}

const employeeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  role: z.enum(["GESTIONNAIRE", "CAISSIER"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "GESTIONNAIRE",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/company/employees");
      if (response.ok) {
        const data = await response.json();
        // S'assurer que data est un tableau
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        console.error("Error fetching employees:", response.statusText);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const response = await fetch("/api/company/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Employé ajouté",
          description: "L'employé a été ajouté avec succès",
        });
        fetchEmployees();
        setShowNewForm(false);
        form.reset();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'ajout de l'employé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'employé",
        variant: "destructive",
      });
    }
  };

  const handleViewEmployee = (employeeId: string) => {
    router.push(`/patron/employees/${employeeId}`);
  };

  const handleEditEmployee = (employeeId: string) => {
    router.push(`/patron/employees/${employeeId}/edit`);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
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
        fetchEmployees();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description:
            error.error || "Erreur lors de la suppression de l'employé",
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Filtrer les employés avec vérification de sécurité
  const gestionnaires = Array.isArray(employees)
    ? employees.filter(
        (emp) =>
          emp.role === "GESTIONNAIRE" || emp.employeeRole === "GESTIONNAIRE"
      )
    : [];

  const caissiers = Array.isArray(employees)
    ? employees.filter(
        (emp) => emp.role === "CAISSIER" || emp.employeeRole === "CAISSIER"
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des employés ({employees.length})
          </CardTitle>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un employé
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showNewForm ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom complet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="GESTIONNAIRE">
                                Gestionnaire
                              </SelectItem>
                              <SelectItem value="CAISSIER">Caissier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Actif</SelectItem>
                              <SelectItem value="SUSPENDED">
                                Suspendu
                              </SelectItem>
                              <SelectItem value="INACTIVE">Inactif</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewForm(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Ajout en cours..."
                        : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Chargement des employés...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{employees.length}</p>
                    <p className="text-sm text-gray-600">Total employés</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gestionnaires.length}</p>
                    <p className="text-sm text-gray-600">Gestionnaires</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{caissiers.length}</p>
                    <p className="text-sm text-gray-600">Caissiers</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des employés */}
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucun employé trouvé</p>
                <p className="text-sm text-gray-500">
                  Cliquez sur "Ajouter un employé" pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{employee.name}</h3>
                          <Badge variant="outline">
                            {employee.role ||
                              employee.employeeRole ||
                              "Non défini"}
                          </Badge>
                          {employee.status && (
                            <Badge
                              variant={
                                employee.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {employee.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {employee.hireDate && (
                            <span>
                              Embauché le: {formatDate(employee.hireDate)}
                            </span>
                          )}
                          {employee.createdAt && (
                            <span>
                              Créé le: {formatDate(employee.createdAt)}
                            </span>
                          )}
                          {employee.lastLogin && (
                            <span>
                              Dernière connexion:{" "}
                              {formatDate(employee.lastLogin)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewEmployee(employee.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEmployee(employee.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
