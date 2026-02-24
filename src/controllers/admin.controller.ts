import type { Request, Response } from "express";

import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import adminServices from "#services/admin.services.js";

export const createDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminServices.createDeveloper(req.body);

  res.status(201).json({
    data: result,
    message: "Developer created successfully",
    success: true,
  });
});

export const updateDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;
  const updateData = req.body;

  await adminServices.updateDeveloper(developerId, updateData);

  res.status(200).json({
    data: null,
    message: "Developer updated successfully",
    success: true,
  });
});

export const approveDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;

  await adminServices.approveDeveloper(developerId);

  res.status(200).json({
    data: null,
    message: "Developer approved successfully",
    success: true,
  });
});

export const rejectDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;

  await adminServices.rejectDeveloper(developerId);

  res.status(200).json({
    data: null,
    message: "Developer rejected successfully",
    success: true,
  });
});

export const deleteDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;

  await adminServices.deleteDeveloper(developerId);

  res.status(200).json({
    data: null,
    message: "Developer deleted successfully",
    success: true,
  });
});

export const platformStats = asyncHandler(async (_: Request, res: Response) => {
  const result = await adminServices.getPlatformStats();

  res.status(200).json({
    data: result,
    message: "Platform stats fetched successfully",
    success: true,
  });
});

export const developerStats = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.developerId;
  const result = await adminServices.getDeveloperStats(developerId);

  res.status(200).json({
    data: result,
    message: "Developer stats fetched successfully",
    success: true,
  });
});
