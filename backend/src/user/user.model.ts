import { Schema, model } from "mongoose";
import type { IUser } from "./user.types.ts";
import bcrypt from "bcrypt";
import type { NextFunction } from "express";
import type { Document } from "mongoose";
import  jwt  from "jsonwebtoken";
import { env } from "./user.validation.js";
import { boolean, string } from "zod";

const userSchema = new Schema<IUser>(
  {

    avatar:{
      type:String
    },

    FullName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    college: {
      type: String,
      index: true,
    },

    branch: {
      type: String,
      index: true,
    },

    year: {
      type: String,
      index: true,
    },

    refreshToken:{
        type:String
    },

    skills: {
        type:[String],
        index:true,
        default:[]
    },

    interests: {
        type:[String],
        index:true,
        default:[]
    },

    isEmailVerified:{
      type:Boolean

    }
  },
  {
    timestamps:true,
  }
);

userSchema.pre("save",async function () {

    if (!this.isModified("password")) return ;

    let combinedPassword = this.password + env.PASSWORD_PEPPER
    this.password =await  bcrypt.hash(combinedPassword,10)
    ;
    
})

userSchema.methods.isPasswordCorrect = async function (password: string) {
  const combinedPassword = password + env.PASSWORD_PEPPER;
  return await bcrypt.compare(combinedPassword, this.password);
};

userSchema.methods.generateAccessToken = function(this:IUser) {
    return jwt.sign(
        {
            _id:(this as any)._id,
            email:this.email,
            FullName:this.FullName
        },
        env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn:env.ACCESS_TOKEN_EXPIRY  as any
        }

    )
}

userSchema.methods.generateRefreshToken = function(this:IUser ) {
    return jwt.sign(
        {
            _id:(this as any)._id
        },
        env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn:env.REFRESH_TOKEN__EXPIRY as any
        }

    )
}




export const User = model<IUser>("User", userSchema);
