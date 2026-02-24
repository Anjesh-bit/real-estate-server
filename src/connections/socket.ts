import type { Server as HttpServer } from "http";

import { Server } from "socket.io";

import { SOCKET_CONFIG } from "#config/socket.config.js";
import logger from "#lib/helpers/winston.helpers.js";

class SocketConnection {
  private io: null | Server;
  isConnected: boolean;
  private connectedClients: number;

  constructor() {
    this.io = null;
    this.isConnected = false;
    this.connectedClients = 0;
  }

  connect(httpServer: HttpServer): Server {
    try {
      this.io = new Server(httpServer, SOCKET_CONFIG);

      this.setupEventHandlers();

      this.isConnected = true;
      logger.info("Socket.IO initialized successfully");

      return this.io;
    } catch (error) {
      logger.error("Socket.IO initialization failed:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.io) {
        await new Promise<void>((resolve, reject) => {
          this.io!.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        this.io = null;
      }

      this.isConnected = false;
      this.connectedClients = 0;
      logger.info("Socket.IO disconnected successfully");
    } catch (error) {
      logger.error("Socket.IO disconnection error:", error);
    }
  }

  getIO(): Server {
    if (!this.isConnected || !this.io) {
      throw new Error("Socket.IO is not initialized");
    }
    return this.io;
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.io || !this.isConnected) return false;

      const sockets = await this.io.fetchSockets();
      logger.debug(`Socket.IO health check passed — ${sockets.length} sockets connected`);
      return true;
    } catch (error) {
      logger.error("Socket.IO health check error:", error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.engine.on("connection_error", (err) => {
      logger.error("Socket.IO engine connection error:", {
        code: err.code,
        message: err.message,
        context: err.context,
      });
    });

    this.io.on("connection", (socket) => {
      this.connectedClients++;
      logger.info(`Socket connected — id: ${socket.id} | total: ${this.connectedClients}`);

      socket.on("disconnect", (reason) => {
        this.connectedClients--;
        logger.info(
          `Socket disconnected — id: ${socket.id} | reason: ${reason} | total: ${this.connectedClients}`,
        );
      });

      socket.on("error", (err) => {
        logger.error(`Socket error — id: ${socket.id}:`, err);
      });
    });

    this.io.of("/").adapter.on("error", (err) => {
      logger.error("Socket.IO adapter error:", err);
      this.isConnected = false;
    });
  }
}

export const socketConnection = new SocketConnection();
