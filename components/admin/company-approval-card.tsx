"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Eye, Building2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CompanyApprovalCardProps {
  company: {
    id: string
    name: string
    email: string
    phone: string
    country: string
    city: string
    licenseNumber: string
    status: string
    createdAt: string
    owner: {
      name: string
      email: string
    }
  }
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
}

export function CompanyApprovalCard({ company, onApprove, onReject }: CompanyApprovalCardProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      await onApprove(company.id)
      toast.success(`L'entreprise ${company.name} a été approuvée`)
    } catch (error) {
      console.error("Error approving company:", error)
      toast.error("Erreur lors de l'approbation de l'entreprise")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsRejecting(true)
      await onReject(company.id)
      toast.success(`L'entreprise ${company.name} a été rejetée`)
    } catch (error) {
      console.error("Error rejecting company:", error)
      toast.error("Erreur lors du rejet de l'entreprise")
    } finally {
      setIsRejecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En attente
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Approuvée
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejetée
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {company.name}
            </CardTitle>
            <CardDescription>{company.email}</CardDescription>
          </div>
          {getStatusBadge(company.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Propriétaire</p>
            <p className="font-medium">{company.owner.name}</p>
            <p className="text-xs text-muted-foreground">{company.owner.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Localisation</p>
            <p className="font-medium">
              {company.city}, {company.country}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Numéro de licence</p>
            <p className="font-medium">{company.licenseNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Créée</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-3 border-t">
        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/companies/${company.id}`)}>
          <Eye className="h-4 w-4 mr-1" /> Détails
        </Button>
        <div className="flex gap-2">
          {company.status === "PENDING" && (
            <>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={isRejecting || isApproving}>
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                Rejeter
              </Button>
              <Button variant="default" size="sm" onClick={handleApprove} disabled={isRejecting || isApproving}>
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Approuver
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
