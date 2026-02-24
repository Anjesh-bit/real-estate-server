import app from "#app.js";
import { ENV } from "#config/env.config.js";
import type { MongoConnection } from "#connections/mongo.js";
import { mongoManager } from "#connections/mongo.js";
import logger from "#lib/helpers/winston.helpers.js";

async function gracefulShutdown(): Promise<void> {
  logger.log("info", "\n⏳ Shutting down gracefully...");
  try {
    await mongoManager.closeAll();
    logger.log("info", "Database connections closed");
  } catch (error: unknown) {
    logger.error("Error closing database connections:", error);
  }
  process.exit(0);
}

async function initializeDatabase(): Promise<MongoConnection> {
  const connection: MongoConnection = mongoManager.createConnection(
    "default",
    ENV.MONGODB_URI ?? "mongodb://anjesh-quantum:admin%40123@localhost:27017/?authSource=admin",
    ENV.DB_NAME ?? "real_estate_portal",
    {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    },
  );
  await connection.connect();
  const isHealthy: boolean = await connection.ping();
  if (!isHealthy) {
    throw new Error("Database ping failed");
  }
  logger.log("info", "Database connected successfully");
  return connection;
}

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    app.listen(ENV.PORT, (): void => {
      logger.log("info", `Server is running on port ${ENV.PORT}`);
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

export default app;
