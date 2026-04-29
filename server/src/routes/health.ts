import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "localfood-api",
    timestamp: new Date().toISOString(),
  });
});
