import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { adminUsersRouter } from "./routes/admin/users.js";
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
  app.use("/api/admin/users", adminUsersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}