import type { Request, Response } from "express";

import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import listingServices from "#services/listing.services.js";
import { toNumber } from "#utils/toNumber.utils.js";

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingServices.createListing(req.body);

  res.status(201).json({
    data: result,
    message: "Listing created successfully",
    success: true,
  });
});

export const listings = asyncHandler(async (req: Request, res: Response) => {
  const {
    city,
    developerId,
    limit,
    maxBedrooms,
    maxPrice,
    minBedrooms,
    minPrice,
    neighborhood,
    skip,
    status,
  } = req.query || {};

  const query = {
    city: city as string,
    developerId: developerId as string,
    limit: toNumber(limit),
    maxBedrooms: toNumber(maxBedrooms),
    maxPrice: toNumber(maxPrice),
    minBedrooms: toNumber(minBedrooms),
    minPrice: toNumber(minPrice),
    neighborhood: neighborhood as string,
    skip: toNumber(skip),
    status: status as string,
  };

  const result = await listingServices.getAllListings(query);

  res.status(200).json({
    data: result,
    message: "All listings fetched successfully",
    success: true,
  });
});

export const listingsByDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;
  const { limit, skip, status } = req.query || {};

  const query = {
    limit: toNumber(limit),
    skip: toNumber(skip),
    status: status as string,
  };

  const result = await listingServices.getListingsByDeveloperId(developerId, query);

  res.status(200).json({
    data: result,
    message: "Listings fetched successfully",
    success: true,
  });
});

export const listingById = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.id;
  const result = await listingServices.getListingById(listingId);

  res.status(200).json({
    data: result,
    message: "Listing fetched successfully",
    success: true,
  });
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.id;
  const developerId = req.body.developerId;
  const updateData = req.body;

  await listingServices.updateListing(listingId, developerId, updateData);

  res.status(200).json({
    data: null,
    message: "Listing updated successfully",
    success: true,
  });
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.id;
  const developerId = req.body.developerId;

  await listingServices.deleteListing(listingId, developerId);

  res.status(200).json({
    data: null,
    message: "Listing deleted successfully",
    success: true,
  });
});

export const reorderListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.id;
  const developerId = req.body.developerId;
  const { newDisplayOrder } = req.body;

  if (typeof newDisplayOrder !== "number" || newDisplayOrder < 0) {
    throw new Error("Invalid newDisplayOrder: must be a non-negative number");
  }

  await listingServices.reorderListing(listingId, developerId, newDisplayOrder);

  res.status(200).json({
    data: null,
    message: "Listing reordered successfully",
    success: true,
  });
});
