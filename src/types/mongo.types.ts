import type { ObjectId } from "mongodb";

export type ConnectionStatus = {
  dbName: string;
  isConnected: boolean;
  uri: string;
};

export type CrudResult<T = unknown> = {
  acknowledged: boolean;
  deletedCount?: number;
  insertedId?: ObjectId;
  insertedIds?: ObjectId[];
  matchedCount?: number;
  modifiedCount?: number;
  upsertedCount?: number;
  upsertedId?: ObjectId;
};
