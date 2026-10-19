import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * GuestRoute (Public-Only Route Guard):
 * Protects authentication routes (e.g., /login, /signup, /forgot-password).
 * If a user is already logged in and tries to navigate to /login without clicking Logout:
 * - Admin users are automatically kept on / redirected to /admin.
 * - Student/general users are automatically kept on / redirected to /discover.
 * Only unauthenticated guests can view the login/signup pages.
 */
export default function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium text-slate-400">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    const rawUser: any = user
    const effectiveRole = (
      rawUser?.role ||
      rawUser?.user?.role ||
      localStorage.getItem('auth_user_role') ||
      ''
    ).toString().toLowerCase().trim()

    const isAdmin = effectiveRole === 'admin' || effectiveRole === 'administrator'

    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }

    return <Navigate to="/discover" replace />
  }

  return <Outlet />
}

