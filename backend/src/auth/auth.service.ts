import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import {
  type IRegisterResponse,
  type IverifyVerificationToken,
  type Register,
} from "./auth.types.ts";
import {
  RegisterSchema,
  verifyVerificationTokenSchema,
} from "./auth.validation.ts";
import { User } from "../user/user.model.ts";
import { generateVerificationToken } from "../utils/token.ts";
import { VerificationEmail } from "./verificationToken.model.ts";
import { createHash } from "node:crypto";
import { Types } from "mongoose";

import { Resend } from "resend";
import { type IUser } from "../user/user.types.ts";

const generateAccessTokenandRefreshToken = async (userId: Types.ObjectId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not found for token generation");
    }
    const accessToken = user.generateAccessToken() as string;

    const refreshToken = user.generateRefreshToken() as string;

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken: accessToken, refreshToken: refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating the access token and refresh token  "
    );
  }
};

const storeVerificationToken = async (userId: Types.ObjectId) => {
  const token = generateVerificationToken();

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const VerificationToken = await VerificationEmail.create({
    userId: userId,
    token: tokenHash,
    expiresAt: expiresAt,
  });

  return { token: token, message: "verification  Token stored Succesfully" };
};

const sendVerificationEmail = async (
  token: string,
  email: string,
  route: string
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const rawFrontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CORS_ORIGIN ||
    "https://oppora-iota.vercel.app";
  const frontendUrl = rawFrontendUrl.replace(/\/+$/, "");
  const link = `${frontendUrl}/${route}?token=${token}`;
  const isResetPassword = route === "reset-password";
  const subject = isResetPassword
    ? "Reset your password"
    : "Verify your email address";
  const action = isResetPassword ? "Reset Password" : "Verify Email";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Oppora Team <notifications@oppora.me>";

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333; line-height: 1.6;">
       <h2 style="color: #111111; margin-bottom: 16px;">${subject}</h2>
       <p style="font-size: 16px; margin-bottom: 24px;">
         Please click the button below to continue:
       </p>
      
       <div style="margin: 30px 0;">
         <a href="${link}" 
            style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
           ${action}
         </a>
       </div>

       <p style="font-size: 14px; color: #666666; margin-top: 30px;">
         If the button above doesn't work, copy and paste this link into your browser:
       </p>
       <p style="font-size: 14px; word-break: break-all;">
         <a href="${link}" style="color: #0066cc;">
           ${link}
         </a>
       </p>

       <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
       <p style="font-size: 12px; color: #999999;">
         If you didn't create an account, you can safely ignore this email.
       </p>
     </div>`,
    });

    if (error) {
      console.error(
        "[Email Delivery Error]: Resend rejected message:",
        error.message
      );
    }
  } catch (err: any) {
    console.error(
      "[Email Delivery Failed]:",
      err?.message || "Could not dispatch email via Resend"
    );
  }
};

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified. Please log in.");
  }

  const token = (await storeVerificationToken(user._id)).token;

  sendVerificationEmail(token, email, "verify-email");

  res
    .status(200)
    .json(
      new ApiResponse<IRegisterResponse>(
        200,
        { success: true, isEmailVerified: user.isEmailVerified },
        "Verification email sent successfully"
      )
    );
});

//  const verifyVerificationToken = asyncHandler(async (req, res) => {
//    const validateData = verifyVerificationTokenSchema.parse(req.query);
//    const { token } = validateData;

//    const incomingTokenHash = createHash("sha256").update(token).digest("hex");

//    const verificationEmail = await VerificationEmail.findOne({token:incomingTokenHash})

//    const currentTime = new Date(Date.now())

//    if (!verificationEmail?.expiresAt){
//      throw new ApiError(400,"verification data is missing")
//    }

//    if ( !(verificationEmail && verificationEmail?.expiresAt  > currentTime)){

//      throw new ApiError(400,"token is expired")

//    }

//    const userId = verificationEmail.userId

//    const user = await User.findByIdAndUpdate(
//      userId,
//      {
//        isEmailVerified:true
//      },
//      {
//        new:true,
//        runValidators:false
//      }
//    )
//    if(!user){
//      throw new ApiError(400,"user not found")
//    }

//    res.status(200).json(new ApiResponse<IverifyVerificationToken>(200,{isEmailVerified:user?.isEmailVerified},"email is verified successfully"))

//  });

export {
  storeVerificationToken,
  generateAccessTokenandRefreshToken,
  sendVerificationEmail,
};
