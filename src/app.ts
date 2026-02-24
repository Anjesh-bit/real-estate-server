import express from "express";

import { errorHandler } from "#middlewares/error/errorHandler.middleware.js";
import adminRoutes from "#routes/_private/admin.routes.js";
import authRoutes from "#routes/_private/auth.routes.js";
import developerRoutes from "#routes/_private/developer.routes.js";
import leadRoutes from "#routes/_private/lead.routes.js";
import listingRoutes from "#routes/_private/listing.routes.js";
import { developerOpenRoutes } from "#routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/developers", developerOpenRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
