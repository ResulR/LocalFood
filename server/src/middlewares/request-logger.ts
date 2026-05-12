import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  response.setHeader("X-Request-Id", requestId);

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;

    logger.info(
      {
        requestId,
        method: request.method,
        url: request.originalUrl,
        statusCode: response.statusCode,
        durationMs,
      },
      "HTTP request completed",
    );
  });

  next();
};
