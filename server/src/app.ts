import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { adminUsersRouter } from "./routes/admin/users.js";
import { adminRestaurantPhotosRouter } from "./routes/admin/restaurant-photos.js";
import { publicAiRouter } from "./routes/public/ai.js";
import { publicRestaurantsRouter } from "./routes/public/restaurants.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", healthRouter);
  app.use("/api/public/ai", publicAiRouter);
  app.use("/api/public/restaurants", publicRestaurantsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/restaurant-photos", adminRestaurantPhotosRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
