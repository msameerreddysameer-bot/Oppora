import { Types } from "mongoose";

export interface IOpportunity {
  user: Types.ObjectId;
  opportunity: Types.ObjectId;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
