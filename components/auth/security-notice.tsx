"use client"

import { Shield, Lock, Globe, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SecurityNotice() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
          <Shield className="h-5 w-5" />
          Sécurité renforcée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Globe className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Vérification géographique</p>
            <p className="text-xs text-green-700">Votre pays est vérifié pour sécuriser votre compte</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Authentification multi-facteurs</p>
            <p className="text-xs text-green-700">Email/téléphone + mot de passe + pays</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Eye className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Surveillance des connexions</p>
            <p className="text-xs text-green-700">Toutes les tentatives sont enregistrées et surveillées</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
