import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { type IApplication } from "./application types.ts";
import { User } from "../user/user.model.ts";
import { Opportunity } from "../opportunity/opportunity.model.ts";

const applicationSchema = new Schema<IApplication>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
      index: true,
    },
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: Opportunity,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "applied",
        "under-review",
        "interviewing",
        "offered",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring one user cannot submit duplicate applications for the same opportunity
applicationSchema.index({ user: 1, opportunity: 1 }, { unique: true });

export const Application = model("Application", applicationSchema);
