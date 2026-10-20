import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { User } from "./user.model.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import {
  searchUserSchema,
  toogleUserRoleByEmailSchema,
  updateUserProfileDetailsSchema,
} from "./user.validation.ts";
import { array } from "zod";
import { isValidObjectId } from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.ts";

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById((req as any).user._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "unauthorised request");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, user, "user profile details fetched successfully")
    );
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "invalid user object Id");
  }

  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
});

const updateUserProfileDetails = asyncHandler(async (req, res) => {
  const validateData = updateUserProfileDetailsSchema.safeParse(req.body ?? {});

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { FullName, college, branch, year, skills, interests } =
    validateData.data;
  const updatePayload: Record<string, any> = {};

  if (req.file) {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file upload failed");
    }

    const organizationLogo = await uploadOnCloudinary(avatarLocalPath);

    if (!organizationLogo) {
      throw new ApiError(
        500,
        "something went wrong while uploading to cloudinary"
      );
    }

    updatePayload.avatar = organizationLogo.secure_url;
  }

  if (FullName?.trim()) updatePayload.FullName = FullName.trim();
  if (college?.trim()) updatePayload.college = college.trim();
  if (branch?.trim()) updatePayload.branch = branch.trim();
  if (year) updatePayload.year = year;
  if (Array.isArray(skills)) updatePayload.skills = skills;
  if (Array.isArray(interests)) updatePayload.interests = interests;

  const user = await User.findByIdAndUpdate(
    (req as any).user._id,

    {
      $set: updatePayload,
    },
    {
      returnDocument: "after",
      runValidators: false,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});

const fetchAllUsers = asyncHandler(async (req, res) => {
  const AllUsers = await User.find({ role: "user" }).select(
    "-password -refreshToken"
  );

  if (!AllUsers) {
    throw new ApiError(500, "Failed to fetch users");
  }

  res
    .status(200)
    .json(new ApiResponse(200, AllUsers, "All users fetched successfully"));
});

const fetchAllAdmins = asyncHandler(async (req, res) => {
  const AllAdmins = await User.find({ role: "admin" }).select(
    "-password -refreshToken"
  );

  if (!AllAdmins) {
    throw new ApiError(500, "Failed to fetch admins");
  }

  res
    .status(200)
    .json(new ApiResponse(200, AllAdmins, "All admins fetched successfully"));
});

const toogleUserRoleByEmail = asyncHandler(async (req, res) => {
  const validateData = toogleUserRoleByEmailSchema.safeParse(req.body);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { email } = validateData.data;

  const user = await User.findOne({ email: email }).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user?.role === "user") {
    user.role = "admin";
  } else {
    user.role = "user";
  }

  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { currentRole: user.role },
        "User role toggled successfully"
      )
    );
});

const searchAndFilterUsers = asyncHandler(async (req, res) => {
  // Validate query parameters
  const validateData = searchUserSchema.safeParse(req.query);

  if (!validateData.success) {
    throw new ApiError(
      400,
      validateData.error.issues[0]?.message || "validation failed"
    );
  }

  const { queryTerm, role, page = 1, limit = 10 } = validateData.data;

  const skip = (page - 1) * limit;

  // Build match stage conditions for fast indexed querying (only verified users)
  const matchConditions: any = {
    isEmailVerified: true,
  };

  if (role) {
    matchConditions.role = role;
  }

  if (queryTerm && queryTerm.trim() !== "") {
    const searchRegex = { $regex: queryTerm.trim(), $options: "i" };
    matchConditions.$or = [
      { FullName: searchRegex },
      { email: searchRegex },
      { college: searchRegex },
      { branch: searchRegex },
      { skills: searchRegex },
      { interests: searchRegex },
    ];
  }

  // Build aggregation pipeline
  const pipeline: any[] = [];

  if (Object.keys(matchConditions).length > 0) {
    pipeline.push({
      $match: matchConditions,
    });
  }

  // Sort newest users first
  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  });

  // Apply pagination and calculate total matching users
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
        {
          $project: {
            password: 0,
            refreshToken: 0,
            __v: 0,
          },
        },
      ],
    },
  });

  // Execute aggregation pipeline on User collection
  const [results] = await User.aggregate(pipeline);

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
      "users fetched successfully"
    )
  );
});

export {
  getUserProfile,
  updateUserProfileDetails,
  fetchAllUsers,
  fetchAllAdmins,
  toogleUserRoleByEmail,
  getUserById,
  searchAndFilterUsers,
};
