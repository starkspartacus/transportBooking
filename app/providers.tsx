"use client";

import type React from "react";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/components/ui/socket-provider";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        <NotificationProvider>
          {children}
          <Toaster position="top-right" richColors />
        </NotificationProvider>
      </SocketProvider>
    </SessionProvider>
  );
}
