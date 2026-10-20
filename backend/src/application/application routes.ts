import { Router } from "express";
import { verifyJWT } from "../auth/auth.middleware.ts";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getUserApplicationsAndsearchAndfilters,
  updateApplication,
} from "./application controller.ts";
import { isUser } from "../user/user.middleware.ts";

const router = Router();

router.route("/:opportunityId").post(verifyJWT, isUser, createApplication);
router.route("/:applicationId").patch(verifyJWT, isUser, updateApplication);
router.route("/:applicationId").delete(verifyJWT, isUser, deleteApplication);
router.route("/:applicationId").get(verifyJWT, isUser, getApplicationById);
router
  .route("/")
  .get(verifyJWT, isUser, getUserApplicationsAndsearchAndfilters);

export default router;
