import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { env } from "../user/user.validation.ts";
import { User } from "../user/user.model.ts";
import type { IcustomJwtPayloadForAccessToken } from "./auth.types.ts";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new ApiError(401, "unauthorised request");
    }

    const decodedToken = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    ) as IcustomJwtPayloadForAccessToken;

    if (!decodedToken) {
      throw new ApiError(401, "token is expired");
    }

    const user = await User.findById(decodedToken._id).select(
      " -password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "invalid Access Token");
    }
    (req as any).user = user;

    next();
  } catch (error) {
    throw new ApiError(401, (error as any)?.message || "invalid Access  Token");
  }
});

export { verifyJWT };
