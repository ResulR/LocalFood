import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env.js";

export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = "HTTP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    ok: false,
    error: "Route not found",
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  const code = error instanceof HttpError ? error.code : "INTERNAL_SERVER_ERROR";

  response.status(statusCode).json({
    ok: false,
    error: message,
    code,
    ...(env.NODE_ENV === "development" && error instanceof Error ? { stack: error.stack } : {}),
  });
};