import { ObjectId } from "mongodb";

import { mongoManager } from "#connections/mongo.js";
import { COLLECTIONS } from "#constants/collection.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import type { CreateDeveloperDTO, Developer, UpdateDeveloperDTO } from "#types/admin.types.js";
import { validateObjectId } from "#utils/validateObjectId.utils.js";

import developerServices from "./developer.services.js";

const userfieldsToTrim = ["name", "logoUrl", "description"] as const;

class AdminService {
  private get developerCollection() {
    return mongoManager.getConnection().getCollection(COLLECTIONS.DEVELOPERS);
  }

  private get leadCollection() {
    return mongoManager.getConnection().getCollection(COLLECTIONS.LEADS);
  }

  private get userCollection() {
    return mongoManager.getConnection().getCollection(COLLECTIONS.USERS);
  }

  async approveDeveloper(developerId: string): Promise<boolean> {
    try {
      validateObjectId(developerId);

      const result = await this.developerCollection.updateOne(
        { _id: new ObjectId(developerId) },
        {
          $set: {
            approved: true,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new Error("Developer not found");
      }

      logger.info(`Developer approved: ${developerId}`);

      return true;
    } catch (error) {
      logger.error("Error in approveDeveloper:", error);
      throw error;
    }
  }

  async createDeveloper(data: CreateDeveloperDTO): Promise<{ developerId: ObjectId }> {
    try {
      const { approved = false, description, logoUrl, name, userId } = data;

      const userExists = await this.userCollection.findOne({ _id: new ObjectId(userId) });

      if (!userExists) {
        throw new Error("User not found");
      }

      const existingDeveloper = await this.developerCollection.findOne({
        userId: new ObjectId(userId),
      });

      if (existingDeveloper) {
        throw new Error("Developer profile already exists for this user");
      }

      const now = new Date();

      const developerData: Developer = {
        approved,
        createdAt: now,
        description: description.trim(),
        logoUrl: logoUrl?.trim() ?? "",
        name: name.trim(),
        updatedAt: now,
        userId: new ObjectId(userId),
      };

      const result = await this.developerCollection.insertOne(developerData);

      logger.info(`Developer created successfully: ${result.insertedId}`);

      return { developerId: result.insertedId };
    } catch (error) {
      logger.error("Error in createDeveloper:", error);
      throw error;
    }
  }

  async deleteDeveloper(developerId: string): Promise<boolean> {
    try {
      validateObjectId(developerId);

      const listingCollection = mongoManager.getConnection().getCollection("listings");
      const hasListings = await listingCollection.findOne({
        developerId: new ObjectId(developerId),
      });

      if (hasListings) {
        throw new Error(
          "Cannot delete developer with existing listings. Please delete all listings first.",
        );
      }

      const result = await this.developerCollection.deleteOne({
        _id: new ObjectId(developerId),
      });

      if (result.deletedCount === 0) {
        throw new Error("Developer not found or already deleted");
      }

      logger.info(`Developer deleted: ${developerId}`);

      return true;
    } catch (error) {
      logger.error("Error in deleteDeveloper:", error);
      throw error;
    }
  }

  async getDeveloperStats(developerId: string): Promise<any> {
    try {
      if (!developerId || !ObjectId.isValid(developerId)) {
        throw new Error("Invalid developer ID");
      }

      const developer = await developerServices.getDeveloperById(developerId);

      const listingCollection = mongoManager.getConnection().getCollection("listings");
      const totalListings = await listingCollection.countDocuments({
        developerId: new ObjectId(developerId),
      });

      const totalLeads = await this.leadCollection.countDocuments({
        developerId: new ObjectId(developerId),
      });

      const leadsAggregation = await this.leadCollection
        .aggregate([
          { $match: { developerId: new ObjectId(developerId) } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              byStatus: { $push: { k: "$_id", v: "$count" } },
            },
          },
          {
            $project: {
              _id: 0,
              byStatus: { $arrayToObject: "$byStatus" },
            },
          },
        ])
        .next();

      return {
        developer: {
          approved: developer.approved,
          id: developer._id,
          name: developer.name,
        },
        leads: {
          byStatus: leadsAggregation?.byStatus ?? {},
          total: totalLeads,
        },
        listings: {
          total: totalListings,
        },
      };
    } catch (error) {
      logger.error("Error in getDeveloperStats:", error);
      throw error;
    }
  }

  async getPlatformStats(): Promise<any> {
    try {
      const totalDevelopers = await this.developerCollection.countDocuments({});
      const approvedDevelopers = await this.developerCollection.countDocuments({ approved: true });
      const pendingDevelopers = await this.developerCollection.countDocuments({ approved: false });

      const totalLeads = await this.leadCollection.countDocuments({});

      const leadsAggregation = await this.leadCollection
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              byStatus: { $push: { k: "$_id", v: "$count" } },
            },
          },
          {
            $project: {
              _id: 0,
              byStatus: { $arrayToObject: "$byStatus" },
            },
          },
        ])
        .next();

      const listingCollection = mongoManager.getConnection().getCollection("listings");
      const totalListings = await listingCollection.countDocuments({});

      return {
        developers: {
          approved: approvedDevelopers,
          pending: pendingDevelopers,
          total: totalDevelopers,
        },
        leads: {
          byStatus: leadsAggregation?.byStatus ?? {},
          total: totalLeads,
        },
        listings: {
          total: totalListings,
        },
      };
    } catch (error) {
      logger.error("Error in getPlatformStats:", error);
      throw error;
    }
  }

  async rejectDeveloper(developerId: string): Promise<boolean> {
    try {
      validateObjectId(developerId);

      const result = await this.developerCollection.updateOne(
        { _id: new ObjectId(developerId) },
        {
          $set: {
            approved: false,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new Error("Developer not found");
      }

      logger.info(`Developer rejected: ${developerId}`);

      return true;
    } catch (error) {
      logger.error("Error in rejectDeveloper:", error);
      throw error;
    }
  }

  async updateDeveloper(developerId: string, data: UpdateDeveloperDTO): Promise<boolean> {
    try {
      validateObjectId(developerId);

      const existingDeveloper = await this.developerCollection.findOne({
        _id: new ObjectId(developerId),
      });

      if (!existingDeveloper) {
        throw new Error("Developer not found");
      }

      const updateData: Record<string, string | boolean | Date> = {
        updatedAt: new Date(),
      };

      userfieldsToTrim.forEach((field) => {
        if (data[field] !== undefined) {
          updateData[field] = data[field].trim();
        }
      });

      if (data.approved !== undefined) {
        updateData.approved = data.approved;
      }

      const result = await this.developerCollection.updateOne(
        { _id: new ObjectId(developerId) },
        { $set: updateData },
      );

      if (result.modifiedCount === 0) {
        logger.warn(`No changes made to developer: ${developerId}`);
      }

      logger.info(`Developer updated: ${developerId}`);

      return true;
    } catch (error) {
      logger.error("Error in updateDeveloper:", error);
      throw error;
    }
  }
}

export default new AdminService();
