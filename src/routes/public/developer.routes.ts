import express from "express";

import { developerById, developers } from "#controllers/developer.controller.js";

const developerOpenRoutes = express.Router();

developerOpenRoutes.get("/", developers);
developerOpenRoutes.get("/:id", developerById);

export default developerOpenRoutes;
