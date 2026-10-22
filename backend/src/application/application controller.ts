import mongoose, { Types } from "mongoose";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { Application } from "./application model.ts";
import {
  createApplicationSchema,
  getUserApplicationsAndsearchAndfiltersSchema,
  updateApplicationSchema,
} from "./application validation.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { isValidObjectId } from "mongoose";
import { SavedOpportunity } from "../saved Opportunity/saved opportunity model.ts";
import type { title } from "node:process";
import { Opportunity } from "../opportunity/opportunity.model.ts";
import { exists } from "node:fs";

const createApplication = asyncHandler(async (req, res) => {
  const validateData = createApplicationSchema.safeParse(req.body);
  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error?.issues[0]?.message || "Validation failed"
    );
  }

  const { status } = validateData.data;
  const { opportunityId } = req.params;

  if (!opportunityId) {
    throw new ApiError(400, "Opportunity ID is required");
  }

  if (!isValidObjectId(opportunityId)) {
    throw new ApiError(400, "Invalid opportunity ID");
  }

  const userId = (req as any).user._id;

  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  const alreadyExistsApplication = await Application.findOne({
    user: userId,
    opportunity: new mongoose.Types.ObjectId(opportunityId as any) as any,
  });

  if (alreadyExistsApplication) {
    throw new ApiError(409, "You have already applied to this opportunity");
  }

  try {
    const application = await Application.create({
      user: userId,
      opportunity: new Types.ObjectId(opportunityId as string),
      status: status,
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, application, "Application created successfully")
      );
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new ApiError(409, "You have already applied to this opportunity");
    }
    throw err;
  }
});

const updateApplication = asyncHandler(async (req, res) => {
  const validateData = updateApplicationSchema.safeParse(req.body);
  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error?.issues[0]?.message || "Validation failed"
    );
  }

  const { status } = validateData.data;
  const { applicationId } = req.params;

  if (!applicationId) {
    throw new ApiError(400, "Application ID is required");
  }

  if (!isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const userId = (req as any).user._id;

  const updatedApplication = await Application.findOneAndUpdate(
    {
      _id: applicationId,
      user: userId,
    },
    {
      $set: {
        status: status,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!updatedApplication) {
    throw new ApiError(404, "Application not found or unauthorized");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedApplication,
        "Application updated successfully"
      )
    );
});

const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!applicationId) {
    throw new ApiError(400, "Application ID is required");
  }

  if (!isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const userId = (req as any).user._id;

  const deletedApplication = await Application.findOneAndDelete({
    _id: applicationId,
    user: userId,
  });

  if (!deletedApplication) {
    throw new ApiError(404, "Application not found or unauthorized");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedApplication,
        "Application deleted successfully"
      )
    );
});

const getApplicationById = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!applicationId) {
    throw new ApiError(400, "Application ID is required");
  }

  if (!isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const userId = (req as any).user._id;

  const application = await Application.findOne({
    _id: applicationId,
    user: userId,
  });

  if (!application) {
    throw new ApiError(404, "Application not found or unauthorized");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, application, "Application fetched successfully")
    );
});

