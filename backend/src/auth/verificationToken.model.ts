import { string } from "zod";
import type { IVerificationToken } from "./auth.types.js";
import { Schema, model } from "mongoose";

const verificationEmailSchema = new Schema<IVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      requied: true,
      unique:true,
      index:true
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { 
    timestamps: true    
    }
);

export const VerificationEmail = model("VerificationEmail",verificationEmailSchema)
