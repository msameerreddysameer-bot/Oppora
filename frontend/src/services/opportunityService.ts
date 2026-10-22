/**
 * ============================================================================
 * SERVICE: Opportunity & Student Data Service
 * DESCRIPTION:
 * Central network layer for opportunity discovery, bookmarks/saved items,
 * application tracking, student profile management, and administrator actions.
 * ============================================================================
 */

import api from "./api";

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS & FILTER INTERFACES
// ----------------------------------------------------------------------------

export type OpportunityCategoryType =
  | "Scholarship"
  | "intership"
  | "hackathon"
  | "competition"
  | "fellowship"
  | "research"
  | "open-source"
  | "workshop";

export type OrganizationType =
  | "government"
  | "private"
  | "university"
  | "ngo"
  | "start-up"
  | "non-profit"
  | "international-organisation";

export type EducationLevelType =
  "high-school" | "diploma" | "undergraduate" | "postgraduate" | "phd" | "all";

export interface IOpportunitySearchParams {
  queryTerm?: string;
  page?: number;
  limit?: number;
  organizationType?: OrganizationType | "all" | string;
  category?: OpportunityCategoryType | "all" | string;
  sourceStatus?: "live" | "expired" | "all" | string;
  educationLevel?: EducationLevelType | "all" | string;
  gender?: string;
  status?: "active" | "draft" | "closed" | "all" | string;
  publicationStatus?: "draft" | "published" | "all" | string;
  location?: string;
}

export interface ISavedOpportunitySearchParams {
  page?: number;
  limit?: number;
  queryTerm?: string;
  organizationType?: string;
  sourceStatus?: string;
  category?: string;
}

export interface IUserApplicationSearchParams {
  page?: number;
  limit?: number;
  queryTerm?: string;
  organizationType?: string;
  status?: string;
  sourceStatus?: string;
  category?: string;
}

export interface IUpdateUserProfileData {
  FullName?: string;
  college?: string;
  branch?: string;
  year?: string;
  skills?: string[];
  interests?: string[];
}

export interface IOpportunityPayload {
  title: string;
  organization: string;
  organizationLogo?: string;
  originalLogo?: string;
  logoCrop?: { x: number; y: number; width: number; height: number };
  category: string;
  gender?: string;
  sourceStatus?: "live" | "expired" | "all";
  organizationType?: string;
  status?: "active" | "draft" | "closed";
  publicationStatus?: "draft" | "published";
  startDate?: string;
  deadline?: string;
  location?: string;
  description?: string;
  benefits?: string[];
  benefitsSummary?: string;
  eligibility?: string[];
  eligibilitySummary?: string;
  officialSourceUrl?: string;
  applicationUrl?: string;
  requiredDocuments?: string[];
}

export interface IUserSearchParams {
  queryTerm?: string;
  page?: number;
  limit?: number;
  role?: "user" | "admin" | "all" | string;
  college?: string;
  branch?: string;
  year?: string;
}

export interface ICategoryStat {
  category: string;
  total: number;
  live: number;
  active: number;
  liveAndActive?: number;
}

export interface IOpportunityStatsData {
  totalOpportunities: number;
  totalLive: number;
  totalActive: number;
  totalLiveAndActive?: number;
  totalExpired: number;
  categories: ICategoryStat[];
}

// ----------------------------------------------------------------------------
// 1. OPPORTUNITY SEARCH & RETRIEVAL APIS
// ----------------------------------------------------------------------------

/**
 * Searches opportunities with multi-criteria filtering and pagination.
 */
