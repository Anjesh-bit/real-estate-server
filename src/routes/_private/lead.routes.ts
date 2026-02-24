import express from "express";

import {
  createLead,
  deleteLead,
  leadById,
  leads,
  leadsByDeveloper,
  updateLeadStatus,
} from "#controllers/lead.controller.js";

const leadRoutes = express.Router();

leadRoutes.route("/").post(createLead).get(leads);
leadRoutes.get("/developers/:id", leadsByDeveloper);
leadRoutes.route("/:id").put(updateLeadStatus).get(leadById);
leadRoutes.delete("/:id", deleteLead);

export default leadRoutes;
