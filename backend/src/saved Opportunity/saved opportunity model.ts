import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { ref } from "node:process";
import { User } from "../user/user.model.ts";
import { type IOpportunity } from "./saved opportunity types.ts";
import { Opportunity } from "../opportunity/opportunity.model.ts";

const savedOpportunitySchema = new Schema<IOpportunity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
      index:true
    },
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: Opportunity,
      required: true,
    },
    savedAt:{
        type:Date,
        required:true,
        default:Date.now()
    }
  },
  { timestamps: true }
);



const SavedOpportunity = model("SavedOpportunity",savedOpportunitySchema)

export  {SavedOpportunity}
