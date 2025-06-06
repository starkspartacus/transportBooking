import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/lib/socket";
import { Server as ServerIO } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new ServerIO(res.socket.server as any, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join company room
      socket.on("join-company", (companyId: string) => {
        socket.join(`company-${companyId}`);
        console.log(`Socket ${socket.id} joined company-${companyId}`);
      });

      // Join user room
      socket.on("join-user", (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`Socket ${socket.id} joined user-${userId}`);
      });

      // Handle reservation events
      socket.on("reservation-created", (data) => {
        console.log("Reservation created:", data);
        socket.to(`company-${data.companyId}`).emit("new-reservation", data);
      });

      socket.on("reservation-confirmed", (data) => {
        console.log("Reservation confirmed:", data);
        socket.to(`user-${data.userId}`).emit("reservation-confirmed", data);
        socket.to(`company-${data.companyId}`).emit("reservation-update", data);
      });

      socket.on("payment-completed", (data) => {
        console.log("Payment completed:", data);
        socket.to(`user-${data.userId}`).emit("payment-completed", data);
        socket.to(`company-${data.companyId}`).emit("payment-received", data);
      });

      socket.on("trip-status-updated", (data) => {
        console.log("Trip status updated:", data);
        socket
          .to(`company-${data.companyId}`)
          .emit("trip-status-updated", data);
        // Notify all users with reservations on this trip
        if (data.userIds && data.userIds.length > 0) {
          data.userIds.forEach((userId: string) => {
            socket.to(`user-${userId}`).emit("trip-status-updated", data);
          });
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  res.end();
}
