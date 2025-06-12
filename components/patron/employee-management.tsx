"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Key,
  Clock,
  Copy,
  Users,
  Shield,
  Sparkles,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Loader2,
  Briefcase,
  Activity,
  Building2,
  Award,
  MapPin,
  CreditCard,
  Cake,
  UserCircle,
  GraduationCap,
  Heart,
  Languages,
  FileText,
  DollarSign,
  Banknote,
  Home,
  Globe,
  BookOpen,
  Bookmark,
  BadgeCheck,
  Fingerprint,
  Contact,
  PhoneCall,
  CalendarClock,
  CircleUser,
} from "lucide-react"
import { NATIONALITIES, DEPARTMENTS, POSITIONS } from "@/constants/employee"
import { AFRICAN_COUNTRIES } from "@/constants/countries"

interface Employee {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  countryCode?: string
  role: string
  status: string
  nationality?: string
  department?: string
  position?: string
  salary?: number
  hireDate?: string
  createdAt: string
  companyId?: string
  image?: string
  address?: string
  country?: string
  city?: string
  commune?: string
  dateOfBirth?: string
  gender?: string
  idNumber?: string
  idType?: string
  idExpiryDate?: string
  emergencyContact?: string
  emergencyPhone?: string
  employeeNotes?: string
  education?: string
  skills?: string[]
  languages?: string[]
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
}

interface GeneratedCode {
  code: string
  expiresAt: string
  phone: string
  message: string
}

// Define a type for the department keys
type DepartmentKey = keyof typeof POSITIONS

// Update the EmployeeFormData type
interface EmployeeFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode: string
  role: "GESTIONNAIRE" | "CAISSIER"
  status: "ACTIVE" | "SUSPENDED"
  nationality: string
  department: string
  position: string
  salary: string
  hireDate: string

  // Informations personnelles supplémentaires
  image: string
  address: string
  country: string
  city: string
  commune: string
  dateOfBirth: string
  gender: string
  idNumber: string
  idType: string
  idExpiryDate: string

  // Informations professionnelles supplémentaires
  education: string
  skills: string
  languages: string

  // Informations bancaires
  bankName: string
  bankAccountNumber: string
  bankAccountName: string

  // Contact d'urgence
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string

  // Notes
  employeeNotes: string
}

const initialFormData: EmployeeFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryCode: "+225",
  role: "CAISSIER",
  status: "ACTIVE",
  nationality: "CI",
  department: "operations",
  position: "",
  salary: "",
  hireDate: "",

  // Informations personnelles supplémentaires
  image: "",
  address: "",
  country: "CI",
  city: "",
  commune: "",
  dateOfBirth: "",
  gender: "MALE",
  idNumber: "",
  idType: "NATIONAL_ID",
  idExpiryDate: "",

  // Informations professionnelles supplémentaires
  education: "",
  skills: "",
  languages: "",

  // Informations bancaires
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",

  // Contact d'urgence
  emergencyContact: "",
  emergencyPhone: "",
  emergencyRelation: "",

  // Notes
  employeeNotes: "",
}

interface EmployeeManagementProps {
  companyId: string
}

