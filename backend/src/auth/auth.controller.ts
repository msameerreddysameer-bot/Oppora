import { createHash } from "node:crypto";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import {
  type IForgotPassword,
  type IRegisterResponse,
  type IverifyVerificationToken,
  type IcustomJwtPayloadForRefreshToken,
} from "./auth.types.ts";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  RegisterSchema,
  resetPasswordSchema,
  verifyVerificationTokenSchema,
} from "./auth.validation.ts";
import { User } from "../user/user.model.ts";
import { VerificationEmail } from "./verificationToken.model.ts";
import {
  generateAccessTokenandRefreshToken,
  storeVerificationToken,
  sendVerificationEmail,
} from "./auth.service.ts";
import { env } from "../user/user.validation.ts";

// Helper to generate consistent, environment-aware cookie options
const getCookieOptions = (maxAgeMs?: number) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
};

const registerUser = asyncHandler(async (req, res) => {
  const validateData = RegisterSchema.safeParse(req.body);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { FullName, email, password } = validateData.data;

  const existedUser = await User.findOne({ email: email });

  if (existedUser) {
    if (existedUser.isEmailVerified) {
      throw new ApiError(
        409,
        "User with this email already exists and is verified. Please log in."
      );
    } else {
      // Best Practice: If user registered earlier but never verified their email,
      // update details, generate a fresh token, and resend the verification email.
      existedUser.FullName = FullName;
      existedUser.password = password;
      await existedUser.save();

      await VerificationEmail.deleteMany({ userId: existedUser._id });
      const token = (
        await storeVerificationToken(existedUser._id as Types.ObjectId)
      ).token;
      await sendVerificationEmail(token, existedUser.email, "verify-email");

      return res
        .status(200)
        .json(
          new ApiResponse<IRegisterResponse>(
            200,
            { success: true, isEmailVerified: false },
            "Account already exists but was not verified. A fresh verification email has been sent to your email."
          )
        );
    }
  }

  const user = await User.create({
    FullName: FullName,
    email: email,
    password: password,
    isEmailVerified: false,
    role: "user",
  });

  const token = (await storeVerificationToken(user._id as Types.ObjectId))
    .token;

  await sendVerificationEmail(token, user.email, "verify-email");

  res
    .status(201)
    .json(
      new ApiResponse<IRegisterResponse>(
        201,
        { success: true, isEmailVerified: user.isEmailVerified },
        "user registered successfully and check your email to verify"
      )
    );
});

const verifyVerificationToken = asyncHandler(async (req, res) => {
  const validateData = verifyVerificationTokenSchema.safeParse(req.query);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }
  const { token } = validateData.data;

  const incomingTokenHash = createHash("sha256").update(token).digest("hex");

  const verificationEmail = await VerificationEmail.findOne({
    token: incomingTokenHash,
  });

  if (!verificationEmail) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  const currentTime = new Date();

  if (verificationEmail.expiresAt <= currentTime) {
    await VerificationEmail.findByIdAndDelete(verificationEmail._id);
    throw new ApiError(
      400,
      "Verification token has expired. Please request a new one."
    );
  }

  const userId = verificationEmail.userId;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isEmailVerified: true,
    },
    {
      new: true,
      runValidators: false,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete verification email document(s) for this user upon successful verification
  await VerificationEmail.deleteMany({ userId: user._id });

  res
    .status(200)
    .json(
      new ApiResponse<IverifyVerificationToken>(
        200,
        { isEmailVerified: user.isEmailVerified },
        "email is verified successfully"
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const validateData = forgotPasswordSchema.safeParse(req.body);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }
  const { email } = validateData.data;

  const user = await User.findOne({ email: email }).select(
    " -password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Invalidate previous reset tokens for this user
  await VerificationEmail.deleteMany({ userId: user._id });

  const token = (await storeVerificationToken(user._id as Types.ObjectId))
    .token;

  await sendVerificationEmail(token, email, "reset-password");

  res
    .status(200)
    .json(
      new ApiResponse<IForgotPassword>(
        200,
        {},
        "Verification email sent successfully"
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const validateData = resetPasswordSchema.safeParse({
    password: req.body?.password,
    token: (req.query.token as string) || (req.body?.token as string),
  });

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { password, token } = validateData.data;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const verificationEmail = await VerificationEmail.findOne({
    token: tokenHash,
  });

  if (!verificationEmail) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  if (verificationEmail.expiresAt <= new Date()) {
    await VerificationEmail.findByIdAndDelete(verificationEmail._id);
    throw new ApiError(
      400,
      "Reset token has expired. Please request a new password reset."
    );
  }

  const userId = verificationEmail.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = password;
  await user.save();

  // Invalidate all tokens for this user after password reset
  await VerificationEmail.deleteMany({ userId: user._id });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset successfully"));
});

const login = asyncHandler(async (req, res) => {
  const validateData = loginSchema.safeParse(req.body);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { email, password } = validateData.data;

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email address before logging in."
    );
  }

  const passwordCorrect = await user.isPasswordCorrect(password);

  if (!passwordCorrect) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  const tokenResult = await generateAccessTokenandRefreshToken(
    user._id as Types.ObjectId
  );

  if (!tokenResult) {
    throw new ApiError(
      500,
      "failed to generate access token and refresh token "
    );
  }

  const { accessToken, refreshToken } = tokenResult;
  const accessCookieOptions = getCookieOptions(24 * 60 * 60 * 1000); // 1 day
  const refreshCookieOptions = getCookieOptions(10 * 24 * 60 * 60 * 1000); // 10 days

  // Convert user to plain object and remove sensitive credentials without a second DB query
  const resUser = user.toObject();
  delete (resUser as any).password;
  delete (resUser as any).refreshToken;

  res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .header("Authorization", `Bearer ${accessToken}`)
    .header("x-refreshToken", refreshToken)
    .json(new ApiResponse(200, resUser, "Logged in successfully"));
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    (req as any).user?._id,
    {
      $unset: {
        refreshToken: 1, // removes the field from the document
      },
    },
    {
      new: true,
      runValidators: false,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const clearOptions = getCookieOptions();
  res
    .status(200)
    .clearCookie("accessToken", clearOptions)
    .clearCookie("refreshToken", clearOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const validateData = changePasswordSchema.safeParse(req.body);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { oldPassword, newPassword } = validateData.data;

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password cannot be the same as your current password"
    );
  }

  const userId = (req as any).user?._id;
  if (!userId) {
    throw new ApiError(401, "unauthorised request");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshtoken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("x-refreshToken");

  if (!incomingRefreshtoken) {
    throw new ApiError(401, "unauthorised request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshtoken,
      env.REFRESH_TOKEN_SECRET
    ) as IcustomJwtPayloadForRefreshToken;

    const user = await User.findById(decodedRefreshToken._id);

    if (!user) {
      throw new ApiError(401, "User not found or session expired");
    }

    if (incomingRefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or revoked refresh token");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenandRefreshToken(user._id as Types.ObjectId);

    const accessCookieOptions = getCookieOptions(24 * 60 * 60 * 1000);
    const refreshCookieOptions = getCookieOptions(10 * 24 * 60 * 60 * 1000);

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .header("Authorization", `Bearer ${accessToken}`)
      .header("x-refreshToken", refreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, (error as any)?.message || "invalid refresh Token");
  }
});

export {
  registerUser,
  verifyVerificationToken,
  forgotPassword,
  resetPassword,
  login,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  sendVerificationEmail,
};
