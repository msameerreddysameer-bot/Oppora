import ForgotPasswordPage from "@/Pages/auth/ForgotPasswordPage";
import LoginPage from "@/Pages/auth/LoginPage";
import ResetPasswordPage from "@/Pages/auth/ResetPasswordPage";
import SignupPage from "@/Pages/auth/SignupPage";
import VerifyEmailPage from "@/Pages/auth/VerifyEmailPage";
import LandingPage from "@/Pages/LandingPage";
import GuestRoute from "@/components/GuestRoute";
import { Navigate, Route, Routes } from "react-router-dom";

/**
 * PublicRoutes:
 * Handles landing and guest-only authentication pages.
 * GuestRoute ensures that if an admin or student is already logged in,
 * they cannot view the login/signup pages without clicking logout first.
 */
export default function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />

      {/* Guest-only routes: Protected against already-authenticated users */}
      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="register" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Wildcard fallback for public paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
