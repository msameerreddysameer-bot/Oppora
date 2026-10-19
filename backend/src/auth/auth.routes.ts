import { Router } from "express";
import { verifyJWT } from "./auth.middleware.ts";
import { changeCurrentPassword, forgotPassword, login, logout, refreshAccessToken, registerUser, resetPassword, sendVerificationEmail, verifyVerificationToken} from "./auth.controller.ts";
import { upload } from "../opportunity/opportunity.middleware.ts";
import { resendVerificationEmail } from "./auth.service.ts";


const router = Router()

router.route("/register").post(registerUser)
router.route("/verify-email").get(verifyVerificationToken)
router.route("/resend-verification-email").post(resendVerificationEmail)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT,logout)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password").post(resetPassword)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/refresh-token").post(refreshAccessToken)


export default router
