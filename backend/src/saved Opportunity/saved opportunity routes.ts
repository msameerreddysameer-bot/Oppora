import { Router } from "express";
import { verifyJWT } from "../auth/auth.middleware.ts";
import {
  checkSavedOpportunitiesByOpportunityId,
  getSavedOpportunitiesByUserIdAndSearch,
  getSavedOpportunityById,
  saveOpportunity,
  unSaveOpportunity,
} from "./saved opportunity controller.ts";
import { isUser } from "../user/user.middleware.ts";

const router = Router();

// Primary authenticated and authorized saved opportunity endpoints
router
  .route("/")
  .get(verifyJWT, isUser, getSavedOpportunitiesByUserIdAndSearch);
router
  .route("/check/:opportunityId")
  .post(verifyJWT, isUser, checkSavedOpportunitiesByOpportunityId);
router.route("/:opportunityId").post(verifyJWT, isUser, saveOpportunity);
router.route("/:opportunityId").delete(verifyJWT, isUser, unSaveOpportunity);
router
  .route("/:savedOpportunityId")
  .get(verifyJWT, isUser, getSavedOpportunityById);

// Secured alias routes for backward compatibility with existing clients
router.route("/test/:opportunityId").post(verifyJWT, isUser, saveOpportunity);
router
  .route("/test/check/:opportunityId")
  .post(verifyJWT, isUser, checkSavedOpportunitiesByOpportunityId);
router.route("/test/:opportunityId").delete(verifyJWT, isUser, unSaveOpportunity);
router.route("/test/").get(verifyJWT, isUser, getSavedOpportunitiesByUserIdAndSearch);
router
  .route("/test/:savedOpportunityId")
  .get(verifyJWT, isUser, getSavedOpportunityById);

export default router;
