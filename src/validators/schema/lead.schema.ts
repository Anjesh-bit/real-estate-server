import { z } from "zod";

import { LeadStatusEnum } from "#constants/enums/lead.enum.js";
import { leadCustomRules } from "#validators/custom/lead.rules.js";

export const leadSchema = z
  .object({
    company: leadCustomRules.company.optional(),
    email: leadCustomRules.email.optional(),
    message: leadCustomRules.message.optional(),
    name: leadCustomRules.name.optional(),
    phone: leadCustomRules.phone.optional(),
    source: z.enum(["website", "facebook", "google", "referral", "other"]).optional(),
    website: leadCustomRules.website.optional(),
  })
  .refine((data) => data.email || data.phone, {
    error: "Either email or phone is required",
    path: ["email"],
  });

export const createLeadSchema = leadSchema;

export const updateLeadSchema = leadSchema.partial();

export const leadQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  search: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum([
      LeadStatusEnum.NEW,
      LeadStatusEnum.CONTACTED,
      LeadStatusEnum.CONVERTED,
      LeadStatusEnum.REJECTED,
    ])
    .optional(),
});
