"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  Users,
  Bus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import EmployeeManagement from "./employee-management"
import BusFleetManagement from "./bus-fleet-management"
import RouteManagement from "./route-management"
import TripFleetManagement from "./trip-fleet-management"

interface CompanyData {
  id: string
  name: string
  email: string
  phone: string
  address: string
  website?: string
  description?: string
  logo?: string
  status: string
  createdAt: string
  _count: {
    employees: number
    buses: number
    routes: number
    trips: number
  }
}

interface CompanyDetailsDashboardProps {
  companyId: string
}

export default function CompanyDetailsDashboard({ companyId }: CompanyDetailsDashboardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails()
    }
  }, [companyId])

  const fetchCompanyDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patron/companies/${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      } else {
        toast({
          title: "❌ Erreur",
          description: "Impossible de charger les détails de l'entreprise",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching company details:", error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails de l'entreprise...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Entreprise non trouvée</h3>
          <p className="text-gray-600 mb-4">L'entreprise demandée n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()} className="hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-gray-600">Gestion complète de l'entreprise</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(company.status)}
            <Button
              variant="outline"
              onClick={() => router.push(`/patron/companies/${companyId}/edit`)}
              className="hover:bg-gray-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Company Info Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informations de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="font-medium">{company.email}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Téléphone</span>
                </div>
                <p className="font-medium">{company.phone}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Adresse</span>
                </div>
                <p className="font-medium">{company.address}</p>
              </div>
              {company.website && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Site web</span>
                  </div>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {company.website}
                  </a>
                </div>
              )}
            </div>
            {company.description && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{company.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-700">{company._count.employees}</p>
                  <p className="text-sm text-blue-600">Employés</p>
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
                  <p className="text-3xl font-bold text-green-700">{company._count.buses}</p>
                  <p className="text-sm text-green-600">Véhicules</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Bus className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-700">{company._count.routes}</p>
                  <p className="text-sm text-purple-600">Routes</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Navigation className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-700">{company._count.trips}</p>
                  <p className="text-sm text-orange-600">Voyages</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                  <TabsTrigger value="employees" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employés ({company._count.employees})
                  </TabsTrigger>
                  <TabsTrigger value="fleet" className="flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    Flotte ({company._count.buses})
                  </TabsTrigger>
                  <TabsTrigger value="routes" className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Routes ({company._count.routes})
                  </TabsTrigger>
                  <TabsTrigger value="trips" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Voyages ({company._count.trips})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="employees" className="p-6">
                <EmployeeManagement companyId={companyId} />
              </TabsContent>

              <TabsContent value="fleet" className="p-6">
                <BusFleetManagement companyId={companyId} />
              </TabsContent>

              <TabsContent value="routes" className="p-6">
                <RouteManagement companyId={companyId} />
              </TabsContent>

              <TabsContent value="trips" className="p-6">
                <TripFleetManagement companyId={companyId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
