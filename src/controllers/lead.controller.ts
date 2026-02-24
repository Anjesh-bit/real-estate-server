import type { Request, Response } from "express";

import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import leadServices from "#services/lead.services.js";
import { toNumber } from "#utils/toNumber.utils.js";
import { toString } from "#utils/toString.utils.js";

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const result = await leadServices.createLead(req.body);

  res.status(201).json({
    data: result,
    message: "Lead created successfully",
    success: true,
  });
});

export const leadsByDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.id;
  const { limit, skip, status } = req.query || {};
  const query = {
    limit: toNumber(limit),
    skip: toNumber(skip),
    status: toString(status),
  };

  const result = await leadServices.getLeadsByDeveloperId(developerId, query);

  res.status(200).json({
    data: result,
    message: "Leads fetched successfully",
    success: true,
  });
});

export const leads = asyncHandler(async (req: Request, res: Response) => {
  const { developerId, limit, skip, status } = req.query || {};

  const query = {
    developerId: toString(developerId),
    limit: toNumber(limit),
    skip: toNumber(skip),
    status: toString(status),
  };

  const result = await leadServices.getAllLeads(query);

  res.status(200).json({
    data: result,
    message: "All leads fetched successfully",
    success: true,
  });
});

export const leadById = asyncHandler(async (req: Request, res: Response) => {
  const leadId = req.params.id;
  const result = await leadServices.getLeadById(leadId);

  res.status(200).json({
    data: result,
    message: "Lead fetched successfully",
    success: true,
  });
});

export const updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const leadId = req.params.id;
  const updateData = req.body;

  await leadServices.updateLeadStatus(leadId, updateData);

  res.status(200).json({
    data: null,
    message: "Lead status updated successfully",
    success: true,
  });
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const leadId = req.params.id;

  await leadServices.deleteLead(leadId);

  res.status(200).json({
    data: null,
    message: "Lead deleted successfully",
    success: true,
  });
});

export const developerLeadStats = asyncHandler(async (req: Request, res: Response) => {
  const developerId = req.params.developerId;
  const result = await leadServices.getDeveloperLeadStats(developerId);

  res.status(200).json({
    data: result,
    message: "Developer lead stats fetched successfully",
    success: true,
  });
});
