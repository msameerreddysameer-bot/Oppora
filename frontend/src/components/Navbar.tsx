import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { useAuth } from "./AuthContext"

export default function Navbar() {
  const { isAuthenticated, user } = useAuth()

  const rawUser: any = user
  const effectiveRole = (
    rawUser?.role ||
    rawUser?.user?.role ||
    localStorage.getItem('auth_user_role') ||
    ''
  ).toString().toLowerCase().trim()

  const dashboardPath = effectiveRole === 'admin' || effectiveRole === 'administrator'
    ? '/admin'
    : '/discover'

  return (
    <nav className='bg-slate-900 h-16 p-2 flex items-center justify-between sticky max-w-7xl mx-auto'>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center">
          <Compass className="text-white" />
        </div> 
        <span className="text-white font-semibold">Opportunity Radar</span>
      </div>

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
  )
}
