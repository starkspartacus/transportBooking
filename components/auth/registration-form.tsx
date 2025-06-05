"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Building, Eye, EyeOff, Chrome } from "lucide-react"
import { signIn } from "next-auth/react"

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

export default function RegistrationForm() {
  const [activeTab, setActiveTab] = useState("client")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    commune: "",
    address: "",
  })

  const [companyForm, setCompanyForm] = useState({
    // Owner info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    commune: "",
    address: "",
    // Company info
    companyName: "",
    companyDescription: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    licenseNumber: "",
  })

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([])

  const handleCountryChange = (countryCode: string, formType: "client" | "company") => {
    const country = countries.find((c) => c.code === countryCode)
    if (country) {
      setSelectedCountry(country)
      setAvailableCities(cities[countryCode as keyof typeof cities] || [])
      setAvailableCommunes([])

      if (formType === "client") {
        setClientForm((prev) => ({ ...prev, country: countryCode, city: "", commune: "" }))
      } else {
        setCompanyForm((prev) => ({ ...prev, country: countryCode, city: "", commune: "" }))
      }
    }
  }

  const handleCityChange = (city: string, formType: "client" | "company") => {
    setAvailableCommunes(communes[city as keyof typeof communes] || [])

    if (formType === "client") {
      setClientForm((prev) => ({ ...prev, city, commune: "" }))
    } else {
      setCompanyForm((prev) => ({ ...prev, city, commune: "" }))
    }
  }

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientForm.password !== clientForm.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          role: "CLIENT",
          countryCode: selectedCountry?.phonePrefix,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Inscription réussie! Vous pouvez maintenant vous connecter.")
        // Redirect to login
      } else {
        alert(result.error || "Erreur lors de l'inscription")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (companyForm.password !== companyForm.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...companyForm,
          role: "PATRON",
          countryCode: selectedCountry?.phonePrefix,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Inscription de l'entreprise réussie! En attente de validation.")
        // Redirect to login
      } else {
        alert(result.error || "Erreur lors de l'inscription")
      }
    } catch (error) {
      console.error("Company registration error:", error)
      alert("Erreur lors de l'inscription de l'entreprise")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Créer un compte
          </CardTitle>
          <p className="text-gray-600">Choisissez votre type de compte</p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client / Voyageur
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Entreprise de Transport
              </TabsTrigger>
            </TabsList>

            {/* Client Registration */}
            <TabsContent value="client">
              <form onSubmit={handleClientSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    Compte Client
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">Réservez et achetez vos billets de transport</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={clientForm.firstName}
                      onChange={(e) => setClientForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={clientForm.lastName}
                      onChange={(e) => setClientForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Pays *</Label>
                    <Select onValueChange={(value) => handleCountryChange(value, "client")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                              <span className="text-gray-500">({country.phonePrefix})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                        <span className="text-sm">{selectedCountry?.phonePrefix || "+XXX"}</span>
                      </div>
                      <Input
                        id="phone"
                        className="rounded-l-none"
                        value={clientForm.phone}
                        onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="77 123 45 67"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ville *</Label>
                    <Select
                      value={clientForm.city}
                      onValueChange={(value) => handleCityChange(value, "client")}
                      disabled={!clientForm.country}
                    >
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
                      value={clientForm.commune}
                      onValueChange={(value) => setClientForm((prev) => ({ ...prev, commune: value }))}
                      disabled={!clientForm.city}
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

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={clientForm.address}
                    onChange={(e) => setClientForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={clientForm.password}
                        onChange={(e) => setClientForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={clientForm.confirmPassword}
                      onChange={(e) => setClientForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Inscription en cours..." : "Créer mon compte client"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Ou</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google")}>
                    <Chrome className="h-4 w-4 mr-2" />
                    Continuer avec Google
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Company Registration */}
            <TabsContent value="company">
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Building className="h-3 w-3 mr-1" />
                    Compte Entreprise
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">Gérez votre flotte et vendez vos billets en ligne</p>
                </div>

                {/* Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Informations du responsable</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerFirstName">Prénom du responsable *</Label>
                      <Input
                        id="ownerFirstName"
                        value={companyForm.firstName}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerLastName">Nom du responsable *</Label>
                      <Input
                        id="ownerLastName"
                        value={companyForm.lastName}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ownerEmail">Email du responsable *</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Pays *</Label>
                      <Select onValueChange={(value) => handleCountryChange(value, "company")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.code}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                                <span className="text-gray-500">({country.phonePrefix})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ownerPhone">Téléphone du responsable *</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                          <span className="text-sm">{selectedCountry?.phonePrefix || "+XXX"}</span>
                        </div>
                        <Input
                          id="ownerPhone"
                          className="rounded-l-none"
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="77 123 45 67"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Informations de l'entreprise</h3>

                  <div>
                    <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                    <Input
                      id="companyName"
                      value={companyForm.companyName}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyDescription">Description de l'entreprise</Label>
                    <Textarea
                      id="companyDescription"
                      value={companyForm.companyDescription}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyDescription: e.target.value }))}
                      placeholder="Décrivez votre entreprise de transport..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyEmail">Email de l'entreprise *</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyForm.companyEmail}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenseNumber">Numéro de licence *</Label>
                      <Input
                        id="licenseNumber"
                        value={companyForm.licenseNumber}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                        placeholder="Numéro de licence de transport"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companyAddress">Adresse de l'entreprise *</Label>
                    <Input
                      id="companyAddress"
                      value={companyForm.companyAddress}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyAddress: e.target.value }))}
                      placeholder="Adresse complète de l'entreprise"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPassword">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="companyPassword"
                        type={showPassword ? "text" : "password"}
                        value={companyForm.password}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyConfirmPassword">Confirmer le mot de passe *</Label>
                    <Input
                      id="companyConfirmPassword"
                      type="password"
                      value={companyForm.confirmPassword}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Inscription en cours..." : "Créer mon compte entreprise"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
