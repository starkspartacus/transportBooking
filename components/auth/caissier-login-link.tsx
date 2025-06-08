"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

export function CaissierLoginLink() {
  return (
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Ou</span>
        </div>
      </div>

      <Link href="/auth/caissier-login">
        <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
          <CreditCard className="mr-2 h-4 w-4" />
          Connexion Caissier
        </Button>
      </Link>

      <p className="text-xs text-gray-500">Réservé aux caissiers avec code d'accès</p>
    </div>
  )
}
