import api from "./api";

// interface ISearchdata {
//   querterm?: string;
//   page?: number;
//   limit?: number;
//   organizationType?: string;
//   category?: string;
//   sourceStatus: string;
// }

type OpportunityCategoryType =
  | "Scholarship"
  | "intership"
  | "hackathon"
  | "competition"
  | "fellowship"
  | "research"
  | "open-source"
  | "workshop";

type organizationTypes =
  | "government"
  | "private"
  | "university"
  | "ngo"
  | "start-up"
  | "non-profit"
  | "international-organisation";

type educationLevelType =
  | "high-school"
  | "diploma"
  | "undergraduate"
  | "postgraduate"
  | "phd"
  | "all";

export interface IOpportunitySearchParams {
  queryTerm?: string;
  page?: number;
  limit?: number;
  organizationType?: organizationTypes | "all" | string;
  category?: OpportunityCategoryType | "all" | string;
  sourceStatus?: "live" | "expired" | "all" | string;
  educationLevel?: educationLevelType | "all" | string;
  gender?: string;
  status?: "active" | "draft" | "closed" | "all" | string;
  publicationStatus?: "draft" | "published" | "all" | string;
  location?: string;
}

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
  try {
    const params: Record<string, any> = {
      page,
      limit,
    };

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
    console.log("[API] Opportunities fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[API Error] Failed to fetch opportunities:",
      (error as Error).message,
    );
    throw error;
  }
};

