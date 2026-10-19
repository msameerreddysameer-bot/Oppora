import { Router } from "express";
import { verifyJWT } from "../auth/auth.middleware.ts";
import { checkSavedOpportunitiesByOpportunityId, getSavedOpportunitiesByUserIdAndSearch, getSavedOpportunityById, saveOpportunity, unSaveOpportunity } from "./saved opportunity controller.ts";
import { isUser } from "../user/user.middleware.ts";


const router = Router()

router.route("/:opportunityId").post(verifyJWT,isUser,saveOpportunity)
router.route("/:pportunityId").delete(verifyJWT,isUser,unSaveOpportunity)
router.route("/").get(verifyJWT,isUser,getSavedOpportunitiesByUserIdAndSearch)
router.route("/check/:opportunityId").post(verifyJWT,isUser,checkSavedOpportunitiesByOpportunityId)              
router.route("/:savedOpportunityId").get(verifyJWT,isUser,getSavedOpportunityById)
//for testing without jwt
router.route("/test/:opportunityId").post(verifyJWT,saveOpportunity)
router.route("/test/check/:opportunityId").post(verifyJWT,isUser,checkSavedOpportunitiesByOpportunityId)            
router.route("/test/:opportunityId").delete(verifyJWT,unSaveOpportunity)
router.route("/test/").get(verifyJWT,getSavedOpportunitiesByUserIdAndSearch) 
router.route("/test/:savedOpportunityId").get(verifyJWT,getSavedOpportunityById)



export default router;
