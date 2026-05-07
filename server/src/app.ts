import cors from "cors";
import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { adminUsersRouter } from "./routes/admin/users.js";
import { adminCompaniesRouter } from "./routes/admin/companies.js";
import { adminRestaurantPhotosRouter } from "./routes/admin/restaurant-photos.js";
import { publicAiRouter } from "./routes/public/ai.js";
import { publicRestaurantsRouter } from "./routes/public/restaurants.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { adminRestaurantsRouter } from "./routes/admin/restaurants.js";

const uploadsRoot = fileURLToPath(new URL("../uploads", import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use("/uploads", express.static(uploadsRoot));
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/public/ai", publicAiRouter);
  app.use("/api/public/restaurants", publicRestaurantsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/companies", adminCompaniesRouter);
  app.use("/api/admin/restaurants", adminRestaurantsRouter);
  app.use("/api/admin/restaurant-photos", adminRestaurantPhotosRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
