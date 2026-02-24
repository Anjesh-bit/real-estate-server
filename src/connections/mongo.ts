import type {
  ClientSession,
  Collection,
  Db,
  Document,
  Filter,
  FindOptions,
  MongoClientOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { MongoClient } from "mongodb";

import logger from "#lib/helpers/winston.helpers.js";
import type { ConnectionStatus, CrudResult } from "#types/mongo.types.js";

export class MongoConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private readonly options: MongoClientOptions;

  constructor(
    private readonly uri: string,
    private readonly dbName: string,
    options: MongoClientOptions = {},
  ) {
    this.uri = uri;
    this.dbName = dbName;
    this.options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ...options,
    };
  }

  async aggregate<TSchema extends Document = Document, TResult extends Document = TSchema>(
    collection: string,
    pipeline: Document[],
  ): Promise<TResult[]> {
    return await this.getCollection<TSchema>(collection).aggregate<TResult>(pipeline).toArray();
  }

  async connect(): Promise<Db> {
    try {
      if (this.isConnected && this.db) {
        return this.db;
      }

      this.client = new MongoClient(this.uri, this.options);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;

      logger.log("info", `Connected to MongoDB: ${this.dbName}`);
      return this.db;
    } catch (error) {
      logger.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async count<TSchema extends Document = Document>(
    collection: string,
    query: Filter<TSchema> = {},
  ): Promise<number> {
    return await this.getCollection<TSchema>(collection).countDocuments(query);
  }

  async deleteMany<TSchema extends Document = Document>(
    collection: string,
    filter: Filter<TSchema>,
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).deleteMany(filter);
    return {
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount,
    };
  }

  async deleteOne<TSchema extends Document = Document>(
    collection: string,
    filter: Filter<TSchema>,
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).deleteOne(filter);
    return {
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount,
    };
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.db = null;
        logger.log("info", "Disconnected from MongoDB");
      }
    } catch (error) {
      logger.error("MongoDB disconnection error:", error);
      throw error;
    }
  }

  async find<TSchema extends Document = Document>(
    collection: string,
    query: Filter<TSchema> = {},
    options: FindOptions<TSchema> = {},
  ): Promise<import("mongodb").WithId<TSchema>[]> {
    return await this.getCollection<TSchema>(collection).find(query, options).toArray();
  }

  async findOne<TSchema extends Document = Document>(
    collection: string,
    query: Filter<TSchema>,
    options: FindOptions<TSchema> = {},
  ): Promise<import("mongodb").WithId<TSchema> | null> {
    return await this.getCollection<TSchema>(collection).findOne(query, options);
  }

  getCollection<TSchema extends Document = Document>(name: string): Collection<TSchema> {
    return this.getDb().collection<TSchema>(name);
  }

  getDb(): Db {
    if (!this.isConnected || !this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  getStatus(): ConnectionStatus {
    return {
      dbName: this.dbName,
      isConnected: this.isConnected,
      uri: this.uri.replace(/\/\/.*@/, "//***:***@"),
    };
  }

  async insertMany<TSchema extends Document = Document>(
    collection: string,
    documents: OptionalUnlessRequiredId<TSchema>[],
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).insertMany(documents);
    return {
      acknowledged: result.acknowledged,
      insertedIds: Object.values(result.insertedIds),
    };
  }

  async insertOne<TSchema extends Document = Document>(
    collection: string,
    document: OptionalUnlessRequiredId<TSchema>,
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).insertOne(document);
    return {
      acknowledged: result.acknowledged,
      insertedId: result.insertedId,
    };
  }

  async ping(): Promise<boolean> {
    try {
      await this.getDb().admin().ping();
      return true;
    } catch (error) {
      logger.error("MongoDB ping failed:", error);
      return false;
    }
  }

  async updateMany<TSchema extends Document = Document>(
    collection: string,
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: UpdateOptions = {},
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).updateMany(
      filter,
      update,
      options,
    );
    return {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result?.upsertedId ?? undefined,
    };
  }

  async updateOne<TSchema extends Document = Document>(
    collection: string,
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: UpdateOptions = {},
  ): Promise<CrudResult<TSchema>> {
    const result = await this.getCollection<TSchema>(collection).updateOne(filter, update, options);
    return {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result.upsertedId ?? undefined,
    };
  }

  async withTransaction<T>(
    callback: (session: ClientSession) => Promise<T>,
  ): Promise<T | undefined> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    const session = this.client.startSession();
    try {
      return await session.withTransaction(callback);
    } finally {
      await session.endSession();
    }
  }
}

export class MongoManager {
  private readonly connections = new Map<string, MongoConnection>();

  async closeAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map((conn) => conn.disconnect());
    await Promise.all(promises);
    this.connections.clear();
  }

  async closeConnection(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (connection) {
      await connection.disconnect();
      this.connections.delete(name);
    }
  }

  createConnection(
    name: string,
    uri: string,
    dbName: string,
    options: MongoClientOptions = {},
  ): MongoConnection {
    if (this.connections.has(name)) {
      throw new Error(`Connection '${name}' already exists`);
    }

    const connection = new MongoConnection(uri, dbName, options);
    this.connections.set(name, connection);

    return connection;
  }

  getConnection(name = "default"): MongoConnection {
    const connection = this.connections.get(name);

    if (!connection) {
      throw new Error(`Connection '${name}' not found`);
    }
    return connection;
  }

  getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  hasConnection(name: string): boolean {
    return this.connections.has(name);
  }
}

export const mongoManager = new MongoManager();
