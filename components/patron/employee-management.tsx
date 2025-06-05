"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus, Eye, EyeOff, Copy, Check, Trash2, Shield, ShieldCheck } from "lucide-react"
import { useSession } from "next-auth/react"

interface Employee {
  id: string
  firstName: string
  lastName: string
  phone: string
  countryCode: string
  role: "GESTIONNAIRE" | "CAISSIER"
  country: string
  city: string
  commune: string
  age: number
  isActive: boolean
  createdAt: string
}

interface Country {
  id: string
  name: string
  code: string
  phonePrefix: string
  flag: string
}

const countries: Country[] = [
  { id: "1", name: "Sénégal", code: "SN", phonePrefix: "+221", flag: "🇸🇳" },
  { id: "2", name: "Côte d'Ivoire", code: "CI", phonePrefix: "+225", flag: "🇨🇮" },
  { id: "3", name: "Mali", code: "ML", phonePrefix: "+223", flag: "🇲🇱" },
  { id: "4", name: "Burkina Faso", code: "BF", phonePrefix: "+226", flag: "🇧🇫" },
  { id: "5", name: "Togo", code: "TG", phonePrefix: "+228", flag: "🇹🇬" },
  { id: "6", name: "Bénin", code: "BJ", phonePrefix: "+229", flag: "🇧🇯" },
]

const cities = {
  SN: ["Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor"],
  CI: ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro"],
  ML: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes"],
  BF: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora"],
  TG: ["Lomé", "Sokodé", "Kara", "Atakpamé", "Dapaong"],
  BJ: ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Bohicon"],
}

const communes = {
  Dakar: ["Plateau", "Médina", "Fann", "Mermoz", "Ouakam"],
  Abidjan: ["Cocody", "Yopougon", "Adjamé", "Plateau", "Marcory"],
  Bamako: ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V"],
  Ouagadougou: ["Baskuy", "Bogodogo", "Boulmiougou", "Nongremassom", "Sig-Nonghin"],
  Lomé: ["Golfe", "Agoe-Nyive", "Lacs", "Vo", "Yoto"],
  Cotonou: ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement", "4ème Arrondissement"],
}

