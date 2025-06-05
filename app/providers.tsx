"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { SocketProvider } from "@/components/ui/socket-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  )
}
