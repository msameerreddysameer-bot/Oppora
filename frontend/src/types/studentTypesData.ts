export type OpportunityStatus = "active" | "draft" | "closed";
export type OpportunityGender = "all" | "Male" | "Female" | "Other";
export type OpportunitySourceStatus = "live" | "expired" | "all";
export type OpportunityEducationLevel =
  "high-school" | "diploma" | "undergraduate" | "postgraduate" | "phd" | "all";

export type OpportunityorganizationType =
  | "government"
  | "private"
  | "university"
  | "nGO"
  | "start-up"
  | "non-Profit"
  | "international organisation";

export type PublicationStatus = "draft" | "published";

export interface LogoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IOpportunity {
  organizationLogo: string;
  originalLogo?: string;
  logoCrop?: LogoCrop;
  _id: string;
  title: string;
  organization: string;
  category: string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus;
  organizationType: OpportunityorganizationType;
  status: OpportunityStatus;
  publicationStatus?: PublicationStatus;
  startDate?: string;
  deadline: string;
  eligibility: string[];
  location: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  officialSourceUrl: string;
  applicationUrl: string;
  benefitsSummary: string;
  eligibilitySummary: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOpportunityDetails {
  organizationLogo: string;
  _id: string;
  category: string;
  title: string;
  description: string;
  organization: string;
  organizationType: OpportunityorganizationType;
  requiredDocuments: string[];
  startDate: string;
  deadline: string;
  officialSourceUrl: string;
  eligibility: string[];
  eligibilitySummary: string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus;
  createdBy: string;
  applicationUrl: string;
  lastVerifiedAt: string;
  benefits: string[];
  benefitsSummary: string;
  location: string;
  educationLevel: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ISavedOpportunity {
  _id: string;
  user: string;
  opportunity: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  opportunityDetails: IOpportunityDetails;
}

export interface DemoOpportunity {
  organizationLogo: string;
  originalLogo?: string;
  logoCrop?: LogoCrop;
  _id: string;
  title: string;
  organization: string;
  initials: string;
  category: string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus;
  organizationType: OpportunityorganizationType;
  status: OpportunityStatus;
  deadline: string;
  benefit: string;
  eligibility: string;
  location: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  officialUrl: string;
  applicationUrl: string;
  benefitsSummary: string;
  eligibilitySummary: string;
}

export interface DemoApplication {
  _id: string;
  opportunityId: string;
  status:
    | "applied"
    | "under-review"
    | "interviewing"
    | "offered"
    | "accepted"
    | "rejected"
    | "withdrawn";
  createdAt: string;
  updatedAt: string;
  opportunityDetails: DemoOpportunity;
  opportunity: string;
}

export type IApplication = DemoApplication;