export const search = async ({
  queryTerm,
  page = 1,
  limit = 10,
  organizationType,
  category,
  sourceStatus,
  educationLevel,
  gender,
  status,
  publicationStatus,
  location,
}: IOpportunitySearchParams = {}) => {
  const params: Record<string, any> = { page, limit };

  if (queryTerm && queryTerm.trim()) params.queryTerm = queryTerm.trim();
  if (organizationType && organizationType !== "all")
    params.organizationType = organizationType;
  if (category && category !== "all") {
    let cat = category;
    if (cat.toLowerCase() === "internship") cat = "intership";
    if (cat.toLowerCase() === "open source") cat = "open-source";
    params.category = cat;
  }
  if (sourceStatus && sourceStatus !== "all")
    params.sourceStatus = sourceStatus;
  if (educationLevel && educationLevel !== "all")
    params.educationLevel = educationLevel;
  if (gender && gender !== "all") params.gender = gender.toLowerCase();
  if (status && status !== "all") params.status = status;
  if (publicationStatus && publicationStatus !== "all")
    params.publicationStatus = publicationStatus;
  if (location && location.trim() && location !== "all")
    params.location = location.trim();

  const response = await api.get("/opportunity/search", { params });
  return response.data;
};

/**
 * Fetches a single opportunity by its unique MongoDB identifier.
 */
export const getOpportunitiesById = async (opportunityId: string) => {
  const response = await api.get(`/opportunity/${opportunityId}`);
  return response.data;
};

// ----------------------------------------------------------------------------
// 2. SAVED / BOOKMARKED OPPORTUNITIES APIS
// ----------------------------------------------------------------------------

/**
 * Saves/bookmarks an opportunity for the authenticated student.
 */
export const saveOpportinity = async (opportunityId: string) => {
  const response = await api.post(`/saved-opportunities/${opportunityId}`);
  return response.data;
};

/**
 * Removes an opportunity from the student's saved list.
 */
export const unSaveOpportunity = async (opportunityId: string) => {
  const response = await api.delete(
    `/saved-opportunities/${opportunityId}`
  );
  return response.data;
};

/**
 * Checks whether an opportunity is currently bookmarked by the user.
 */
export const checkSavedOpportunity = async (opportunityId: string) => {
  const response = await api.post(
    `/saved-opportunities/check/${opportunityId}`
  );
  return response.data.data.isSaved;
};

/**
 * Retrieves all saved opportunities for the authenticated student with filtering.
 */
export const getSavedOpportunitiesByUserIdAndSearch = async ({
  page = 1,
  limit = 10,
  queryTerm,
  organizationType,
  sourceStatus,
  category,
}: ISavedOpportunitySearchParams = {}) => {
  const params: Record<string, any> = { page, limit };

  if (queryTerm && queryTerm.trim()) params.queryTerm = queryTerm.trim();
  if (organizationType && organizationType !== "all")
    params.organizationType = organizationType;
  if (category && category !== "all") {
    let cat = category;
    if (cat.toLowerCase() === "internship") cat = "intership";
    if (cat.toLowerCase() === "open source") cat = "open-source";
    params.category = cat;
  }
  if (sourceStatus && sourceStatus !== "all")
    params.sourceStatus = sourceStatus;

  const response = await api.get("/saved-opportunities/", { params });
  return response.data;
};

// ----------------------------------------------------------------------------
// 3. STUDENT APPLICATION TRACKING APIS
// ----------------------------------------------------------------------------

/**
 * Creates an application tracking record for an opportunity.
 */
export const createApplication = async (
  opportunityId: string,
  status?: string
) => {
  const response = await api.post(`/application/${opportunityId}`, { status });
  return response.data;
};

/**
 * Deletes an application tracking record.
 */
export const deleteApplication = async (applicationId: string) => {
  const response = await api.delete(`/application/${applicationId}`);
  return response.data;
};

/**
 * Updates the tracking status of an existing student application.
 */
export const updateApplication = async (
  applicationId: string,
  status?: string
) => {
  const response = await api.patch(`/application/${applicationId}`, { status });
  return response.data;
};

/**
 * Fetches all student application tracking entries with filtering and search.
 */
