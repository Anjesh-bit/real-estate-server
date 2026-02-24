import type { ObjectId } from "mongodb";

export type CreateDeveloperDTO = {
  approved?: boolean;
  description: string;
  logoUrl?: string;
  name: string;
  userId: string;
};

export type Developer = {
  _id?: ObjectId;
  approved: boolean;
  createdAt: Date;
  description: string;
  logoUrl?: string;
  name: string;
  updatedAt: Date;
  userId: ObjectId;
};

export type PaginationQuery = {
  approved?: string;
  limit?: number;
  search?: string;
  skip?: number;
};

export type UpdateDeveloperDTO = {
  approved?: boolean;
  description?: string;
  logoUrl?: string;
  name?: string;
};
