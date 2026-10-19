import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import mongoose, { isValidObjectId } from "mongoose";
import { Types } from "mongoose";
import { SavedOpportunity } from "./saved opportunity model.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { pipeline } from "node:stream";
import { searchSavedOpportunitySchema } from "../saved Opportunity/saved opportunity  validation .ts";
import { Opportunity } from "../opportunity/opportunity.model.ts";

const saveOpportunity = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  if (!opportunityId) {
    throw new ApiError(400, "opportunityId is required");
  }

  if (!isValidObjectId(opportunityId)) {
    throw new ApiError(400, "invalid opportunityId");
  }

  const alreadyExistsSavedOpportunity = await SavedOpportunity.findOne({
    opportunity: opportunityId,
    user:(req as any).user._id
  });

  if (alreadyExistsSavedOpportunity) {
    throw new ApiError(409, "opportunity is already saved");
  }
  const opportunity = await SavedOpportunity.create({
    user: (req as any).user._id,
    opportunity: new Types.ObjectId(opportunityId as string),
    savedAt: new Date(),
  });

  if (!opportunity) {
    throw new ApiError(500, "Something went wrong while saving opportunity");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, opportunity, "Opportunity saved successfully")
    );
});

const unSaveOpportunity = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  if (!opportunityId) {
    throw new ApiError(400, "Opportunity ID is required");
  }

  if (!isValidObjectId(opportunityId)) {
    throw new ApiError(400, "Invalid opportunity ID");
  }

  const deleteOpportunity =
    await SavedOpportunity.findOneAndDelete({
    opportunity: opportunityId,
    user:(req as any).user._id
  });

  if (!deleteOpportunity) {
    throw new ApiError(404, "Saved opportunity not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deleteOpportunity,
        "Opportunity unsaved successfully"
      )
    );
});

const checkSavedOpportunitiesByOpportunityId = asyncHandler(async(req,res) => {


  const { opportunityId } = req.params;

  if (!opportunityId) {
    throw new ApiError(400, "opportunityId is required");
  }

  if (!isValidObjectId(opportunityId)) {
    throw new ApiError(400, "invalid opportunityId");
  }

  const alreadyExistsSavedOpportunity = await SavedOpportunity.findOne({
    opportunity: opportunityId,
    user:(req as any).user._id
  });

  const isSaved:boolean = alreadyExistsSavedOpportunity?true:false

  res.status(200).json(new ApiResponse(200,{isSaved:isSaved,SavedOpportunity:alreadyExistsSavedOpportunity},"successfully check opportunity"))



})

// const getSavedOpportunitiesByUserIdAndSearch = asyncHandler(
//   async (req, res) => {
//     // Validate query parameters
//     const validateData =
//       searchSavedOpportunitySchema.safeParse(req.query);

//     if (!validateData.success) {
//       throw new ApiError(
//         400,
//         validateData.error?.issues[0]?.message || "Validation failed"
//       );
//     }

//     // Extract query parameters
//     const {
//       queryTerm,
//       page = 1,
//       limit = 10,
//       category,
//       sourceStatus,
      
//       organizationType,
//     } = validateData.data;

//     console.log("RAW QUERY:", req.query);
// console.log("VALIDATED QUERY:", validateData.data);
// console.log("QUERY TERM:", queryTerm);
// console.log("QUERY TERM TYPE:", typeof queryTerm);

//     // Calculate pagination offset
//     const skip = (page - 1) * limit;

//     // Get logged-in user ID
//     const userId = new mongoose.Types.ObjectId(
//       (req as any).user._id
//     );

//     // Store Atlas Search conditions
//     const mustClauses: any[] = [];
//     const filterClauses: any[] = [];

//     // Search ONLY inside Opportunity title
//     if (queryTerm && queryTerm.trim() !== "") {
//       mustClauses.push({
//         text: {
//           query: queryTerm.trim(),
//           path: "title",
//           fuzzy: {
//             maxEdits: 1,
//             prefixLength: 1,
//           },
//         },
//       });
//     }

//     // Filter opportunities by category
//     if (category) {
//       filterClauses.push({
//         phrase: {
//           query: category,
//           path: "category",
//         },
//       });
//     }

//     // Filter opportunities by organization type
//     if (organizationType && organizationType.length > 0) {
//       filterClauses.push({
//         compound: {
//           should: organizationType.map((orgType: string) => ({
//             phrase: {
//               query: orgType,
//               path: "organizationType",
//             },
//           })),
//           minimumShouldMatch: 1,
//         },
//       });
//     }

//     // Build Atlas Search stage using the same working structure
//     const hasSearchOrFilters =
//   mustClauses.length > 0 || filterClauses.length > 0;

// const searchStage = hasSearchOrFilters
//   ? {
//       index: "search_opportunities",
//       compound: {
//         ...(mustClauses.length > 0 ? { must: mustClauses } : {}),
//         ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
//       },
//     }
//   : {
//       index: "search_opportunities",
//       exists: {
//         path: "title",
//       },
//     };

//     // Build aggregation pipeline starting from Opportunity
//     const pipeline: any[] = [
//       // Search matching opportunities first
//       {
//         $search: searchStage,
//       },

//       // Find the current user's application for each opportunity
//       {
//         $lookup: {
//           from: "applications",
//           let: {
//             opportunityId: "$_id",
//           },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     // Application belongs to this opportunity
//                     {
//                       $eq: [
//                         "$opportunity",
//                         "$$opportunityId",
//                       ],
//                     },

//                     // Application belongs to current user
//                     {
//                       $eq: ["$user", userId],
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "userApplication",
//         },
//       },

//       // Keep ONLY opportunities that the current user applied to
//       {
//         $match: {
//           "userApplication.0": {
//             $exists: true,
//           },
//         },
//       },

