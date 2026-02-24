import type { ObjectId } from "mongodb";

import type { ListingStatus } from "#constants/enums/listing.enum.js";

export type CreateListingDTO = {
  bedrooms: number;
  city: string;
  description: string;
  developerId: string;
  images: string[];
  neighborhood: string;
  price: number;
  size: number;
  status?: ListingStatus.Active | ListingStatus.Draft | ListingStatus.InActive;
  title: string;
};

export type FilterOptions = {
  city?: string;
  developerId?: string;
  maxBedrooms?: number | string;
  maxPrice?: number | string;
  minBedrooms?: number | string;
  minPrice?: number | string;
  neighborhood?: string;
  status?: string;
};

export type Listing = {
  _id?: ObjectId;
  bedrooms: number;
  city: string;
  createdAt: Date;
  description: string;
  developerId: ObjectId;
  displayOrder: number;
  images: string[];
  neighborhood: string;
  price: number;
  size: number;
  status: ListingStatus.Active | ListingStatus.Draft | ListingStatus.InActive;
  title: string;
  updatedAt: Date;
};

export type ListingQuery = {
  city?: string;
  developerId?: string;
  limit?: number;
  maxBedrooms?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minPrice?: number;
  neighborhood?: string;
  skip?: number;
  status?: string;
};

export type UpdateListingDTO = {
  bedrooms?: number;
  city?: string;
  description?: string;
  images?: string[];
  neighborhood?: string;
  price?: number;
  size?: number;
  status?: ListingStatus.Active | ListingStatus.Draft | ListingStatus.InActive;
  title?: string;
};
