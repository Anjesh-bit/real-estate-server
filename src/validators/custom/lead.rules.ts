import { z } from "zod";

const isValidUrl = (val: string) => {
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

export const leadCustomRules = {
  company: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must not exceed 200 characters")
    .optional()
    .transform((val) => val?.trim()),
  email: z.email(),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must not exceed 1000 characters")
    .transform((msg) => msg.trim()),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .transform((name) => name.trim()),

  phone: z
    .string()
    .regex(/^\+?\d{3}[-\s.]?\d{3}[-\s.]?\d{4,6}$/, "Invalid phone number format")
    .transform((phone) => phone.replace(/[\s\-()]/g, "")),
  website: z
    .string()
    .optional()
    .refine((val) => !val || isValidUrl(val), { message: "Invalid URL format" }),
};
