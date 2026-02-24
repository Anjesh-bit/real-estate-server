import express from "express";

import {
  createListing,
  deleteListing,
  listingById,
  listings,
  listingsByDeveloper,
  reorderListing,
  updateListing,
} from "#controllers/listing.controller.js";

const listingRoutes = express.Router();

listingRoutes.route("/").post(createListing).get(listings);
listingRoutes.route("/:id").put(updateListing).delete(deleteListing).get(listingById);
listingRoutes.get("/developer/:id", listingsByDeveloper);
listingRoutes.get("/reorder/:id", reorderListing);

export default listingRoutes;
