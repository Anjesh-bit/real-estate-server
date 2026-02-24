import { ObjectId } from "mongodb";

import type { FilterOptions } from "#types/listing.types.js";

export const buildListingFilter = (options: FilterOptions) => {
  const filter: any = {};

  if (options.status) {
    filter.status = options.status;
  }

  ["city", "neighborhood"].forEach((field) => {
    const value = (options as any)[field];
    if (value) {
      filter[field] = { $options: "i", $regex: value };
    }
  });

  const numericFields: Record<string, [string, string]> = {
    bedrooms: ["minBedrooms", "maxBedrooms"],
    price: ["minPrice", "maxPrice"],
  };

  Object.entries(numericFields).forEach(([field, [minKey, maxKey]]) => {
    const min = (options as any)[minKey];
    const max = (options as any)[maxKey];
    console.log(min, max);
    if (min !== undefined || max !== undefined) {
      filter[field] = {};
      if (min !== undefined) {
        filter[field].$gte = Number(min);
      }
      if (max !== undefined) {
        filter[field].$lte = Number(max);
      }
    }
  });

  if (options.developerId && ObjectId.isValid(options.developerId)) {
    filter.developerId = new ObjectId(options.developerId);
  }

  return filter;
};