export default function EmployeeManagement() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const [employeeForm, setEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    age: "",
    role: "CAISSIER" as "GESTIONNAIRE" | "CAISSIER",
    country: "",
    city: "",
    commune: "",
  })

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([])

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/company/employees?companyId=${session?.user?.companyId}`)
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    return password
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch (error) {
      console.error("Failed to copy password:", error)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode)
    if (country) {
      setSelectedCountry(country)
      setAvailableCities(cities[countryCode as keyof typeof cities] || [])
      setAvailableCommunes([])
      setEmployeeForm((prev) => ({ ...prev, country: countryCode, city: "", commune: "" }))
    }
  }

  const handleCityChange = (city: string) => {
    setAvailableCommunes(communes[city as keyof typeof communes] || [])
    setEmployeeForm((prev) => ({ ...prev, city, commune: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!generatedPassword) {
      alert("Veuillez générer un mot de passe")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/company/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...employeeForm,
          password: generatedPassword,
          countryCode: selectedCountry?.phonePrefix,
          companyId: session?.user?.companyId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(
          `Employé ajouté avec succès!\nMot de passe: ${generatedPassword}\nCommuniquez ce mot de passe à l'employé.`,
        )
        setIsDialogOpen(false)
        resetForm()
        fetchEmployees()
      } else {
        alert(result.error || "Erreur lors de l'ajout de l'employé")
      }
    } catch (error) {
      console.error("Employee creation error:", error)
      alert("Erreur lors de l'ajout de l'employé")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmployeeForm({
      firstName: "",
      lastName: "",
      phone: "",
      age: "",
      role: "CAISSIER",
      country: "",
      city: "",
      commune: "",
    })
    setGeneratedPassword("")
    setSelectedCountry(null)
    setAvailableCities([])
    setAvailableCommunes([])
  }

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        fetchEmployees()
      }
    } catch (error) {
      console.error("Error updating employee status:", error)
    }
  }

  const deleteEmployee = async (employeeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé?")) return

    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEmployees()
        alert("Employé supprimé avec succès")
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
    }
  }

  const gestionnaires = employees.filter((emp) => emp.role === "GESTIONNAIRE")
  const caissiers = employees.filter((emp) => emp.role === "CAISSIER")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-gray-600">Gérez vos gestionnaires et caissiers</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel employé</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label>Rôle *</Label>
                <Select
                  value={employeeForm.role}
                  onValueChange={(value: "GESTIONNAIRE" | "CAISSIER") =>
                    setEmployeeForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAISSIER">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Caissier (Droits limités)
                      </div>
                    </SelectItem>
                    <SelectItem value="GESTIONNAIRE">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Gestionnaire (Droits étendus)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="age">Âge *</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="65"
                  value={employeeForm.age}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Pays *</Label>
                  <Select onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ville *</Label>
                  <Select value={employeeForm.city} onValueChange={handleCityChange} disabled={!employeeForm.country}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Commune</Label>
                  <Select
                    value={employeeForm.commune}
                    onValueChange={(value) => setEmployeeForm((prev) => ({ ...prev, commune: value }))}
                    disabled={!employeeForm.city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCommunes.map((commune) => (
                        <SelectItem key={commune} value={commune}>
                          {commune}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                    <span className="text-sm">{selectedCountry?.phonePrefix || "+XXX"}</span>
                  </div>
                  <Input
                    id="phone"
                    className="rounded-l-none"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="77 123 45 67"
                    required
                  />
                </div>
              </div>

              {/* Password Generation */}
              <div className="space-y-3">
                <Label>Mot de passe de connexion</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={generatePassword} className="flex-1">
                    Générer un mot de passe
                  </Button>
                  {generatedPassword && (
                    <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                      {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {generatedPassword && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{showPassword ? generatedPassword : "••••••••"}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Communiquez ce mot de passe à l'employé pour qu'il puisse se connecter
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading || !generatedPassword} className="flex-1">
                  {isLoading ? "Ajout en cours..." : "Ajouter l'employé"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employés</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gestionnaires</p>
                <p className="text-2xl font-bold">{gestionnaires.length}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Caissiers</p>
                <p className="text-2xl font-bold">{caissiers.length}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Lists */}
      <Tabs defaultValue="gestionnaires" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gestionnaires">Gestionnaires ({gestionnaires.length})</TabsTrigger>
          <TabsTrigger value="caissiers">Caissiers ({caissiers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="gestionnaires">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Gestionnaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gestionnaires.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {employee.countryCode} {employee.phone}
                            </p>
                          </div>
                          <Badge variant={employee.isActive ? "default" : "secondary"}>
                            {employee.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            {employee.age} ans • {employee.city}, {employee.country}
                          </p>
                          {employee.commune && <p>Commune: {employee.commune}</p>}
                          <p>Ajouté le {new Date(employee.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={employee.isActive ? "destructive" : "default"}
                          onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}
                        >
                          {employee.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteEmployee(employee.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {gestionnaires.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun gestionnaire ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter un employé" pour commencer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caissiers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Caissiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caissiers.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {employee.countryCode} {employee.phone}
                            </p>
                          </div>
                          <Badge variant={employee.isActive ? "default" : "secondary"}>
                            {employee.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            {employee.age} ans • {employee.city}, {employee.country}
                          </p>
                          {employee.commune && <p>Commune: {employee.commune}</p>}
                          <p>Ajouté le {new Date(employee.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={employee.isActive ? "destructive" : "default"}
                          onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}
                        >
                          {employee.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteEmployee(employee.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {caissiers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun caissier ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter un employé" pour commencer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
