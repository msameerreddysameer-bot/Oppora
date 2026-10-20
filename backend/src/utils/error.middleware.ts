import type { Request, Response, NextFunction } from "express";
import { ApiError } from "./ApiError.ts";

/**
 * Global Error Handling Middleware for Express
 * Catches all errors forwarded via next(err), formats ApiError instances,
 * handles common database errors (e.g. Mongo duplicate key, cast errors),
 * and returns a uniform JSON response to the client instead of dumping raw stack traces.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  // Normalize non-ApiError instances into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new ApiError(409, `${field} already exists`);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  const statusCode = error.statusCode || 500;

  // Log unexpected internal server errors (500) for diagnostic tracking
  // Routine validation or auth rejections (400, 401, 404, 409) do not produce noisy server logs
  if (statusCode >= 500) {
    console.error(
      `[Server Error 500] ${req.method} ${req.originalUrl}:`,
      error.message
    );
  }

  // In production, mask raw server error details to protect internal schema and database info
  const isProduction = process.env.NODE_ENV === "production";
  const safeMessage =
    statusCode >= 500 && isProduction
      ? "Internal server error. Please try again later."
      : error.message || "Something went wrong";

  const response = {
    statusCode,
    success: false,
    message: safeMessage,
    errors: error.errors || [],
    data: null,
  };

  return res.status(statusCode).json(response);
};
