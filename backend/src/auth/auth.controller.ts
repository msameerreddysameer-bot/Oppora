import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import {
    type IcustomJwtPayloadForAccessToken,
  type IcustomJwtPayloadForRefreshToken,
  type IForgotPassword,
  type IRegisterResponse,
  type IverifyVerificationToken,
  type Register,
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
import { generateVerificationToken } from "../utils/token.ts";
import { VerificationEmail } from "./verificationToken.model.ts";
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import jwt from "jsonwebtoken"

import { Resend } from "resend";
import { type IUser } from "../user/user.types.ts";

import {
  generateAccessTokenandRefreshToken,
  storeVerificationToken,
} from "./auth.service.ts";
import type { string } from "zod";
import { env } from "../user/user.validation.ts";
import { sendVerificationEmail } from "./auth.service.ts";





const registerUser = asyncHandler(async (req, res) => {
  const validateData = RegisterSchema.safeParse(req.body);

  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
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
      const token = (await storeVerificationToken(existedUser._id as any)).token;
      sendVerificationEmail(token, existedUser.email, "verify-email");

      return res.status(200).json(
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

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  const token = (await storeVerificationToken(user._id)).token;

  sendVerificationEmail(token, user.email, "verify-email");

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


  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
  }
  const { token } = validateData.data;

  const incomingTokenHash = createHash("sha256").update(token).digest("hex");

  const verificationEmail = await VerificationEmail.findOne({
    token: incomingTokenHash,
  });

  const currentTime = new Date(Date.now());

  if (!verificationEmail?.expiresAt) {
    throw new ApiError(400, "verification data is missing");
  }

  if (!(verificationEmail && verificationEmail?.expiresAt > currentTime)) {
    throw new ApiError(400, "token is expired");
  }

  const userId = verificationEmail.userId;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isEmailVerified: true,
    },
    {
      returnDocument: "after",
      runValidators: false,
    }
  );
  if (!user) {
    throw new ApiError(400, "user not found");
  }

  // Delete verification email document(s) for this user upon successful verification
  await VerificationEmail.deleteMany({ userId: user._id });

  res
    .status(200)
    .json(
      new ApiResponse<IverifyVerificationToken>(
        200,
        { isEmailVerified: user?.isEmailVerified },
        "email is verified successfully"
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const validateData = forgotPasswordSchema.safeParse(req.body);

     
  
  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
  }
  const { email } = validateData.data;

  const user = await User.findOne({ email: email }).select(
    " -password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const token = (await storeVerificationToken(user._id)).token;

  sendVerificationEmail(token, email, "reset-password");

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
    password: req.body.password,
    token: req.query.token,
  });


  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
  }

  const { password, token } = validateData.data;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const verificationEmail = await VerificationEmail.findOne({ token: tokenHash });

  const userId = verificationEmail?.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = password;
  await user.save();

    // ✅ 3. Delete used token
  await VerificationEmail.findByIdAndDelete(verificationEmail?._id);



  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset successfully"));
});

const login = asyncHandler(async (req, res) => {
  const validateData = loginSchema.safeParse(req.body);


  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
  }

  const { email, password } = validateData.data;

  const user = await User.findOne({ email: email }).select(
    "-refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(404, "User not found");
  }

  const passwordCorrect = await user.isPasswordCorrect(password);

  if (!passwordCorrect) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  const tokenResult = await generateAccessTokenandRefreshToken(user?._id);

  if (!tokenResult) {
    throw new ApiError(
      500,
      "failed to generate access token and refresh token "
    );
  }

  const { accessToken, refreshToken } = tokenResult;

  const options = {
    httpOnly: true,
    secure: true,
  };
  // send response without password refreshToken role

  const resUser = await User.findOne({email:email}).select("-refreshToken -password ")

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .header("Authorization",`Bearer S{accessToken} `)
    .header("x-refreshToken", refreshToken )
    .json(new ApiResponse(200,resUser, "logined Successfully"));
});


const logout = asyncHandler(async (req, res) => {


    const user = await User.findByIdAndUpdate(


        (req as any).user?._id,
        {
            $unset:{
                refreshToken:1.        //this removes the field from the document
            }
        },
        {
            returnDocument: "after",
            runValidators: false
        }
    )

    if (!user){
        throw new ApiError(404,"User not found")
    }
 
    const options = {
          httpOnly:true,
          secure:true
    }
    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
    //res.removeHeader("Authorization")
    //res.removeHeader("x-refreshToken")
})

const changeCurrentPassword = asyncHandler(async (req,res) => {

    const validateData = changePasswordSchema.safeParse(req.body)

  if(!validateData.success){
    throw new ApiError(400,validateData.error.issues[0]?.message|| "validation failed")
  }

  const { oldPassword , newPassword } = validateData.data

      if(!(req as any).user._id){
        throw new ApiError(401,"unauthorised request")
      }

    const user = await User.findById((req as any).user._id)

    if(!user){

        throw new ApiError(404,"User not found")
    }

    const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Current password is incorrect")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:true})

    res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))


})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshtoken = req.cookies?.refreshToken || req.body?.refreshToken || req.header("x-refreshToken")


if(!incomingRefreshtoken){
    throw new ApiError(401,"unauthorised request")
}
try {

     const decodedRefreshToken  = jwt.verify(incomingRefreshtoken,env.REFRESH_TOKEN_SECRET) as IcustomJwtPayloadForRefreshToken



     const user = await User.findById(decodedRefreshToken._id)

     if(!user){
        throw new ApiError(401,"token expired")

     }

     if(incomingRefreshtoken !== user?.refreshToken){

        throw new ApiError(401,"refresh token is expired")


     }


     const { accessToken , refreshToken } = await generateAccessTokenandRefreshToken(user._id)



     const options ={
        httpOnly:true,
        secure:true
     }



     res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(new ApiResponse(200,{},"access Token  refreshed successsfully"))

     res.header("Authorization",accessToken)
     res.header("x-refreshToken",refreshToken)


    
} catch (error) {

    throw new ApiError(401,(error as any).message || "invalid refresh Token")
    
}
   

})

export {
    registerUser,
    verifyVerificationToken,
    forgotPassword,
    resetPassword,
    login,
    logout,
    refreshAccessToken,
    changeCurrentPassword ,
    sendVerificationEmail
}