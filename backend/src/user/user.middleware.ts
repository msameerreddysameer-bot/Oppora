import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { User } from "./user.model.ts";
import { ApiError } from "../utils/ApiError.ts";
import { any } from "zod";

const isAdmin = asyncHandler(async (req, _, next) => {
  try {
    const user =
      (req as any).user ||
      ((req as any).user?._id
        ? await User.findById((req as any).user._id).select(
            "-password -refreshToken"
          )
        : null);

    if (!user) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (user.role !== "admin") {
      throw new ApiError(403, "Access denied: Admin privileges required");
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      (error as any)?.message || "Failed to verify admin privileges"
    );
  }
});

const isUser = asyncHandler(async (req, _, next) => {
  try {
    const user =
      (req as any).user ||
      ((req as any).user?._id
        ? await User.findById((req as any).user._id).select(
            "-password -refreshToken"
          )
        : null);

    if (!user) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (user.role !== "user" && user.role !== "admin") {
      throw new ApiError(403, "Access denied: User privileges required");
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      (error as any)?.message || "Failed to verify user privileges"
    );
  }
});

export { isAdmin, isUser };
