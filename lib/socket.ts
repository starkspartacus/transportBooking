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

let io: SocketIOServer | undefined; // Declare io outside to be accessible

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    // Only initialize if not already initialized
    console.log("Socket is initializing");
    const path = "/api/socket"; // Default path for the Socket.IO client
    io = new ServerIO(res.socket.server as any, {
      path: path,
      addTrailingSlash: false,
      cors: {
        origin: "*", // Adjust this in production for security
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
        io?.to(`company-${data.companyId}`).emit("new-reservation", data);
        console.log(`new-reservation emitted for company-${data.companyId}`);
      });

      socket.on("reservation-confirmed", (data) => {
        io?.to(`user-${data.userId}`).emit("reservation-confirmed", data);
        io?.to(`company-${data.companyId}`).emit("reservation-update", data);
        console.log(
          `reservation-confirmed emitted for user-${data.userId} and company-${data.companyId}`
        );
      });

      socket.on("payment-completed", (data) => {
        io?.to(`user-${data.userId}`).emit("payment-completed", data);
        io?.to(`company-${data.companyId}`).emit("payment-received", data);
        console.log(
          `payment-completed emitted for user-${data.userId} and company-${data.companyId}`
        );
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  } else {
    console.log("Socket is already running");
    io = res.socket.server.io; // Assign existing io instance
  }
  res.end();
}

// Export a function to retrieve the Socket.IO server instance
export function getSocketIO(): SocketIOServer | undefined {
  return io;
}
