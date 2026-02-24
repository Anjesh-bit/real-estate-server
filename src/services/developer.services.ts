import { ObjectId } from "mongodb";

import { mongoManager } from "#connections/mongo.js";
import { COLLECTIONS } from "#constants/collection.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import type { Developer, PaginationQuery } from "#types/admin.types.js";
import { validateObjectId } from "#utils/validateObjectId.utils.js";

class DeveloperService {
  private get developerCollection() {
    return mongoManager.getConnection().getCollection(COLLECTIONS.DEVELOPERS);
  }

  async getAllDevelopers(
    query: PaginationQuery = {},
  ): Promise<{ developers: Developer[]; limit: number; skip: number; total: number }> {
    try {
      const { approved, limit = 10, search, skip = 0 } = query;

      const filter: any = {};
      const isExitsApproved = approved !== undefined;

      if (isExitsApproved) {
        filter.approved = approved === "true";
      }

      if (search) {
        filter.$or = [
          { name: { $options: "i", $regex: search } },
          { description: { $options: "i", $regex: search } },
        ];
      }

      const developers = await this.developerCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.developerCollection.countDocuments(filter);

      logger.info(`Fetched ${developers.length} developers`);

      return {
        developers: developers as Developer[],
        limit: Number(limit),
        skip: Number(skip),
        total,
      };
    } catch (error) {
      logger.error("Error in getAllDevelopers:", error);
      throw error;
    }
  }

  async getDeveloperById(developerId: string): Promise<Developer> {
    try {
      validateObjectId(developerId);

      const developer = await this.developerCollection.findOne({
        _id: new ObjectId(developerId),
      });

      if (!developer) {
        throw new Error("Developer not found");
      }

      return developer as Developer;
    } catch (error) {
      logger.error("Error in getDeveloperById:", error);
      throw error;
    }
  }
}

export default new DeveloperService();