const getUserApplicationsAndsearchAndfilters = asyncHandler(
  async (req, res) => {
    // Validate query parameters
    const validateData = getUserApplicationsAndsearchAndfiltersSchema.safeParse(
      req.query
    );

    if (!validateData.success) {
      throw new ApiError(
        400,
        validateData.error?.issues[0]?.message || "Validation failed"
      );
    }

    // Extract query parameters
    const {
      queryTerm,
      page = 1,
      limit = 10,
      category,
      status,
      organizationType,
    } = validateData.data;

    // Calculate pagination offset
    const skip = (page - 1) * limit;

    // Get logged-in user ID
    const userId = new mongoose.Types.ObjectId((req as any).user._id);

    // Store Atlas Search conditions
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    // Search ONLY inside Opportunity title
    if (queryTerm && queryTerm.trim() !== "") {
      mustClauses.push({
        text: {
          query: queryTerm.trim(),
          path: "title",
          fuzzy: {
            maxEdits: 1,
            prefixLength: 1,
          },
        },
      });
    }

    // Filter opportunities by category
    if (category) {
      filterClauses.push({
        phrase: {
          query: category,
          path: "category",
        },
      });
    }

    // Filter opportunities by organization type
    if (organizationType && organizationType.length > 0) {
      filterClauses.push({
        compound: {
          should: organizationType.map((orgType: string) => ({
            phrase: {
              query: orgType,
              path: "organizationType",
            },
          })),
          minimumShouldMatch: 1,
        },
      });
    }

    // Build Atlas Search stage using the same working structure
    const hasSearchOrFilters =
      mustClauses.length > 0 || filterClauses.length > 0;

    const searchStage = hasSearchOrFilters
      ? {
          index: "search_opportunities",
          compound: {
            ...(mustClauses.length > 0 ? { must: mustClauses } : {}),
            ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
          },
        }
      : {
          index: "search_opportunities",
          exists: {
            path: "title",
          },
        };

    // Build aggregation pipeline starting from Opportunity
    const pipeline: any[] = [
      // Search matching opportunities first
      {
        $search: searchStage,
      },

      // Find the current user's application for each opportunity
      {
        $lookup: {
          from: "applications",
          let: {
            opportunityId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    // Application belongs to this opportunity
                    {
                      $eq: ["$opportunity", "$$opportunityId"],
                    },

                    // Application belongs to current user
                    {
                      $eq: ["$user", userId],
                    },
                  ],
                },
              },
            },
          ],
          as: "userApplication",
        },
      },

      // Keep ONLY opportunities that the current user applied to
      {
        $match: {
          "userApplication.0": {
            $exists: true,
          },
        },
      },

      // Convert application array into one application object
      {
        $unwind: "$userApplication",
      },
    ];

    // Filter by application status after finding the user's application
    if (status) {
      pipeline.push({
        $match: {
          "userApplication.status": status,
        },
      });
    }

    // Sort by newest updated or created application when there is no search term
    if (!queryTerm || queryTerm.trim() === "") {
      pipeline.push({
        $sort: {
          "userApplication.updatedAt": -1,
          "userApplication.createdAt": -1,
        },
      });
    }

    // Return application data together with opportunity data
    pipeline.push({
      $project: {
        _id: "$userApplication._id",
        user: "$userApplication.user",
        opportunity: "$userApplication.opportunity",
        status: "$userApplication.status",
        createdAt: "$userApplication.createdAt",
        updatedAt: "$userApplication.updatedAt",

        opportunityDetails: {
          _id: "$_id",
          title: "$title",
          description: "$description",
          category: "$category",
          organization: "$organization",
          organizationType: "$organizationType",
          organizationLogo: "$organizationLogo",
          originalLogo: "$originalLogo",
          logoCrop: "$logoCrop",
          eligibility: "$eligibility",
          benefits: "$benefits",
          requiredDocuments: "$requiredDocuments",
          startDate: "$startDate",
          deadline: "$deadline",
          officialSourceUrl: "$officialSourceUrl",
          applicationUrl: "$applicationUrl",
          sourceStatus: "$sourceStatus",
          lastVerifiedAt: "$lastVerifiedAt",
          gender: "$gender",
          educationLevel: "$educationLevel",
          location: "$location",
          benefitsSummary: "$benefitsSummary",
          eligibilitySummary: "$eligibilitySummary",
          createdBy: "$createdBy",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
        },

        // Return Atlas Search relevance score
        score: {
          $meta: "searchScore",
        },
      },
    });

    // Apply pagination and calculate total matching applications
    pipeline.push({
      $facet: {
        totalCount: [
          {
            $count: "count",
          },
        ],
        paginatedResults: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
      },
    });

    // Execute aggregation on Opportunity collection
    const [results] = await Opportunity.aggregate(pipeline);

    // Get paginated results safely
    const paginatedResults = results?.paginatedResults || [];

    // Get total result count safely
    const totalResults = results?.totalCount?.[0]?.count || 0;

    // Send response
    res.status(200).json(
      new ApiResponse(
        200,
        {
          results: paginatedResults,
          page,
          limit,
          totalResults,
        },
        "user applications search results fetched successfully"
      )
    );
  }
);
export {
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationById,
  getUserApplicationsAndsearchAndfilters,
};
