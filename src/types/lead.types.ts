import type { ObjectId } from "mongodb";
import type z from "zod";

import type { LeadStatusEnum } from "#constants/enums/lead.enum.js";
import type {
  createLeadSchema,
  leadQuerySchema,
  leadSchema,
  updateLeadSchema,
} from "#validators/schema/lead.schema.js";

export type CreateLeadDTO = {
  developerId: string;
  email: string;
  listingId: string;
  message?: string;
  name: string;
  phone: string;
};
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type Lead = {
  _id?: ObjectId;
  createdAt: Date;
  developerId: ObjectId;
  email: string;
  listingId: ObjectId;
  message?: string;
  name: string;
  phone: string;
  status:
    | LeadStatusEnum.CONTACTED
    | LeadStatusEnum.CONVERTED
    | LeadStatusEnum.NEW
    | LeadStatusEnum.REJECTED;
  updatedAt: Date;
};
export type LeadInput = z.infer<typeof leadSchema>;

export type LeadQuery = z.infer<typeof leadQuerySchema>;

export type PaginationQuery = {
  developerId?: string;
  limit?: number;
  skip?: number;
  status?: string;
};

export type UpdateLeadDTO = {
  status:
    | LeadStatusEnum.CONTACTED
    | LeadStatusEnum.CONVERTED
    | LeadStatusEnum.NEW
    | LeadStatusEnum.REJECTED;
};

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
