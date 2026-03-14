import type { Server } from "socket.io";

import {
  socketAuthMiddleware,
  type AuthenticatedSocket,
} from "#middlewares/auth/socket.auth.middleware.js";
import { notificationService } from "#services/notification.services.js";

import logger from "../lib/helpers/winston.helpers.js";

export function registerSocketHandlers(io: Server): void {
  io.use((socket, next) => {
    socketAuthMiddleware(socket as AuthenticatedSocket, next);
  });

  io.on("connection", (socket) => {
    const s = socket as AuthenticatedSocket;

    void s.join(`user:${s.userId}`);

    void s.join(s.userRole === "agent" ? "agents" : s.userRole === "admin" ? "admins" : "leads");

    logger.info(`User joined rooms — userId: ${s.userId} | role: ${s.userRole}`);

    s.on("watch:listing", (listingId: string) => {
      void s.join(`listing:${listingId}`);
      logger.info(`User ${s.userId} watching listing ${listingId}`);
    });

    s.on("unwatch:listing", (listingId: string) => {
      void s.leave(`listing:${listingId}`);
      logger.info(`User ${s.userId} stopped watching listing ${listingId}`);
    });

    s.on("disconnect", (reason) => {
      logger.info(`User disconnected — userId: ${s.userId} | reason: ${reason}`);
    });
  });

  notificationService.init(io);

  logger.info("Socket handlers registered");
}
