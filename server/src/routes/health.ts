import { Router } from "express";
import { dbQuery } from "../lib/db.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_request, response) => {
  try {
    await dbQuery("select 1");

    response.json({
      ok: true,
      service: "localfood-api",
      db: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    response.status(503).json({
      ok: false,
      service: "localfood-api",
      db: "error",
      timestamp: new Date().toISOString(),
    });
  }
});
