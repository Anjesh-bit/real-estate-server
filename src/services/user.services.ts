import { ObjectId } from "mongodb";

import { mongoManager } from "#connections/mongo.js";
import { DB_COLLECTIONS } from "#constants/collection.constant.js";
import { UserRole } from "#constants/enums/auth.enum.js";
import { users } from "#constants/user.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import type {
  CreateUserDTO,
  UpdateUserDTO,
  User,
  UserDocument,
  UserQuery,
} from "#types/user.types.js";
import { validateObjectId } from "#utils/validateObjectId.utils.js";

class UserService {
  private get userCollection() {
    return mongoManager.getConnection().getCollection(DB_COLLECTIONS.USERS);
  }

  async create(userData: CreateUserDTO): Promise<{ userId: string }> {
    try {
      const {
        approved = false,
        email,
        fullName,
        password,
        phone,
        role = UserRole.DEVELOPER,
      } = userData;

      const existingUser = await this.findByEmail(email);

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const user: Omit<UserDocument, "_id"> = {
        approved,
        createdAt: new Date(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        phone: phone?.trim() || undefined,
        role,
        updatedAt: new Date(),
      };

      const result = await this.userCollection.insertOne(user);

      logger.info(`User created successfully: ${result.insertedId}`);

      return { userId: result.insertedId.toString() };
    } catch (error) {
      logger.error("Error in create:", error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      validateObjectId(userId);

      const result = await this.userCollection.deleteOne({
        _id: new ObjectId(userId),
      });

      if (result.deletedCount === 0) {
        throw new Error("User not found or already deleted");
      }

      logger.info(`User deleted: ${userId}`);

      return true;
    } catch (error) {
      logger.error("Error in deleteUser:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<null | User> {
    try {
      const user = await this.userCollection.findOne({
        email: email.trim().toLowerCase(),
      });

      if (!user) {
        return null;
      }

      logger.info(`User found by email: ${email}`);
      return this.documentToUser(user as UserDocument);
    } catch (error) {
      logger.error("Error in findByEmail:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<null | User> {
    try {
      validateObjectId(id);

      const user = await this.userCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!user) {
        return null;
      }

      logger.info(`User found by ID: ${id}`);
      return this.documentToUser(user as UserDocument);
    } catch (error) {
      logger.error("Error in findById:", error);
      throw error;
    }
  }

  async getAllUsers(
    query: UserQuery = {},
  ): Promise<{ limit: number; skip: number; total: number; users: Omit<User, "password">[] }> {
    try {
      const { approved, limit = 100, role, skip = 0 } = query;

      const filter: Record<string, string | boolean | ObjectId> = {};

      if (role) {
        filter.role = role;
      }
      if (approved !== undefined) {
        filter.approved = approved;
      }

      const users = await this.userCollection
        .find(filter, {
          projection: {
            password: 0,
          },
        })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.userCollection.countDocuments(filter);

      logger.info(`Fetched ${users.length} users`);

      return {
        limit: Number(limit),
        skip: Number(skip),
        total,
        users: users.map((doc) => this.documentToUser(doc as UserDocument)),
      };
    } catch (error) {
      logger.error("Error in getAllUsers:", error);
      throw error;
    }
  }

  async getUserStats(): Promise<{
    approved: number;
    byRole: Record<string, number>;
    pending: number;
    total: number;
  }> {
    try {
      const totalUsers = await this.userCollection.countDocuments({});
      const approvedUsers = await this.userCollection.countDocuments({ approved: true });
      const pendingUsers = await this.userCollection.countDocuments({ approved: false });

      const usersByRole = await this.userCollection
        .aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              byRole: { $push: { k: "$_id", v: "$count" } },
            },
          },
          {
            $project: {
              _id: 0,
              byRole: { $arrayToObject: "$byRole" },
            },
          },
        ])
        .next();

      return {
        approved: approvedUsers,
        byRole: usersByRole?.byRole ?? {},
        pending: pendingUsers,
        total: totalUsers,
      };
    } catch (error) {
      logger.error("Error in getUserStats:", error);
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserDTO): Promise<boolean> {
    try {
      validateObjectId(userId);

      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw new Error("User not found");
      }

      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.findByEmail(data.email);
        if (emailExists) {
          throw new Error("Email already in use by another user");
        }
      }

      const updateData: Record<string, string | boolean | Date> = { updatedAt: new Date() };

      users.forEach((field) => {
        const value = data[field];
        if (value === undefined) {
          return;
        }

        if (typeof value === "string") {
          updateData[field] = field === "email" ? value.trim().toLowerCase() : value.trim();
        } else {
          updateData[field] = value;
        }
      });

      const { modifiedCount } = await this.userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData },
      );

      if (modifiedCount === 0) {
        logger.warn(`No changes made to user: ${userId}`);
      } else {
        logger.info(`User updated: ${userId}`);
      }

      return true;
    } catch (error) {
      logger.error("Error in updateUser:", error);
      throw error;
    }
  }

  private documentToUser(doc: UserDocument): User {
    const { _id, ...rest } = doc;
    return {
      id: _id!.toString(),
      ...rest,
    } as User;
  }
}

export default new UserService();
