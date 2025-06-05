"use client"

import { useEffect, useState } from "react"
import { useSocket } from "@/components/ui/socket-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Users, CreditCard, Bus, TrendingUp } from "lucide-react"

interface DashboardStats {
  totalReservations: number
  totalRevenue: number
  activeTrips: number
  onlineUsers: number
  recentReservations: any[]
  recentPayments: any[]
}

export default function RealTimeDashboard({ companyId }: { companyId: string }) {
  const { socket, isConnected } = useSocket()
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    totalRevenue: 0,
    activeTrips: 0,
    onlineUsers: 0,
    recentReservations: [],
    recentPayments: [],
  })
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit("join-company", companyId)

      socket.on("new-reservation", (data) => {
        setStats((prev) => ({
          ...prev,
          totalReservations: prev.totalReservations + 1,
          recentReservations: [data, ...prev.recentReservations.slice(0, 4)],
        }))
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "reservation",
            message: `Nouvelle réservation de ${data.userName}`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ])
      })

      socket.on("payment-received", (data) => {
        setStats((prev) => ({
          ...prev,
          totalRevenue: prev.totalRevenue + data.amount,
          recentPayments: [data, ...prev.recentPayments.slice(0, 4)],
        }))
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "payment",
            message: `Paiement reçu: ${data.amount} FCFA`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ])
      })

      socket.on("reservation-update", (data) => {
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "update",
            message: `Réservation ${data.status}`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ])
      })
    }

    return () => {
      if (socket) {
        socket.off("new-reservation")
        socket.off("payment-received")
        socket.off("reservation-update")
      }
    }
  }, [socket, isConnected, companyId])

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm text-gray-600">{isConnected ? "Connecté en temps réel" : "Déconnecté"}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
            <p className="text-xs opacity-80">Total aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <p className="text-xs opacity-80">Total aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voyages Actifs</CardTitle>
            <Bus className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs opacity-80">En cours</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <p className="text-xs opacity-80">En ligne</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentReservations.map((reservation, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{reservation.userName}</p>
                    <p className="text-sm text-gray-600">{reservation.route}</p>
                  </div>
                  <Badge variant="outline">{reservation.status}</Badge>
                </div>
              ))}
              {stats.recentReservations.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune réservation récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === "reservation"
                        ? "bg-blue-500"
                        : notification.type === "payment"
                          ? "bg-green-500"
                          : "bg-orange-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-gray-500 text-center py-4">Aucune notification</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
