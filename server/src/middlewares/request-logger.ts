import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  response.setHeader("X-Request-Id", requestId);

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;

    console.log(
      JSON.stringify({
        requestId,
        method: request.method,
        url: request.originalUrl,
        statusCode: response.statusCode,
        durationMs,
      }),
    );
  });

  next();
};
