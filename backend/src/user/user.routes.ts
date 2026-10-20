import { Router } from "express";
import { verifyJWT } from "../auth/auth.middleware.ts";
import {
  fetchAllAdmins,
  fetchAllUsers,
  getUserById,
  getUserProfile,
  searchAndFilterUsers,
  toogleUserRoleByEmail,
  updateUserProfileDetails,
} from "./user.controller.ts";
import { isAdmin } from "./user.middleware.ts";
import { upload } from "../opportunity/opportunity.middleware.ts";

const router = Router();

router.route("/profile").get(verifyJWT, getUserProfile);
router
  .route("/profile")
  .put(verifyJWT, upload.single("avatar"), updateUserProfileDetails);
router.route("/").get(verifyJWT, isAdmin, fetchAllUsers);
router.route("/search").get(verifyJWT, isAdmin, searchAndFilterUsers);
router.route("/admins").get(verifyJWT, isAdmin, fetchAllAdmins);
router.route("/toggle-role").patch(verifyJWT, isAdmin, toogleUserRoleByEmail);
router.route("/:id").get(verifyJWT, isAdmin, getUserById);

export default router;
