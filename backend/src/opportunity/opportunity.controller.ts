import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import {
  createOpportunitySchema,
  editOpportunitySchema,
  getOpportunitiesBystatusSchema,
  OpportunityCategoryArray,
  searchOpportunitySchema,
} from "./opportunity.validation.ts";
import { ApiError } from "../utils/ApiError.ts";
import { Opportunity } from "./opportunity.model.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { isValidObjectId } from "mongoose";
import { count } from "node:console";
import { uploadOnCloudinary } from "../utils/cloudinary.ts";
import { object } from "zod";

const createOpportunity = asyncHandler(async (req, res) => {
  const validateData = createOpportunitySchema.safeParse(req.body ?? {});

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error?.issues[0]?.message || "Validation failed"
    );
  }

  const {
    category,
    title,
    description,
    organization,
    organizationType,
    requiredDocuments,
    startDate,
    deadline,
    officialSourceUrl,
    eligibility,
    eligibilitySummary,
    benefitsSummary,
    location,
    sourceStatus,
    applicationUrl,
    educationLevel,
    benefits,
    gender,
  } = validateData.data;

  const organizationLogoLocalPath = req?.file?.path;

  if (!organizationLogoLocalPath) {
    throw new ApiError(400, "Organization logo is required");
  }

  const organizationLogo = await uploadOnCloudinary(organizationLogoLocalPath);

  if (!organizationLogo) {
    throw new ApiError(
      500,
      "something went wrong while uploading to cloudinary"
    );
  }

  const opportunity = await Opportunity.create({
    organizationLogo: organizationLogo.secure_url,
    category,
    title,
    description,
    organization,
    organizationType,
    requiredDocuments,
    startDate,
    deadline,
    officialSourceUrl,
    eligibility,
    eligibilitySummary,
    benefitsSummary,
    location,
    sourceStatus,
    applicationUrl,
    benefits,
    educationLevel,
    lastVerifiedAt: new Date(),
    createdBy: (req as any).user._id,
    gender,
  });

  if (!opportunity) {
    throw new ApiError(500, "Failed to create opportunity");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, opportunity, "Opportunity created successfully")
    );
});

const editOpportunity = asyncHandler(async (req, res) => {
  const validateData = editOpportunitySchema.safeParse(req.body ?? {});

  const { id } = req.params;

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error?.issues[0]?.message || "Validation failed"
    );
  }

  const {
    category,
    title,
    description,
    organization,
    organizationType,
    requiredDocuments,
    startDate,
    deadline,
    officialSourceUrl,
    eligibility,
    applicationUrl,
    educationLevel,
    benefits,
    gender,
  } = validateData.data;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid opportunity ID");
  }

  const updateFields: Record<string, any> = {
    ...validateData.data,
    lastVerifiedAt: new Date(),
  };

  if (req.file) {
    const organizationLogoLocalPath = req.file?.path;

    if (!organizationLogoLocalPath) {
      throw new ApiError(400, "Organization logo file is required");
    }

    const organizationLogo = await uploadOnCloudinary(
      organizationLogoLocalPath
    );

    if (!organizationLogo) {
      throw new ApiError(
        500,
        "something went wrong while uploading to cloudinary"
      );
    }

    updateFields.organizationLogo = organizationLogo.secure_url;
  }
  const opportunity = await Opportunity.findByIdAndUpdate(
    id,
    {
      $set: updateFields,
    },
    {
      returnDocument: "after",
      runValidators: false,
    }
  );

  if (!opportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, opportunity, "Opportunity updated successfully")
    );
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid opportunity ID");
  }

  const deletedOpportunity = await Opportunity.findByIdAndDelete(id);

  if (!deletedOpportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedOpportunity,
        "Opportunity deleted successfully"
      )
    );
});

const searchAndFilterOpportunity = asyncHandler(async (req, res) => {
  const validateData = searchOpportunitySchema.safeParse(req.query);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error?.issues[0]?.message || "Validation failed"
    );
  }

  const {
    queryTerm,
    page = 1,
    limit = 10,
    category,
    sourceStatus,
    organizationType,
    educationLevel,
    gender,
  } = validateData.data;

  const skip = (page - 1) * limit;

  const mustClauses = [];
  const filterClauses = [];

  if (queryTerm) {
    mustClauses.push({
      text: {
        query: queryTerm,
        path: [
          "title",
          "description",
          "organizationType",
          "eligibility",
          "organization",
          "benefits",
        ],
        fuzzy: {
          maxEdits: 1,
          prefixLength: 1,
        },
      },
    });
  }

  if (category) {
    const normalizedCategory =
      category.toLowerCase() === "internship" ? "intership" : category;
    filterClauses.push({
      phrase: {
        query: normalizedCategory,
        path: "category",
      },
    });
  }

  if (sourceStatus) {
    filterClauses.push({
      phrase: {
        query: sourceStatus,
        path: "sourceStatus",
      },
    });
  }
  if (educationLevel) {
    filterClauses.push({
      phrase: {
        query: educationLevel,
        path: "educationLevel",
      },
    });
  }
  if (gender) {
    filterClauses.push({
      phrase: {
        query: gender,
        path: "gender",
      },
    });
  }

  if (organizationType && organizationType.length > 0) {
    filterClauses.push({
      compound: {
        should: organizationType.map((orgType) => ({
          phrase: {
            query: orgType,
            path: "organizationType",
          },
        })),
        minimumShouldMatch: 1,
      },
    });
  }

  if (mustClauses.length === 0 && filterClauses.length === 0) {
    mustClauses.push({
      wildcard: {
        query: "*",
        path: "title",
        allowAnalyzedField: true,
      },
    });
  }

  const searchStage = {
    index: "search_opportunities",
    compound: {
      ...(mustClauses.length > 0 ? { must: mustClauses } : {}),
      ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
    },
  };
  const pipeline: any[] = [
    {
      $search: searchStage,
    },
  ];

  if (!queryTerm) {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push({
    $facet: {
      totalCount: [{ $count: "count" }],

      paginatedResults: [
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _v: 0,
            score: { $meta: "searchScore" },
          },
        },
      ],
    },
  } as any);

  const [results] = await Opportunity.aggregate(pipeline);

  const paginatedResults = (results as any).paginatedResults || [];

  res.status(200).json(
    new ApiResponse(
      200,
      {
        results: paginatedResults,
        page,
        limit,
        totalResults: (results as any).totalCount?.[0]?.count || 0,
      },
      "search results fetched successfully"
    )
  );
});

