import type { ObjectId } from "mongodb";

import type { UserRole } from "#constants/enums/auth.enum.js";

export type CreateUserDTO = {
  approved?: boolean;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  role?: UserRole.ADMIN | UserRole.DEVELOPER;
};

export type UpdateUserDTO = {
  approved?: boolean;
  email?: string;
  fullName?: string;
  password?: string;
  phone?: string;
  role?: UserRole.ADMIN | UserRole.DEVELOPER;
};

export type User = {
  approved: boolean;
  createdAt: Date;
  email: string;
  fullName: string;
  id: string;
  password: string;
  phone?: string;
  role: UserRole.ADMIN | UserRole.DEVELOPER;
  updatedAt: Date;
};

export type UserDocument = Omit<User, "id"> & {
  _id?: ObjectId;
};

export type UserQuery = {
  approved?: boolean;
  limit?: number;
  role?: string;
  skip?: number;
};
