import { ObjectId } from "mongodb";

import { mongoManager } from "#connections/mongo.js";
import { DB_COLLECTIONS } from "#constants/collection.constant.js";
import { ListingStatus } from "#constants/enums/listing.enum.js";
import { listing } from "#constants/listing.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import type {
  CreateListingDTO,
  Listing,
  ListingQuery,
  UpdateListingDTO,
} from "#types/listing.types.js";
import { buildListingFilter } from "#utils/buildListingFilter.utils.js";
import { validateObjectId } from "#utils/validateObjectId.utils.js";

class ListingService {
  private get developerCollection() {
    return mongoManager.getConnection().getCollection(DB_COLLECTIONS.DEVELOPERS);
  }

  private get listingCollection() {
    return mongoManager.getConnection().getCollection(DB_COLLECTIONS.LISTINGS);
  }

  async createListing(data: CreateListingDTO): Promise<{ listingId: ObjectId }> {
    try {
      validateObjectId(data.developerId);

      const developer = await this.developerCollection.findOne({
        _id: new ObjectId(data.developerId),
      });

      if (!developer) {
        throw new Error("Developer not found");
      }

      if (!developer.approved) {
        throw new Error("Developer is not approved. Cannot create listings.");
      }

      const maxDisplayOrder = await this.listingCollection
        .find({ developerId: new ObjectId(data.developerId) })
        .sort({ displayOrder: -1 })
        .limit(1)
        .toArray();

      const hasMaxDisplayOrder = maxDisplayOrder.length > 0;
      const initialIndexAt = maxDisplayOrder.at(0)?.displayOrder ?? 0;
      const displayOrder = hasMaxDisplayOrder ? initialIndexAt + 1 : 1;

      const {
        bedrooms,
        city,
        description = "",
        developerId = "",
        images = [],
        neighborhood,
        price,
        size,
        status = ListingStatus.Draft,
        title = "",
      } = data || {};

      const now = new Date();
      const listingData: Listing = {
        bedrooms,
        city: city.trim(),
        createdAt: now,
        description: description.trim(),
        developerId: new ObjectId(developerId),
        displayOrder,
        images,
        neighborhood: neighborhood.trim(),
        price,
        size,
        status,
        title: title.trim(),
        updatedAt: now,
      };

      const result = await this.listingCollection.insertOne(listingData);

      logger.info(`Listing created successfully: ${result.insertedId}`);

      return { listingId: result.insertedId };
    } catch (error) {
      logger.error("Error in createListing:", error);
      throw error;
    }
  }

