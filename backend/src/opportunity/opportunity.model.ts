import mongoose from "mongoose";
import { Schema , model} from "mongoose";
import {  type Iopportunity } from "./opportunity.types.ts";
import { string } from "zod";
import { User } from "../user/user.model.ts";

const opportunitySchema = new Schema<Iopportunity>(
  {
    organizationLogo:{
      type:String,


    },
    category: {
      type: String,
      enum: [
        "Scholarship",
        "intership",
        "hackathon",
        "competition",
        "fellowship",
        "research",
        "open-source",
        "workshop",
      ],
      index:true
    },

    title: {
      type: String,
      required: true,
      index:true
    },

    description: {
      type: String,
      
    },

    organization: {
      type: String,

    },

    organizationType: {
      type: String,
      enum: [
        "government",
        "private",
        "university",
        "ngo",
        "start-up",
        "non-profit",
        "international-organisation",
      ],
      index:true
    },

    requiredDocuments:{
      type: [String],
      default:[]
    },

    startDate:{
        type:Date
    },

    deadline:{
        type:Date,
        index:true
    },

    officialSourceUrl:{
        type:String
    },

    eligibility:{
      type: [String],
      default:[]
    },

    gender:{
      type:String,
      enum:['male','female','other' ,'all'],
     
      index:true
      
    },

    sourceStatus:{
        type:String,
        enum:["live","expired"],
        default:"live",
        index:true
    },

    createdBy:{
        type:Schema.Types.ObjectId,
        ref:User,
        index:true
    },

    applicationUrl:{
        type:String
    },

    lastVerifiedAt:{
        type:Date,
        required:true,
        default:Date.now()
    },

    benefits:{
      type: [String],
      default:[]
    },
    benefitsSummary:{
      type:String
    },
    eligibilitySummary:{
      type:String
    },
    location:{
      type:String
    },
    educationLevel:{
      type:String,
     // required:true,
      enum:['high-school' , 'diploma' , 'undergraduate' , 'postgraduate' , 'phd' ,'all'],
      default:"all",
      index:true
    },



    status:{
        type:String,
        enum:["draft","active","closed"],
      
        default:"draft"
    },
    publicationStatus:{
        type:String,
        enum:["draft","published"],
        default:"draft",
        index:true
    }
 },
  { timestamps: true }
);


export const  Opportunity = model("Opportunity",opportunitySchema)
