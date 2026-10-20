import { Types } from "mongoose";

type OpportunityCategory =
  | "Scholarship"
  | "intership"
  | "hackathon"
  | "competition"
  | "fellowship"
  | "research"
  | "open-source"
  | "workshop";

type organisationType =
  | "government"
  | "private"
  | "university"
  | "ngo"
  | "start-up"
  | "non-profit"
  | "international-organisation";

// export const  documentsOptions = [
//   "Aadhaar Card",
//   "PAN Card",
//   "Income Certificate",
//   "Caste Certificate",
//   "Domicile Certificate",
//   "Disability Certificate",
//   "EWS Certificate",
//   "Minority Certificate",
//   "BPL Card",
//   "Ration Card",
//   "UDID Card",
//   "Government ID Proof",
//   "Company ID Card",

//   "Class 10 Marksheet",
//   "Class 12 Marksheet",
//   "Latest Marksheet",
//   "Academic Transcript",
//   "Degree Certificate",
//   "Diploma Certificate",
//   "Passing Certificate",

//   "College ID Card",
//   "Bonafide Certificate",
//   "Admission Letter",
//   "Admission Proof",
//   "Fee Receipt",
//   "Fee Structure",
//   "Hostel Certificate",
//   "Hostel Fee Receipt",
//   "NOC",

//   "Bank Passbook",
//   "Bank Account Details",

//   "Resume / CV",
//   "Cover Letter",
//   "Portfolio",
//   "LinkedIn Profile",

//   "Research Proposal",
//   "Research Statement",
//   "Writing Sample",
//   "Thesis",
//   "Thesis Summary",
//   "Publication List",
//   "Research Experience",

//   "Project Proposal",
//   "Project Report",
//   "Abstract",
//   "Presentation / PPT",
//   "Source Code",
//   "Prototype",
//   "Demo Video",

//   "Statement of Purpose",
//   "Motivation Letter",
//   "Recommendation Letter",

//   "Self Declaration",
//   "Undertaking",
//   "Affidavit",

//   "Passport",
//   "Passport Size Photograph",
//   "Birth Certificate",
//   "Government ID Proof",

//   "Other",
// ] as const

// export type documentsOptions = typeof documentsOptions[number];

export interface Iopportunity {
  organizationLogo: string;
  category: OpportunityCategory;
  title: string;
  description: string;
  organization: string;
  organizationType: organisationType;
  requiredDocuments: string[];
  startDate: Date;
  deadline: Date;
  officialSourceUrl: string;
  eligibility: string[];
  eligibilitySummary: string;
  benefitsSummary: string;
  location: string;
  sourceStatus: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  applicationUrl: string;
  lastVerifiedAt: Date;
  benefits: string[];
  educationLevel:
    | "high-school"
    | "diploma"
    | "undergraduate"
    | "postgraduate"
    | "phd"
    | "all";
  status: string;
  publicationStatus?: "draft" | "published";
  gender: "male" | "female" | "other" | "all";
}
