import express from "express";

const listingOpenRoutes = express.Router();

listingOpenRoutes.get("/", () => {});
listingOpenRoutes.get("/developer/:id", () => {});
listingOpenRoutes.get("/:id", () => {});

export default listingOpenRoutes;
