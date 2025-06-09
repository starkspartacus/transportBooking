"use client"

import { Shield, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CountryVerificationBannerProps {
  country?: string
  isVerified?: boolean
  className?: string
}

export function CountryVerificationBanner({
  country,
  isVerified = false,
  className = "",
}: CountryVerificationBannerProps) {
  if (!country) return null

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <div className="flex items-center gap-2">
        {isVerified ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Shield className="h-4 w-4 text-blue-600" />}
        <AlertDescription className="text-blue-800">
          <span className="font-medium">Connexion sécurisée</span> - Pays vérifié : {country}
          {isVerified && <span className="ml-2 text-green-600">✓ Vérifié</span>}
        </AlertDescription>
      </div>
    </Alert>
  )
}
