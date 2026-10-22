import { Router } from "express";
import { verifyJWT } from "../auth/auth.middleware.ts";
import { isAdmin } from "../user/user.middleware.ts";
import {
  createOpportunity,
  deleteOpportunity,
  editOpportunity,
  getOpportunitiesById,
  getOpportunitiesBystatus,
  getOpportunityStats,
  searchAndFilterOpportunity,
} from "./opportunity.controller.ts";
import { upload } from "./opportunity.middleware.ts";

const router = Router();

router
  .route("/")
  .post(
    verifyJWT,
    isAdmin,
    upload.single("organizationLogo"),
    createOpportunity
  );
router.route("/stats").get(verifyJWT, isAdmin, getOpportunityStats);
router.route("/search").get(verifyJWT, searchAndFilterOpportunity);
router
  .route("/:id")
  .patch(
    verifyJWT,
    isAdmin,
    upload.single("organizationLogo"),
    editOpportunity
  );
router.route("/:id").delete(verifyJWT, isAdmin, deleteOpportunity);

router
  .route("/status/:status")
  .get(verifyJWT, isAdmin, getOpportunitiesBystatus);
router.route("/:id").get(verifyJWT, getOpportunitiesById);

export default router;