const getOpportunitiesBystatus = asyncHandler(async (req, res) => {
  const validateData = getOpportunitiesBystatusSchema.safeParse({
    status: req.params.status,
    page: req.query.page,
    limit: req.query.limit,
  });

  if (!validateData.success) {
    throw new ApiError(
      401,
      validateData.error?.issues[0]?.message || "validation failed"
    );
  }

  const { status, page = 1, limit = 10 } = validateData.data;
  const skip = (page - 1) * limit;

  const opportunities = await Opportunity.find({ status: status })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        results: opportunities,
        page,
        limit,
        totalResults: opportunities.length,
      },
      "opportunites based on status fetched successfully"
    )
  );
});

const getOpportunitiesById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Opportunity ID is required");
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid opportunity ID");
  }

  const opportunity = await Opportunity.findById(id);

  if (!opportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, opportunity, "Opportunity fetched successfully")
    );
});

const getOpportunityStats = asyncHandler(async (req, res) => {
  const [stats] = await Opportunity.aggregate([
    {
      $facet: {
        // 1. Overall Total Opportunities
        totalOpportunities: [
          {
            $count: "count",
          },
        ],

        // 2. Overall Live Opportunities (sourceStatus: "live")
        totalLive: [
          {
            $match: {
              sourceStatus: "live",
            },
          },
          {
            $count: "count",
          },
        ],

        // 3. Overall Active/Open Opportunities (status: "active")
        totalActive: [
          {
            $match: {
              status: "active",
            },
          },
          {
            $count: "count",
          },
        ],

        // 4. Overall Live and Active/Open Opportunities
        totalLiveAndActive: [
          {
            $match: {
              sourceStatus: "live",
              status: "active",
            },
          },
          {
            $count: "count",
          },
        ],

        // 5. Overall Expired Opportunities (sourceStatus: "expired")
        totalExpired: [
          {
            $match: {
              sourceStatus: "expired",
            },
          },
          {
            $count: "count",
          },
        ],

        // 6. Breakdown by Category (Total, Live, Active, and Live&Active per category)
        categories: [
          {
            $match: {
              category: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: "$category",
              total: { $sum: 1 },
              live: {
                $sum: {
                  $cond: [{ $eq: ["$sourceStatus", "live"] }, 1, 0],
                },
              },
              active: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                },
              },
              liveAndActive: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$sourceStatus", "live"] },
                        { $eq: ["$status", "active"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              category: "$_id",
              total: 1,
              live: 1,
              active: 1,
              liveAndActive: 1,
            },
          },
          {
            $sort: {
              total: -1,
            },
          },
        ],
      },
    },
  ]);

  // Ensure every predefined category is present in the response (even if count is 0)
  const categoryMap = new Map(
    (stats?.categories || []).map((c: any) => [c.category, c])
  );

  const allCategories = OpportunityCategoryArray.map((cat: string) => {
    const found = categoryMap.get(cat) as any;
    return {
      category: cat,
      total: found?.total || 0,
      live: found?.live || 0,
      active: found?.active || 0,
      liveAndActive: found?.liveAndActive || 0,
    };
  });

  const responseData = {
    totalOpportunities: stats?.totalOpportunities?.[0]?.count || 0,
    totalLive: stats?.totalLive?.[0]?.count || 0,
    totalActive: stats?.totalActive?.[0]?.count || 0,
    totalLiveAndActive: stats?.totalLiveAndActive?.[0]?.count || 0,
    totalExpired: stats?.totalExpired?.[0]?.count || 0,
    categories: allCategories,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "Opportunity statistics and counts fetched successfully"
      )
    );
});

export {
  createOpportunity,
  editOpportunity,
  deleteOpportunity,
  searchAndFilterOpportunity,
  getOpportunitiesBystatus,
  getOpportunitiesById,
  getOpportunityStats,
};
