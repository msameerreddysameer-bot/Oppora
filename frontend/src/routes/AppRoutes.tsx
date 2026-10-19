import StudentDashboardPage from "../Pages/StudentDashboardPage";
import SavedOpportunitiesPage from "@/Pages/SavedOpportunitiesPage";
import MyApplicationsPage from "../Pages/MyApplicationsPage";
import StudentProfilePage from "../Pages/StudentProfilePage";
import OpportunityDetailsPage from "../Pages/OpportunityDetailsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";
import GuestRoute from "../components/GuestRoute";
import AdminRoutes from "./AdminRoutes";
import LandingPage from "@/Pages/LandingPage";
import LoginPage from "@/Pages/auth/LoginPage";
import SignupPage from "@/Pages/auth/SignupPage";
import ForgotPasswordPage from "@/Pages/auth/ForgotPasswordPage";
import VerifyEmailPage from "@/Pages/auth/VerifyEmailPage";
import ResetPasswordPage from "@/Pages/auth/ResetPasswordPage";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";

/**
 * FallbackRedirect:
 * Handles unknown routes gracefully by redirecting users based on active session:
 * - Logged-in Admins -> /admin
 * - Logged-in Students -> /discover
 * - Unauthenticated Guests -> /
 */
function FallbackRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const rawUser: any = user;
    const effectiveRole = (
      rawUser?.role ||
      rawUser?.user?.role ||
      localStorage.getItem('auth_user_role') ||
      ''
    ).toString().toLowerCase().trim();

    if (effectiveRole === 'admin' || effectiveRole === 'administrator') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  return <Navigate to="/" replace />;
}

/**
 * AppRoutes:
 * Master router defining strict role-based access control and anti-bypass protections:
 * 1. AdminRoute: Only authenticated administrators can access /admin/*
 * 2. ProtectedRoute: Only authenticated students/users can access /discover, /saved, /profile, etc.
 * 3. GuestRoute: Authenticated users trying to access /login, /signup, etc. without logging out
 *    are blocked and redirected to their respective dashboards.
 * 4. LandingPage: Public root page.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Admin route group (secured by AdminRoute: admin only) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>

      {/* 2. Student route group (secured by ProtectedRoute: students only) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/discover" element={<StudentDashboardPage />} />
        <Route path="/saved" element={<SavedOpportunitiesPage />} />
        <Route path="/applications" element={<MyApplicationsPage />} />
        <Route path="/profile" element={<StudentProfilePage />} />
        <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
      </Route>

      {/* 3. Guest-only authentication routes (blocked for logged-in users) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* 4. Public marketing landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* 5. Wildcard fallback: smart redirect according to role */}
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