  async deleteListing(listingId: string, developerId: string): Promise<boolean> {
    try {
      validateObjectId(listingId);
      validateObjectId(developerId);

      const listing = await this.listingCollection.findOne({
        _id: new ObjectId(listingId),
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      const isExistsDeveloperId = (listing.developerId as string).toString() === developerId;

      if (!isExistsDeveloperId) {
        throw new Error("Unauthorized: You can only delete your own listings");
      }

      const result = await this.listingCollection.deleteOne({
        _id: new ObjectId(listingId),
      });

      if (result.deletedCount === 0) {
        throw new Error("Listing not found or already deleted");
      }

      logger.info(`Listing deleted: ${listingId}`);

      return true;
    } catch (error) {
      logger.error("Error in deleteListing:", error);
      throw error;
    }
  }

  async getAllListings(
    query: ListingQuery = {},
  ): Promise<{ limit: number; listings: Listing[]; skip: number; total: number }> {
    try {
      const {
        city,
        developerId,
        limit = 10,
        maxBedrooms,
        maxPrice,
        minBedrooms,
        minPrice,
        neighborhood,
        skip = 0,
        status = ListingStatus.InActive,
      } = query;

      const filter = buildListingFilter({
        city,
        developerId,
        maxBedrooms,
        maxPrice,
        minBedrooms,
        minPrice,
        neighborhood,
        status,
      });

      const listings = await this.listingCollection
        .find(filter)
        .sort({ createdAt: -1, displayOrder: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.listingCollection.countDocuments(filter);

      logger.info(`Fetched ${listings.length} listings`);

      return {
        limit: Number(limit),
        listings: listings as Listing[],
        skip: Number(skip),
        total,
      };
    } catch (error) {
      logger.error("Error in getAllListings:", error);
      throw error;
    }
  }

  async getListingById(listingId: string): Promise<Listing> {
    try {
      validateObjectId(listingId);

      const listing = await this.listingCollection.findOne({
        _id: new ObjectId(listingId),
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      return listing as Listing;
    } catch (error) {
      logger.error("Error in getListingById:", error);
      throw error;
    }
  }

  async getListingsByDeveloperId(
    developerId: string,
    query: ListingQuery = {},
  ): Promise<{ limit: number; listings: Listing[]; skip: number; total: number }> {
    try {
      validateObjectId(developerId);

      const { limit = 10, skip = 0, status } = query;

      const filter: Record<string, string | ObjectId> = { developerId: new ObjectId(developerId) };

      if (status) {
        filter.status = status;
      }

      const listings = await this.listingCollection
        .find(filter)
        .sort({ createdAt: -1, displayOrder: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.listingCollection.countDocuments(filter);

      logger.info(`Fetched ${listings.length} listings for developer: ${developerId}`);

      return {
        limit: Number(limit),
        listings: listings as Listing[],
        skip: Number(skip),
        total,
      };
    } catch (error) {
      logger.error("Error in getListingsByDeveloperId:", error);
      throw error;
    }
  }

  async reorderListing(
    listingId: string,
    developerId: string,
    newDisplayOrder: number,
  ): Promise<boolean> {
    validateObjectId(listingId);
    validateObjectId(developerId);

    const reorderWithtransaction = mongoManager.getConnection().withTransaction;

    return (
      (await reorderWithtransaction(async (session) => {
        const listing = await this.listingCollection.findOne(
          { _id: new ObjectId(listingId) },
          { session },
        );

        if (!listing) {
          throw new Error("Listing not found");
        }

        if (listing.developerId.toString() !== developerId) {
          throw new Error("Unauthorized: You can only reorder your own listings");
        }

        const oldDisplayOrder = listing.displayOrder;

        if (oldDisplayOrder === newDisplayOrder) {
          logger.info(`No reorder needed for listing ${listingId}`);
          return true;
        }

        const totalListings = await this.listingCollection.countDocuments(
          { developerId: new ObjectId(developerId) },
          { session },
        );

        if (newDisplayOrder >= totalListings) {
          throw new Error(`Invalid newDisplayOrder: must be between 0 and ${totalListings - 1}`);
        }

        if (newDisplayOrder < oldDisplayOrder) {
          await this.listingCollection.updateMany(
            {
              developerId: new ObjectId(developerId),
              displayOrder: { $gte: newDisplayOrder, $lt: oldDisplayOrder },
            },
            { $inc: { displayOrder: 1 } },
            { session },
          );
        } else {
          await this.listingCollection.updateMany(
            {
              developerId: new ObjectId(developerId),
              displayOrder: { $gt: oldDisplayOrder, $lte: newDisplayOrder },
            },
            { $inc: { displayOrder: -1 } },
            { session },
          );
        }

        await this.listingCollection.updateOne(
          { _id: new ObjectId(listingId) },
          {
            $set: {
              displayOrder: newDisplayOrder,
              updatedAt: new Date(),
            },
          },
          { session },
        );

        logger.info(
          `Listing reordered successfully: ${listingId} (from ${oldDisplayOrder} to ${newDisplayOrder})`,
        );

        return true;
      })) ?? false
    );
  }

  async updateListing(
    listingId: string,
    developerId: string,
    data: UpdateListingDTO,
  ): Promise<boolean> {
    try {
      validateObjectId(listingId);
      validateObjectId(developerId);

      const existingListing = await this.listingCollection.findOne({
        _id: new ObjectId(listingId),
      });

      if (!existingListing) {
        throw new Error("Listing not found");
      }

      if (existingListing.developerId.toString() !== developerId) {
        throw new Error("Unauthorized: You can only update your own listings");
      }

      const updateData: Record<string, string | number | string[] | Date> = {
        updatedAt: new Date(),
      };

      listing.forEach((field) => {
        if (data[field] !== undefined) {
          updateData[field] = typeof data[field] === "string" ? data[field].trim() : data[field];
        }
      });

      const result = await this.listingCollection.updateOne(
        { _id: new ObjectId(listingId) },
        { $set: updateData },
      );

      if (result.modifiedCount === 0) {
        logger.warn(`No changes made to listing: ${listingId}`);
      }

      logger.info(`Listing updated: ${listingId}`);

      return true;
    } catch (error) {
      logger.error("Error in updateListing:", error);
      throw error;
    }
  }
}

export default new ListingService();
