import express from "express";

import {
  approveDeveloper,
  createDeveloper,
  deleteDeveloper,
  rejectDeveloper,
  updateDeveloper,
} from "#controllers/admin.controller.js";
import { leads } from "#controllers/lead.controller.js";

const adminRoutes = express.Router();

adminRoutes.post("/developers", createDeveloper);
adminRoutes.post("/developers/approve", approveDeveloper);
adminRoutes.post("/developers/reject", rejectDeveloper);
adminRoutes.route("/developers/:id").put(updateDeveloper).delete(deleteDeveloper);
adminRoutes.get("/leads", leads);

export default adminRoutes;
