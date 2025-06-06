import type { Server as NetServer, Socket } from "net";
import type { NextApiResponse, NextApiRequest } from "next";
import type { Server as SocketIOServer } from "socket.io";
import { Server as ServerIO } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

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
    const io = new ServerIO(res.socket.server as any);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join company room
      socket.on("join-company", (companyId: string) => {
        socket.join(`company-${companyId}`);
      });

      // Join user room
      socket.on("join-user", (userId: string) => {
        socket.join(`user-${userId}`);
      });

      // Handle reservation events
      socket.on("reservation-created", (data) => {
        socket.to(`company-${data.companyId}`).emit("new-reservation", data);
      });

      socket.on("reservation-confirmed", (data) => {
        socket.to(`user-${data.userId}`).emit("reservation-confirmed", data);
        socket.to(`company-${data.companyId}`).emit("reservation-update", data);
      });

      socket.on("payment-completed", (data) => {
        socket.to(`user-${data.userId}`).emit("payment-completed", data);
        socket.to(`company-${data.companyId}`).emit("payment-received", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  res.end();
}