//       // Convert application array into one application object
//       {
//         $unwind: "$userApplication",
//       },
//     ];

//     // Filter by application status after finding the user's application
//     if (sourceStatus) {
//       pipeline.push({
//         $match: {
//           "userApplication.sourceStatus": sourceStatus,
//         },
//       });
//     }

//     // Sort by title when there is no search term
//     if (!queryTerm || queryTerm.trim() === "") {
//       pipeline.push({
//         $sort: {
//           title: 1,
//         },
//       });
//     }

//     // Return application data together with opportunity data
//     pipeline.push({
//       $project: {
//         _id: "$userApplication._id",
//         user: "$userApplication.user",
//         opportunity: "$userApplication.opportunity",
//         status: "$userApplication.status",
//         createdAt: "$userApplication.createdAt",
//         updatedAt: "$userApplication.updatedAt",

//         opportunityDetails: {
//           _id: "$_id",
//           title: "$title",
//           description: "$description",
//           category: "$category",
//           organization: "$organization",
//           organizationType: "$organizationType",
//           eligibility: "$eligibility",
//           benefits: "$benefits",
//           requiredDocuments: "$requiredDocuments",
//           startDate: "$startDate",
//           deadline: "$deadline",
//           officialSourceUrl: "$officialSourceUrl",
//           applicationUrl: "$applicationUrl",
//           sourceStatus: "$sourceStatus",
//           lastVerifiedAt: "$lastVerifiedAt",
//           gender: "$gender",
//           educationLevel: "$educationLevel",
//           createdBy: "$createdBy",
//           createdAt: "$createdAt",
//           updatedAt: "$updatedAt",
//         },

//         // Return Atlas Search relevance score
//         score: {
//           $meta: "searchScore",
//         },
//       },
//     });

//     // Apply pagination and calculate total matching applications
//     pipeline.push({
//       $facet: {
//         totalCount: [
//           {
//             $count: "count",
//           },
//         ],
//         paginatedResults: [
//           {
//             $skip: skip,
//           },
//           {
//             $limit: limit,
//           },
//         ],
//       },
//     });

//     // Execute aggregation on Opportunity collection
//     const [results] = await Opportunity.aggregate(pipeline);

//     // Get paginated results safely
//     const paginatedResults =
//       results?.paginatedResults || [];

//     // Get total result count safely
//     const totalResults =
//       results?.totalCount?.[0]?.count || 0;

//     // Send response
//     res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           results: paginatedResults,
//           page,
//           limit,
//           totalResults,
//         },
//         "user applications search results fetched successfully"
//       )
//     );
//   }
// );


const getSavedOpportunitiesByUserIdAndSearch = asyncHandler(
  async (req, res) => {
    // 1. Validate query parameters
    const validateData = searchSavedOpportunitySchema.safeParse(req.query);

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
    } = validateData.data;

    const skip = (page - 1) * limit;

    // 2. Logged-in user's ID
    const userId = new mongoose.Types.ObjectId((req as any).user._id);

    // 3. Build aggregation starting from SavedOpportunity
    const pipeline: any[] = [
      // 🎯 STEP 1: Match ONLY the logged-in user's saved opportunities
      {
        $match: {
          user: userId,
        },
      },

      // 🎯 STEP 2: Join with the Opportunity details
      {
        $lookup: {
          from: "opportunities",
          localField: "opportunity",
          foreignField: "_id",
          as: "opportunityDetails",
        },
      },

      {
        $unwind: "$opportunityDetails",
      },
    ];

    // 🎯 STEP 3: Apply filters ONLY if provided by the user
    const opportunityFilters: any = {};

    if (queryTerm && queryTerm.trim() !== "") {
      // Case-insensitive search on title or organization
      opportunityFilters.$or = [
        { "opportunityDetails.title": { $regex: queryTerm.trim(), $options: "i" } },
        { "opportunityDetails.organization": { $regex: queryTerm.trim(), $options: "i" } },
      ];
    }

    if (category) {
      opportunityFilters["opportunityDetails.category"] = category;
    }

    if (sourceStatus) {
      opportunityFilters["opportunityDetails.sourceStatus"] = sourceStatus;
    }

    if (organizationType && organizationType.length > 0) {
      opportunityFilters["opportunityDetails.organizationType"] = {
        $in: organizationType,
      };
    }

    // Only add filter stage if any filter was provided
    if (Object.keys(opportunityFilters).length > 0) {
      pipeline.push({
        $match: opportunityFilters,
      });
    }

    // 🎯 STEP 4: Sort by newest saved first
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });

    // 🎯 STEP 5: Pagination & Total Count
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

    // Execute aggregation directly on SavedOpportunity
    const [results] = await SavedOpportunity.aggregate(pipeline);

    const paginatedResults = results?.paginatedResults || [];
    const totalResults = results?.totalCount?.[0]?.count || 0;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          results: paginatedResults,
          page,
          limit,
          totalResults,
        },
        "saved opportunities fetched successfully"
      )
    );
  }
);
const getSavedOpportunityById = asyncHandler(async (req, res) => {
  const { savedOpportunityId } = req.params;

  if (!savedOpportunityId) {
    throw new ApiError(400, "saved opportunity Id is required");
  }

  if (!isValidObjectId(savedOpportunityId)) {
    throw new ApiError(400, "invalid saved opportunity object id");
  }

  const opportunity = await SavedOpportunity.findById(savedOpportunityId);

  if (!opportunity) {
    throw new ApiError(400, "opportunity not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, opportunity, "opportunity fetched successfully")
    );
});



export {
  saveOpportunity,
  unSaveOpportunity,
  getSavedOpportunitiesByUserIdAndSearch,
  getSavedOpportunityById,
  checkSavedOpportunitiesByOpportunityId
};
