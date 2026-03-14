import http from "http";

import app from "#app.js";
import { ENV } from "#config/env.config.js";
import type { MongoConnection } from "#connections/mongo.js";
import { mongoManager } from "#connections/mongo.js";
import { registerSocketHandlers } from "#connections/socket.handlers.js";
import { socketConnection } from "#connections/socket.js";
import logger from "#lib/helpers/winston.helpers.js";

async function gracefulShutdown(): Promise<void> {
  logger.log("info", "\n⏳ Shutting down gracefully...");
  try {
    await mongoManager.closeAll();
    logger.log("info", "Database connections closed");

    await socketConnection.disconnect();
    logger.log("info", "Socket.IO disconnected");
  } catch (error: unknown) {
    logger.error("Error during shutdown:", error);
  }
  process.exit(0);
}

async function initializeDatabase(): Promise<MongoConnection> {
  const connection: MongoConnection = mongoManager.createConnection(
    "default",
    ENV.MONGODB_URI ?? "mongodb://localhost:27017",
    ENV.DB_NAME ?? "real_estate_portal",
    {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    },
  );
  await connection.connect();
  const isHealthy: boolean = await connection.ping();
  if (!isHealthy) throw new Error("Database ping failed");
  logger.log("info", "Database connected successfully");
  return connection;
}

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();

    const httpServer = http.createServer(app);

    const io = socketConnection.connect(httpServer);

    registerSocketHandlers(io);

    httpServer.listen(ENV.PORT, (): void => {
      logger.log("info", `Server running on port ${ENV.PORT}`);
      logger.log("info", `Socket.IO ready`);
    });
  } catch (error: unknown) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", (): void => {
  void gracefulShutdown();
});
process.on("SIGTERM", (): void => {
  void gracefulShutdown();
});
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>): void => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  void gracefulShutdown();
});
process.on("uncaughtException", (error: unknown): void => {
  logger.error("Uncaught Exception:", error);
  void gracefulShutdown();
});

void startServer();
