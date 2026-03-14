import { ObjectId } from "mongodb";

import { mongoManager } from "#connections/mongo.js";
import { DB_COLLECTIONS } from "#constants/collection.constant.js";
import { LeadStatusEnum } from "#constants/enums/lead.enum.js";
import logger from "#lib/helpers/winston.helpers.js";
import type { CreateLeadDTO, Lead, PaginationQuery, UpdateLeadDTO } from "#types/lead.types.js";
import { validateObjectId } from "#utils/validateObjectId.utils.js";

class LeadService {
  private readonly leadCollection = DB_COLLECTIONS.LEADS;

  private get collection() {
    return mongoManager.getConnection().getCollection<Lead>(this.leadCollection);
  }

  async createLead(data: CreateLeadDTO): Promise<{ leadId: ObjectId }> {
    try {
      const {
        developerId = "",
        email = "",
        listingId = "",
        message = "",
        name = "",
        phone = "",
      } = data || {};

      const leadData: Lead = {
        createdAt: new Date(),
        developerId: new ObjectId(developerId),
        email: email.toLowerCase().trim(),
        listingId: new ObjectId(listingId),
        message: message?.trim() || "",
        name: name.trim(),
        phone: phone.trim(),
        status: LeadStatusEnum.NEW,
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(leadData);

      logger.info(`Lead created successfully: ${result.insertedId}`);

      return { leadId: result.insertedId };
    } catch (error) {
      logger.error("Error in createLead:", error);
      throw error;
    }
  }

  async deleteLead(leadId: string): Promise<boolean> {
    try {
      validateObjectId(leadId);

      const result = await this.collection.deleteOne({ _id: new ObjectId(leadId) });

      if (result.deletedCount === 0) {
        throw new Error("Lead not found or already deleted");
      }

      logger.info(`Lead deleted: ${leadId}`);

      return true;
    } catch (error) {
      logger.error("Error in deleteLead:", error);
      throw error;
    }
  }

  async getAllLeads(
    query: PaginationQuery = {},
  ): Promise<{ leads: Lead[]; limit: number; skip: number; total: number }> {
    try {
      const { developerId, limit = 100, skip = 0, status } = query;
      const filter: Record<string, string | ObjectId> = {};

      if (status) {
        filter.status = status;
      }

      if (developerId && ObjectId.isValid(developerId)) {
        filter.developerId = new ObjectId(developerId);
      }

      const leads = await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.collection.countDocuments(filter);

      logger.info(`Fetched ${leads.length} total leads`);

      return {
        leads: leads as Lead[],
        limit: Number(limit),
        skip: Number(skip),
        total,
      };
    } catch (error) {
      logger.error("Error in getAllLeads:", error);
      throw error;
    }
  }

  async getDeveloperLeadStats(
    developerId: string,
  ): Promise<{ byStatus: Record<string, number>; total: number }> {
    try {
      validateObjectId(developerId);

      const totalLeads = await this.collection.countDocuments({
        developerId: new ObjectId(developerId),
      });

      const leadsAggregation = await this.collection
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
        byStatus: leadsAggregation?.byStatus ?? {},
        total: totalLeads,
      };
    } catch (error) {
      logger.error("Error in getDeveloperLeadStats:", error);
      throw error;
    }
  }

  async getLeadById(leadId: string): Promise<Lead> {
    try {
      const isValidLeadId = ObjectId.isValid(leadId);

      if (!leadId || !isValidLeadId) {
        throw new Error("Invalid lead ID");
      }

      const lead = await this.collection.findOne({ _id: new ObjectId(leadId) });

      if (!lead) {
        throw new Error("Lead not found");
      }

      return lead as Lead;
    } catch (error) {
      logger.error("Error in getLeadById:", error);
      throw error;
    }
  }

  async getLeadsByDeveloperId(
    developerId: string,
    query: PaginationQuery = {},
  ): Promise<{ leads: Lead[]; limit: number; skip: number; total: number }> {
    try {
      validateObjectId(developerId);

      const { limit = 10, skip = 0, status } = query;

      const filter: Record<string, string | ObjectId> = { developerId: new ObjectId(developerId) };

      if (status) {
        filter.status = status;
      }

      const leads = await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await this.collection.countDocuments(filter);

      logger.info(`Fetched ${leads.length} leads for developer: ${developerId}`);

      return {
        leads: leads as Lead[],
        limit: Number(limit),
        skip: Number(skip),
        total,
      };
    } catch (error) {
      logger.error("Error in getLeadsByDeveloperId:", error);
      throw error;
    }
  }

  async updateLeadStatus(leadId: string, data: UpdateLeadDTO): Promise<boolean> {
    try {
      const { status } = data;
      validateObjectId(leadId);

      const hasRelevantStatus = [
        LeadStatusEnum.CONTACTED,
        LeadStatusEnum.CONVERTED,
        LeadStatusEnum.NEW,
        LeadStatusEnum.REJECTED,
      ].includes(status);

      if (!status || !hasRelevantStatus) {
        throw new Error("Invalid status. Allowed values: new, contacted, converted, rejected");
      }

      const existingLead = await this.collection.findOne({ _id: new ObjectId(leadId) });

      if (!existingLead) {
        throw new Error("Lead not found");
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(leadId) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
      );

      const hasCount = result.modifiedCount === 0;
      if (hasCount) {
        throw new Error("Lead status not updated");
      }

      logger.info(`Lead status updated: ${leadId} -> ${status}`);

      return true;
    } catch (error) {
      logger.error("Error in updateLeadStatus:", error);
      throw error;
    }
  }
}

export default new LeadService();
