"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "./socket-provider";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  companyId?: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !session?.user) return;

    // Join user-specific room
    socket.emit("join-user-room", session.user.id);

    // Listen for notifications
    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      const icon = getNotificationIcon(notification.type);
      toast(notification.title, {
        description: notification.message,
        icon,
        duration: 5000,
      });
    });

    // Listen for trip updates
    socket.on("trip-status-updated", (data) => {
      const notification: Notification = {
        id: `trip-${data.tripId}-${Date.now()}`,
        type: "info",
        title: "Statut du voyage mis à jour",
        message: `Le voyage ${data.route} est maintenant ${getStatusLabel(
          data.status
        )}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
      toast.info(notification.title, {
        description: notification.message,
        icon: <Info className="h-4 w-4" />,
      });
    });

    // Listen for reservation updates
    socket.on("reservation-updated", (data) => {
      const notification: Notification = {
        id: `reservation-${data.reservationId}-${Date.now()}`,
        type: data.status === "CONFIRMED" ? "success" : "warning",
        title: "Réservation mise à jour",
        message: `Votre réservation ${
          data.reservationCode
        } est ${getStatusLabel(data.status)}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
      const icon =
        data.status === "CONFIRMED" ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        );
      toast(notification.title, {
        description: notification.message,
        icon,
      });
    });

    // Listen for payment updates
    socket.on("payment-processed", (data) => {
      const notification: Notification = {
        id: `payment-${data.paymentId}-${Date.now()}`,
        type: data.success ? "success" : "error",
        title: data.success ? "Paiement confirmé" : "Échec du paiement",
        message: data.success
          ? `Votre paiement de ${data.amount} FCFA a été confirmé`
          : `Le paiement de ${data.amount} FCFA a échoué`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
      const icon = data.success ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      );
      toast(notification.title, {
        description: notification.message,
        icon,
      });
    });

    return () => {
      socket.off("notification");
      socket.off("trip-status-updated");
      socket.off("reservation-updated");
      socket.off("payment-processed");
    };
  }, [socket, isConnected, session]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "info":
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: "programmé",
      BOARDING: "en embarquement",
      DEPARTED: "parti",
      ARRIVED: "arrivé",
      CANCELLED: "annulé",
      DELAYED: "retardé",
      PENDING: "en attente",
      CONFIRMED: "confirmé",
      EXPIRED: "expiré",
    };
    return labels[status] || status.toLowerCase();
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