export const saveOpportinity = async (opportunityId: string) => {
  try {
    const response = await api.post(
      `/saved-opportunities/test/${opportunityId}`,
    );

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export const unSaveOpportunity = async (opportunityId: string) => {
  console.log("ID sent to backend:", opportunityId);

  try {
    const response = await api.delete(
      `/saved-opportunities/test/${opportunityId}`,
    );

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export const checkSavedOpportunity = async (opportunityId: string) => {
  try {
    const response = await api.post(
      `/saved-opportunities/test/check/${opportunityId}`,
    );

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data.data.isSaved;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export interface ISavedOpportunitySearchParams {
  page?: number;
  limit?: number;
  queryTerm?: string;
  organizationType?: string;
  sourceStatus?: string;
  category?: string;
}

export const getSavedOpportunitiesByUserIdAndSearch = async ({
  page = 1,
  limit = 10,
  queryTerm,
  organizationType,
  sourceStatus,
  category,
}: ISavedOpportunitySearchParams = {}) => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
    };

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

    console.log("[API] Saved opportunities fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[API Error] Failed to fetch saved opportunities:",
      (error as Error).message,
    );
    throw error;
  }
};

export const getOpportunitiesById = async (opportunityId: string) => {
  try {
    const response = await api.get(`/opportunity/${opportunityId}`);

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export const createApplication = async (
  opportunityId: string,
  status?: string,
) => {
  try {
    const response = await api.post(`/application/${opportunityId}`, {
      status,
    });

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export const deleteApplication = async (applicationId: string) => {
  try {
    const response = await api.delete(`/application/${applicationId}`);

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export const updateApplication = async (
  applicationId: string,
  status?: string,
) => {
  try {
    const response = await api.patch(`/application/${applicationId}`, {
      status,
    });

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export interface IUserApplicationSearchParams {
  page?: number;
  limit?: number;
  queryTerm?: string;
  organizationType?: string;
  status?: string;
  sourceStatus?: string;
  category?: string;
}

export const getUserApplicationsAndsearchAndfilters = async ({
  page = 1,
  limit = 10,
  queryTerm,
  organizationType,
  status,
  sourceStatus,
  category,
}: IUserApplicationSearchParams = {}) => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
    };

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
    if (status && status !== "all")
      params.status = status;

    const response = await api.get("/application/", { params });

    console.log("[API] User applications fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[API Error] Failed to fetch user applications:",
      (error as Error).message,
    );
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get(`/user/profile`);

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

export interface IUpdateUserProfileData {
  FullName?: string;
  college?: string;
  branch?: string;
  year?: string;
  skills?: string[];
  interests?: string[];
}

export const updateUserProfile = async (
  data?: FormData | IUpdateUserProfileData | any,
) => {
  try {
    const response = await api.put(`/user/profile`, data);

    console.log(response.data.message);
    console.log(response.data.data);

    return response.data;
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }
};

// ============================================================================
// OPPORTUNITY MANAGEMENT APIS (ADMIN & PUBLIC)
// ============================================================================

/**
 * Interface representing the complete Opportunity Payload for create & update
 */
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

/**
 * 1. CREATE OPPORTUNITY
 * Method: POST
 * Endpoint: /opportunity/
 * Description: Creates a new opportunity in the database (draft or published)
 * Supports: JSON payload or FormData (for file uploads)
 *
 * @param data - Opportunity data object or FormData
 * @returns Server response with created opportunity object
 */
export const apiCreateOpportunity = async (
  data?: FormData | IOpportunityPayload | any,
) => {
  try {
    const response = await api.post(`/opportunity/`, data);
    console.log("[API] Opportunity created successfully:", response.data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("opportunity-updated", { detail: { action: "create" } }));
    }
    return response.data;
  } catch (error) {
    console.error(
      "[API Error] Failed to create opportunity:",
      (error as Error).message,
    );
    throw error;
  }
};

/**
 * 2. EDIT / UPDATE OPPORTUNITY
 * Method: PATCH
 * Endpoint: /opportunity/:id
 * Description: Updates an existing opportunity by ID
 * Supports: Partial updates (title, status, publicationStatus, etc.) or full updates
 *
 * @param id - Opportunity MongoDB ID / Unique Identifier
 * @param data - Updated fields (JSON object or FormData)
 * @returns Server response with updated opportunity object
 */
export const apiEditOpportunity = async (
  id: string,
  data?: FormData | Partial<IOpportunityPayload> | any,
) => {
  try {
    const response = await api.patch(`/opportunity/${id}`, data);
    console.log(`[API] Opportunity ${id} updated successfully:`, response.data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("opportunity-updated", { detail: { action: "edit", id } }));
    }
    return response.data;
  } catch (error) {
    console.error(
      `[API Error] Failed to update opportunity ${id}:`,
      (error as Error).message,
    );
    throw error;
  }
};

export const apiDeleteOpportunity = async (id: string) => {
  try {
    // Attempt standard REST DELETE, fallback to PATCH for soft-delete if configured
    let response;

    response = await api.delete(`/opportunity/${id}`);

    console.log(`[API] Opportunity ${id} deleted successfully:`, response.data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("opportunity-updated", { detail: { action: "delete", id } }));
    }
    return response.data;
  } catch (error) {
    console.error(
      `[API Error] Failed to delete opportunity ${id}:`,
      (error as Error).message,
    );
    throw error;
  }
};

export const editOpportunity = apiEditOpportunity;
export const deleteOpportunity = apiDeleteOpportunity;

export const apiToogleUserRoleByEmail = async ({
  email,
}: {
  email: string;
}) => {
  try {

  

    const response = await api.patch(`/user/toggle-role`, { email: email });

    console.log(
      `[API] user role of email ${email} is toogle sucessfully to ${response.data.data.role}`,
      response.data,
    );
    return response.data;
  } catch (error) {
    console.error(
      `[API Error] Failed to toogle role:`,
      (error as Error).message,
    );
    throw error;
  }
};

export interface IUserSearchParams {
  queryTerm?: string;
  page?: number;
  limit?: number;
  role?: "user" | "admin" | "all" | string;
  college?: string;
  branch?: string;
  year?: string;
}

export const apiSearchAndFilters = async ({
  queryTerm,
  page = 1,
  limit = 10,
  role,
  college,
  branch,
  year,
}: IUserSearchParams = {}) => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
    };

    if (queryTerm && queryTerm.trim()) params.queryTerm = queryTerm.trim();
    if (role && role !== "all") params.role = role;
    if (college && college !== "all" && college.trim())
      params.college = college.trim();
    if (branch && branch !== "all" && branch.trim())
      params.branch = branch.trim();
    if (year && year !== "all" && year.trim())
      params.year = year.trim();

    const response = await api.get("/user/search", { params });

    console.log("[API] User data fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[API Error] Failed to fetch users data:",
      (error as Error).message,
    );
    throw error;
  }
};


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

export const apiGetOpportunityStats = async (_opportunityId?: string) => {
  try {
    const response = await api.get(`/opportunity/stats`);

    console.log("[API] Opportunity stats fetched:", response.data);

    return response.data;
  } catch (error) {
    console.error("[API Error] Failed to fetch opportunity stats:", (error as Error).message);
    throw error;
  }
};

// ============================================================================
// CONVENIENCE ALIASES (Guarantees backwards & naming compatibility)
// ============================================================================
export const apiSearchOpportunities = search;
export const searchOpportunities = search;
export const apiSearchOpportunitiesAndFilters = search;
export const searchOpportunitiesAndFilters = search;
export const createOpportunity = apiCreateOpportunity;
export const getOpportunityById = getOpportunitiesById;
export const saveOpportunity = saveOpportinity;
export const apiToggleUserRoleByEmail = apiToogleUserRoleByEmail;
export const toggleUserRoleByEmail = apiToogleUserRoleByEmail;
export const searchUsers = apiSearchAndFilters;
export const getOpportunityStats = apiGetOpportunityStats;
export { apiRefreshAccessToken } from "./authApi";
