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

  const response = {
    statusCode,
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || [],
    data: null,
  };

  return res.status(statusCode).json(response);
};

