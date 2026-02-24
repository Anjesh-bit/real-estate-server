import type { ServerOptions } from "socket.io";

export const SOCKET_CONFIG: Partial<ServerOptions> = {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 20_000,
  pingInterval: 25_000,
  maxHttpBufferSize: 1e6,
  connectTimeout: 10_000,
};