export default function EmployeeManagement({ companyId }: EmployeeManagementProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [availablePositions, setAvailablePositions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("personal")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour la génération de codes
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [phoneData, setPhoneData] = useState({
    phone: "",
    countryCode: "+225",
  })
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)

  useEffect(() => {
    if (companyId) {
      fetchEmployees()
    }
  }, [companyId])

  useEffect(() => {
    if (formData.department && formData.department !== "none") {
      const departmentPositions = POSITIONS[formData.department as DepartmentKey]
      setAvailablePositions(departmentPositions?.map((pos) => pos.name) || [])
      setFormData((prev) => ({ ...prev, position: "" }))
    } else {
      setAvailablePositions([])
    }
  }, [formData.department])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patron/employees?companyId=${companyId}`)
      const contentType = response.headers.get("content-type")
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json()
        setEmployees(data)
      } else {
        const errorText = await response.text()
        console.error("Non-JSON response received:", errorText)
        toast({
          title: "Erreur",
          description: "Erreur lors de la récupération des employés",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la récupération des employés",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convertir les chaînes de compétences et langues en tableaux
      const skillsArray = formData.skills ? formData.skills.split(",").map((s) => s.trim()) : []
      const languagesArray = formData.languages ? formData.languages.split(",").map((l) => l.trim()) : []

      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        salary: formData.salary ? Number.parseFloat(formData.salary) : undefined,
        companyId,
        department: formData.department === "none" ? undefined : formData.department,
        position: !formData.position ? undefined : formData.position,
        skills: skillsArray,
        languages: languagesArray,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        idExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate).toISOString() : undefined,
        hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : undefined,
      }

      const response = await fetch("/api/patron/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "✅ Succès",
          description: "Employé créé avec succès",
        })
        setIsDialogOpen(false)
        setFormData(initialFormData)
        fetchEmployees()
      } else {
        const errorData = await response.json()
        toast({
          title: "❌ Erreur",
          description: errorData.error || "Erreur lors de la création de l'employé",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating employee:", error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la création de l'employé",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateCode = async (employee: Employee) => {
    setIsGenerating(employee.id)
    try {
      const response = await fetch(`/api/company/employees/${employee.id}/generate-code`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCode(data)
        setSelectedEmployee(employee)
        setShowCodeDialog(true)
        toast({
          title: "Code généré avec succès",
          description: data.message,
        })
      } else {
        const errorData = await response.json()

        // Si l'erreur est due à un téléphone manquant, proposer de l'ajouter
        if (errorData.code === "MISSING_PHONE" || errorData.code === "MISSING_COUNTRY_CODE") {
          toast({
            title: "Téléphone requis",
            description: "Un numéro de téléphone est nécessaire pour générer un code d'accès",
            variant: "destructive",
          })
          setSelectedEmployee(employee)
          setPhoneData({
            phone: employee.phone || "",
            countryCode: employee.countryCode || "+225",
          })
          setShowPhoneDialog(true)
        } else {
          toast({
            title: "Erreur",
            description: errorData.error || "Erreur lors de la génération du code",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du code",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const handleUpdatePhone = async () => {
    if (!phoneData.phone || !phoneData.countryCode || !selectedEmployee) {
      toast({
        title: "Données incomplètes",
        description: "Veuillez fournir un numéro de téléphone et un indicatif pays",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPhone(true)
    try {
      const response = await fetch(`/api/company/employees/${selectedEmployee.id}/generate-code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Téléphone mis à jour",
          description: data.message,
        })
        setShowPhoneDialog(false)

        // Rafraîchir la liste des employés
        fetchEmployees()

        // Générer le code automatiquement après mise à jour du téléphone
        setTimeout(() => {
          handleGenerateCode(selectedEmployee)
        }, 500)
      } else {
        const errorData = await response.json()
        toast({
          title: "Erreur",
          description: errorData.error || "Erreur lors de la mise à jour du téléphone",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating phone:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du téléphone",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPhone(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copié !",
      description: "Code copié dans le presse-papiers",
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr })
    } catch {
      return "Date invalide"
    }
  }

  const formatPhone = (employee: Employee) => {
    if (!employee.phone) return null
    return `${employee.countryCode || ""} ${employee.phone}`.trim()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "GESTIONNAIRE":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "CAISSIER":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "GESTIONNAIRE":
        return "Gestionnaire"
      case "CAISSIER":
        return "Caissier"
      default:
        return role
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return "Non défini"
    const department = DEPARTMENTS.find((d) => d.id === departmentId)
    return department?.name || departmentId
  }

  const getNationalityName = (nationalityCode?: string) => {
    if (!nationalityCode) return "Non définie"
    const nationality = NATIONALITIES.find((n) => n.code === nationalityCode)
    return nationality?.name || nationalityCode
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.phone && employee.phone.includes(searchTerm))

    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const resetFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setStatusFilter("all")
  }

  // Statistiques
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.status === "ACTIVE").length
  const gestionnaires = employees.filter((emp) => emp.role === "GESTIONNAIRE").length
  const caissiers = employees.filter((emp) => emp.role === "CAISSIER").length

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des employés...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestion des employés</h1>
                <p className="text-blue-100 text-sm font-normal">Gérez votre équipe en toute simplicité</p>
              </div>
            </CardTitle>
            {/* Formulaire d'ajout d'employé amélioré avec onglets */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Ajouter un employé
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Ajouter un nouvel employé</DialogTitle>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Photo de profil */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="mb-2 text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Photo de profil</h3>
                      <p className="text-sm text-gray-500">Ajoutez une photo pour identifier facilement l'employé</p>
                    </div>
                    <div className="w-32 h-32 relative">
                      <ImageUpload
                        endpoint="profilePicture"
                        value={formData.image}
                        onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                        className="w-full h-full"
                        aspectRatio="square"
                      />
                    </div>
                  </div>

                  {/* Onglets pour organiser les informations */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 mb-6">
                      <TabsTrigger value="personal" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Informations personnelles</span>
                        <span className="sm:hidden">Personnel</span>
                      </TabsTrigger>
                      <TabsTrigger value="professional" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="hidden sm:inline">Informations professionnelles</span>
                        <span className="sm:hidden">Professionnel</span>
                      </TabsTrigger>
                      <TabsTrigger value="contact" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Contact & Adresse</span>
                        <span className="sm:hidden">Contact</span>
                      </TabsTrigger>
                      <TabsTrigger value="additional" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Informations complémentaires</span>
                        <span className="sm:hidden">Compléments</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Onglet Informations personnelles */}
                    <TabsContent value="personal" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <User className="h-4 w-4 text-blue-500" />
                            Prénom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            required
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Entrez le prénom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <User className="h-4 w-4 text-green-500" />
                            Nom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            required
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Entrez le nom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="dateOfBirth"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Cake className="h-4 w-4 text-pink-500" />
                            Date de naissance
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                dateOfBirth: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-indigo-500" />
                            Genre
                          </Label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                gender: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner le genre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Homme</SelectItem>
                              <SelectItem value="FEMALE">Femme</SelectItem>
                              <SelectItem value="OTHER">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="nationality"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4 text-blue-500" />
                            Nationalité
                          </Label>
                          <Select
                            value={formData.nationality}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                nationality: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner une nationalité" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {NATIONALITIES.map((nationality) => (
                                <SelectItem key={nationality.code} value={nationality.code}>
                                  {nationality.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="idType" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Fingerprint className="h-4 w-4 text-purple-500" />
                            Type de pièce d'identité
                          </Label>
                          <Select
                            value={formData.idType}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                idType: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NATIONAL_ID">Carte Nationale d'Identité</SelectItem>
                              <SelectItem value="PASSPORT">Passeport</SelectItem>
                              <SelectItem value="DRIVERS_LICENSE">Permis de conduire</SelectItem>
                              <SelectItem value="OTHER">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="idNumber"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <BadgeCheck className="h-4 w-4 text-green-500" />
                            Numéro de pièce d'identité
                          </Label>
                          <Input
                            id="idNumber"
                            value={formData.idNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                idNumber: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: C0123456789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="idExpiryDate"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <CalendarClock className="h-4 w-4 text-orange-500" />
                            Date d'expiration de la pièce
                          </Label>
                          <Input
                            id="idExpiryDate"
                            type="date"
                            value={formData.idExpiryDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                idExpiryDate: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Onglet Informations professionnelles */}
                    <TabsContent value="professional" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-purple-500" />
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="exemple@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Rôle <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value: "GESTIONNAIRE" | "CAISSIER") =>
                              setFormData((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAISSIER">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-purple-500" />
                                  Caissier
                                </div>
                              </SelectItem>
                              <SelectItem value="GESTIONNAIRE">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  Gestionnaire
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            Statut
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: "ACTIVE" | "SUSPENDED") =>
                              setFormData((prev) => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Actif
                                </div>
                              </SelectItem>
                              <SelectItem value="SUSPENDED">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  Suspendu
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="department"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Building2 className="h-4 w-4 text-indigo-500" />
                            Département
                          </Label>
                          <Select
                            value={formData.department}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                department: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner un département" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="none">Aucun département</SelectItem>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="position"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Award className="h-4 w-4 text-yellow-500" />
                            Poste
                          </Label>
                          <Select
                            value={formData.position}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                position: value,
                              }))
                            }
                            disabled={!formData.department || formData.department === "none"}
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner un poste" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="none">Aucun poste spécifique</SelectItem>
                              {availablePositions.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salary" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-500" />
                            Salaire (FCFA)
                          </Label>
                          <Input
                            id="salary"
                            type="number"
                            value={formData.salary}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                salary: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: 250000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="hireDate"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Date d'embauche
                          </Label>
                          <Input
                            id="hireDate"
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                hireDate: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="education"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <GraduationCap className="h-4 w-4 text-purple-500" />
                            Formation / Diplômes
                          </Label>
                          <Input
                            id="education"
                            value={formData.education}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                education: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Licence en Transport et Logistique"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skills" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Bookmark className="h-4 w-4 text-orange-500" />
                            Compétences (séparées par des virgules)
                          </Label>
                          <Input
                            id="skills"
                            value={formData.skills}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                skills: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Gestion de caisse, Service client, Excel"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="languages"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Languages className="h-4 w-4 text-indigo-500" />
                            Langues parlées (séparées par des virgules)
                          </Label>
                          <Input
                            id="languages"
                            value={formData.languages}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                languages: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Français, Anglais, Dioula"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Onglet Contact & Adresse */}
                    <TabsContent value="contact" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-orange-500" />
                            Téléphone
                          </Label>
                          <div className="flex gap-2">
                            <Select
                              value={formData.countryCode}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  countryCode: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-24 border-2 border-gray-200 focus:border-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {AFRICAN_COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.flag} {country.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              placeholder="0123456789"
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="address"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Home className="h-4 w-4 text-blue-500" />
                            Adresse
                          </Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Rue 12, Quartier Cocody"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="country"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4 text-green-500" />
                            Pays
                          </Label>
                          <Select
                            value={formData.country}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                country: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner un pays" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {AFRICAN_COUNTRIES.map((country) => (
                                <SelectItem key={country.id} value={country.code}>
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            Ville
                          </Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Abidjan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="commune"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4 text-purple-500" />
                            Commune
                          </Label>
                          <Input
                            id="commune"
                            value={formData.commune}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                commune: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Cocody"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="emergencyContact"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Contact className="h-4 w-4 text-red-500" />
                            Contact d'urgence (Nom)
                          </Label>
                          <Input
                            id="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                emergencyContact: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Konan Kouamé"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="emergencyPhone"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <PhoneCall className="h-4 w-4 text-red-500" />
                            Téléphone d'urgence
                          </Label>
                          <Input
                            id="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                emergencyPhone: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: 0123456789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="emergencyRelation"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Heart className="h-4 w-4 text-red-500" />
                            Relation avec le contact d'urgence
                          </Label>
                          <Input
                            id="emergencyRelation"
                            value={formData.emergencyRelation}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                emergencyRelation: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: Conjoint, Parent, Frère/Soeur"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Onglet Informations complémentaires */}
                    <TabsContent value="additional" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="bankName"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <Building2 className="h-4 w-4 text-blue-500" />
                            Nom de la banque
                          </Label>
                          <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: SGCI, NSIA Banque"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="bankAccountNumber"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4 text-purple-500" />
                            Numéro de compte
                          </Label>
                          <Input
                            id="bankAccountNumber"
                            value={formData.bankAccountNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                bankAccountNumber: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: CI123 45678 9012345678901 23"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="bankAccountName"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <User className="h-4 w-4 text-green-500" />
                            Nom sur le compte
                          </Label>
                          <Input
                            id="bankAccountName"
                            value={formData.bankAccountName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                bankAccountName: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ex: KOUASSI Aya Marie"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label
                            htmlFor="employeeNotes"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <BookOpen className="h-4 w-4 text-amber-500" />
                            Notes et commentaires
                          </Label>
                          <Textarea
                            id="employeeNotes"
                            value={formData.employeeNotes}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employeeNotes: e.target.value,
                              }))
                            }
                            className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
                            placeholder="Ajoutez des notes ou commentaires concernant cet employé..."
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <CircleUser className="h-4 w-4 mr-1 text-blue-500" />
                      <span>
                        Onglet{" "}
                        {activeTab === "personal"
                          ? "1"
                          : activeTab === "professional"
                            ? "2"
                            : activeTab === "contact"
                              ? "3"
                              : "4"}{" "}
                        sur 4
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Créer l'employé
                            <Sparkles className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">{totalEmployees}</p>
                <p className="text-sm text-blue-600">Total employés</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">{activeEmployees}</p>
                <p className="text-sm text-green-600">Actifs</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">{gestionnaires}</p>
                <p className="text-sm text-purple-600">Gestionnaires</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Shield className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-700">{caissiers}</p>
                <p className="text-sm text-orange-600">Caissiers</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Users className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-blue-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || departmentFilter !== "all" || statusFilter !== "all") && (
                <Button variant="outline" onClick={resetFilters} className="px-3">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <Card className="shadow-xl border-0">
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun employé trouvé</h3>
              <p className="text-gray-500">
                {employees.length === 0
                  ? "Commencez par ajouter votre premier employé"
                  : "Aucun employé ne correspond à vos critères de recherche"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="p-6 hover:bg-gray-50 transition-all duration-200 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                        <AvatarImage src={employee.image || "/placeholder.svg"} alt={employee.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 truncate">{employee.name}</h3>
                          <Badge className={getRoleBadgeColor(employee.role)}>{getRoleLabel(employee.role)}</Badge>
                          {getStatusBadge(employee.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          {formatPhone(employee) && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{formatPhone(employee)}</span>
                            </div>
                          )}
                          {employee.department && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-purple-500" />
                              <span>{getDepartmentName(employee.department)}</span>
                            </div>
                          )}
                          {employee.position && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span>{employee.position}</span>
                            </div>
                          )}
                          {employee.nationality && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-indigo-500" />
                              <span>{getNationalityName(employee.nationality)}</span>
                            </div>
                          )}
                          {employee.hireDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              <span>Embauché le {formatDate(employee.hireDate)}</span>
                            </div>
                          )}
                          {employee.salary && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span>{employee.salary.toLocaleString()} FCFA</span>
                            </div>
                          )}
                          {employee.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="truncate">{employee.address}</span>
                            </div>
                          )}
                          {employee.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>{employee.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCode(employee)}
                        disabled={isGenerating === employee.id}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                      >
                        {isGenerating === employee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour afficher le code généré */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Code d'accès généré
            </DialogTitle>
            <DialogDescription>Code d'accès temporaire pour {selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          {generatedCode && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  {generatedCode.code}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span>Téléphone: {generatedCode.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Expire le: {formatDate(generatedCode.expiresAt)}</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">{generatedCode.message}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(generatedCode.code)} className="flex-1" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le code
                </Button>
                <Button onClick={() => setShowCodeDialog(false)} className="flex-1">
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter/modifier le téléphone */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Ajouter un numéro de téléphone
            </DialogTitle>
            <DialogDescription>
              Un numéro de téléphone est requis pour générer un code d'accès pour {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneUpdate">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <Select
                  value={phoneData.countryCode}
                  onValueChange={(value) =>
                    setPhoneData((prev) => ({
                      ...prev,
                      countryCode: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phoneUpdate"
                  value={phoneData.phone}
                  onChange={(e) =>
                    setPhoneData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="0123456789"
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdatePhone} disabled={isUpdatingPhone}>
                {isUpdatingPhone ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
