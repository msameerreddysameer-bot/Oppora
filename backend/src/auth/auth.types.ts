import { Types } from "mongoose";
import { z } from "zod";
import {
  RegisterSchema,
  verifyVerificationTokenSchema,
} from "./auth.validation.ts";

export interface IVerificationToken {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IRegisterResponse {
  success?: boolean;
  isEmailVerified?: boolean;
}

export interface IverifyVerificationToken {
  isEmailVerified: boolean;
}

export interface IForgotPassword {}

export type Register = z.infer<typeof RegisterSchema>;

export interface IcustomJwtPayloadForAccessToken {
  _id: string;
  email: string;
  FullName: string;
}

export interface IcustomJwtPayloadForRefreshToken {
    _id:string
}

//export type verifyVerificationToken = z.infer<typeof verifyVerificationTokenSchema >
