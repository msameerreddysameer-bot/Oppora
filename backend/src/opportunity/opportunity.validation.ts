import { z } from "zod";
import { } from "./opportunity.types.ts";


const parseFormDataArray = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return [value];
  }
};

export const OpportunityCategoryArray = [
  "Scholarship",
  "intership",
  "hackathon",
  "competition",
  "fellowship",
  "research",
  "open-source",
  "workshop",
] as const ;

const OrganisationTypeArray = [
        "government",
        "private",
        "university",
        "ngo",
        "start-up",
        "non-profit",
        "international-organisation",
      ] as const ;

export const createOpportunitySchema = z.object({
  category: z.enum(OpportunityCategoryArray),
  title:z.string().min(3),
  description:z.string(),
  organization:z.string(),
  organizationType:z.enum(OrganisationTypeArray),
  // requiredDocuments:z.preprocess(
  //   parseFormDataArray,
  //   z.array(z.enum(documentsOptions)).default([])
  // ),
  requiredDocuments:z.string().array().default([]),
  startDate:z.coerce.date(),
  deadline:z.coerce.date(),
  officialSourceUrl:z.string(),
  eligibility:z.array(z.string()),
  eligibilitySummary:z.string(),
  benefitsSummary:z.string(),
  location:z.string(),
  sourceStatus:z.enum(["live","expired"]),
  
  educationLevel:z.enum(['high-school' , 'diploma' , 'undergraduate' , 'postgraduate' , 'phd'] as const),
    applicationUrl:z.string(),
    benefits:z.array(z.string()),
    gender:z.enum(['male','female','other','all'] as const)




});

export const editOpportunitySchema = z.object({
  category: z.enum(OpportunityCategoryArray).optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  organization: z.union([z.string(), z.array(z.string())]).optional(),
  organizationType: z.enum(OrganisationTypeArray).optional(),
  requiredDocuments: z.string().array().optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  officialSourceUrl: z.string().optional(),
  eligibility: z.array(z.string()).optional(),
  eligibilitySummary: z.string().optional(),
  benefitsSummary: z.string().optional(),
  location: z.string().optional(),
  sourceStatus: z.enum(["live", "expired"]).optional(),
  educationLevel: z.enum(['high-school', 'diploma', 'undergraduate', 'postgraduate', 'phd', 'all'] as const).optional(),
  applicationUrl: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female', 'other', 'all'] as const).optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
  publicationStatus: z.enum(["draft", "published"]).optional(),
})

export const searchOpportunitySchema = z.object({
  queryTerm:z.string().optional(),
  page:z.coerce.number().default(1).optional(),
  limit:z.coerce.number().default(10).optional(),
  organizationType:z.preprocess((val) => (Array.isArray(val)?val:val?[val]:undefined),z.array(z.enum([
        "government",
        "private",
        "university",
        "ngo",
        "start-up",
        "non-profit",
        "international organisation",
      ]
    )
  )
).optional(),

  category:z.enum([
        "Scholarship",
        "intership",
        "hackathon",
        "competition",
        "fellowship",
        "research",
        "open-source",
        "workshop",
      ]).optional(),
  sourceStatus:z.enum(["live","expired"]).optional(),
  educationLevel:z.enum(['high-school' , 'diploma' , 'undergraduate' , 'postgraduate' , 'phd','all'] as const).optional(),
   gender:z.enum(['male','female','other'] as const).optional()
    



    

})

export const getOpportunitiesBystatusSchema = z.object({
  status:z.enum(["draft","active","closed"]).default("draft"),
   page:z.coerce.number().default(1).optional(),
  limit:z.coerce.number().default(10).optional(),
})