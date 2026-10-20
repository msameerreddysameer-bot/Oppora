import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();

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

  const dashboardPath =
    effectiveRole === "admin" || effectiveRole === "administrator"
      ? "/admin"
      : "/discover";

  return (
    <nav className="bg-slate-900 h-16 p-2 flex items-center justify-between sticky max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white p-1.5 shadow-md shadow-slate-950/40">
          <img
            src="/oppora-logo.svg"
            alt="Oppora Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-white font-semibold tracking-tight text-[15px]">Oppora</span>
      </Link>

      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <Link
            to={dashboardPath}
            className="text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="hover:text-white text-gray-300 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-white bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