export const getUserApplicationsAndsearchAndfilters = async ({
  page = 1,
  limit = 10,
  queryTerm,
  organizationType,
  status,
  sourceStatus,
  category,
}: IUserApplicationSearchParams = {}) => {
  const params: Record<string, any> = { page, limit };

  if (queryTerm && queryTerm.trim()) params.queryTerm = queryTerm.trim();
  if (organizationType && organizationType !== "all")
    params.organizationType = organizationType;
  if (category && category !== "all") {
    let cat = category;
    if (cat.toLowerCase() === "internship") cat = "intership";
    if (cat.toLowerCase() === "open source") cat = "open-source";
    params.category = cat;
  }
  if (sourceStatus && sourceStatus !== "all")
    params.sourceStatus = sourceStatus;
  if (status && status !== "all") params.status = status;

  const response = await api.get("/application/", { params });
  return response.data;
};

// ----------------------------------------------------------------------------
// 4. STUDENT PROFILE APIS
// ----------------------------------------------------------------------------

/**
 * Retrieves the full profile of the currently authenticated user.
 */
export const getUserProfile = async () => {
  const response = await api.get(`/user/profile`);
  return response.data;
};

/**
 * Updates student profile details (education, skills, interests, avatar).
 */
export const updateUserProfile = async (
  data?: FormData | IUpdateUserProfileData | any
) => {
  const response = await api.put(`/user/profile`, data);
  return response.data;
};

// ----------------------------------------------------------------------------
// 5. ADMINISTRATIVE OPPORTUNITY CRUD APIS
// ----------------------------------------------------------------------------

/**
 * Creates a new opportunity (supports multipart FormData or JSON).
 */
export const apiCreateOpportunity = async (
  data?: FormData | IOpportunityPayload | any
) => {
  const response = await api.post(`/opportunity/`, data);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("opportunity-updated", { detail: { action: "create" } })
    );
  }
  return response.data;
};

/**
 * Updates an existing opportunity by ID (supports partial fields or FormData).
 */
export const apiEditOpportunity = async (
  id: string,
  data?: FormData | Partial<IOpportunityPayload> | any
) => {
  const response = await api.patch(`/opportunity/${id}`, data);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("opportunity-updated", {
        detail: { action: "edit", id },
      })
    );
  }
  return response.data;
};

/**
 * Deletes an opportunity by ID.
 */
export const apiDeleteOpportunity = async (id: string) => {
  const response = await api.delete(`/opportunity/${id}`);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("opportunity-updated", {
        detail: { action: "delete", id },
      })
    );
  }
  return response.data;
};

/**
 * Toggles a user's role between 'user' and 'admin'.
 */
export const apiToogleUserRoleByEmail = async ({
  email,
}: {
  email: string;
}) => {
  const response = await api.patch(`/user/toggle-role`, { email });
  return response.data;
};

/**
 * Searches and filters registered users (Admin only).
 */
export const apiSearchAndFilters = async ({
  queryTerm,
  page = 1,
  limit = 10,
  role,
  college,
  branch,
  year,
}: IUserSearchParams = {}) => {
  const params: Record<string, any> = { page, limit };

  if (queryTerm && queryTerm.trim()) params.queryTerm = queryTerm.trim();
  if (role && role !== "all") params.role = role;
  if (college && college !== "all" && college.trim())
    params.college = college.trim();
  if (branch && branch !== "all" && branch.trim())
    params.branch = branch.trim();
  if (year && year !== "all" && year.trim()) params.year = year.trim();

  const response = await api.get("/user/search", { params });
  return response.data;
};

/**
 * Fetches aggregate opportunity statistics for the admin dashboard.
 */
export const apiGetOpportunityStats = async () => {
  const response = await api.get(`/opportunity/stats`);
  return response.data;
};

// ----------------------------------------------------------------------------
// COMPATIBILITY ALIASES
// ----------------------------------------------------------------------------
export const apiSearchOpportunities = search;
export const editOpportunity = apiEditOpportunity;
export const deleteOpportunity = apiDeleteOpportunity;
