import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * AdminRoute: Secures admin-only endpoints against unauthorized student/user access.
 * Checks authenticated user role and redirects safely to /discover if not an admin.
 */
export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium text-slate-400">
            Verifying administrative privileges...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Determine role safely from authenticated user state or cached auth role
  const rawUser: any = user;
  const effectiveRole = (
    rawUser?.role ||
    rawUser?.user?.role ||
    localStorage.getItem("auth_user_role") ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  const isAdmin =
    effectiveRole === "admin" || effectiveRole === "administrator";

  if (!isAdmin) {
    return <Navigate to="/discover" replace />;
  }

  return <Outlet />;
}
