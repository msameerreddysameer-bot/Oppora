import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium text-slate-400">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admins belong exclusively in the Admin Console
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

  if (effectiveRole === "admin" || effectiveRole === "administrator") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
