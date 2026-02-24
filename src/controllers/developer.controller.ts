import type { Request, Response } from "express";

import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import developerServices from "#services/developer.services.js";
import { toNumber } from "#utils/toNumber.utils.js";
import { toString } from "#utils/toString.utils.js";

export const developers = asyncHandler(async (req: Request, res: Response) => {
  const { approved, limit, search, skip } = req.query || {};

  const query = {
    approved: toString(approved),
    limit: toNumber(limit),
    search: toString(search),
    skip: toNumber(skip),
  };

  const result = await developerServices.getAllDevelopers(query);

  res.status(200).json({
    data: result,
    message: "All developers fetched successfully",
    success: true,
  });
});

export const developerById = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;

  const result = await developerServices.getDeveloperById(developerId);

  res.status(200).json({
    data: result,
    message: "Developer fetched successfully",
    success: true,
  });
});
