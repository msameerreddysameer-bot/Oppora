import { useEffect, useState, type ReactNode } from 'react'
import {
  Briefcase,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/AuthContext'

export type AdminTab = 'dashboard' | 'opportunities' | 'create' | 'users' | 'profile'

interface AdminLayoutProps {
  children: ReactNode
  activeTab?: AdminTab
  onTabChange?: (tab: AdminTab) => void
  onCreateOpportunity?: () => void
}

export default function AdminLayout({
  children,
  activeTab,
  onTabChange,
  onCreateOpportunity: _onCreateOpportunity,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout: authLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Detect active tab from pathname
  const currentTab: AdminTab =
    activeTab ||
    (location.pathname.includes('/users')
      ? 'users'
      : location.pathname.includes('create')
      ? 'create'
      : location.pathname.includes('/opportunities')
      ? 'opportunities'
      : location.pathname.includes('/profile')
      ? 'profile'
      : 'dashboard')

  const [profileName, setProfileName] = useState<string>(() => {
    return (
      localStorage.getItem('admin_profile_name') ||
      user?.FullName ||
      user?.fullName ||
      user?.name ||
      'Administrator'
    )
  })

  const cleanAvatarUrl = (url?: string | null) => {
    if (!url) return null
    if (url.includes('images.unsplash.com/photo-1534528741775-53994a69daeb')) return null
    return url
  }

  const [profileAvatar, setProfileAvatar] = useState<string | null>(() => {
    const raw =
      localStorage.getItem('admin_profile_avatar') ||
      (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) ||
      user?.avatarUrl ||
      user?.profilePicture ||
      null
    return cleanAvatarUrl(raw)
  })

  useEffect(() => {
    const handleProfileSync = () => {
      const savedName = localStorage.getItem('admin_profile_name')
      if (savedName) setProfileName(savedName)
      const savedAvatar = localStorage.getItem('admin_profile_avatar')
      setProfileAvatar(cleanAvatarUrl(savedAvatar))
    }
    window.addEventListener('admin-profile-updated', handleProfileSync)
    return () => {
      window.removeEventListener('admin-profile-updated', handleProfileSync)
    }
  }, [])

  // Auto-sync avatar and name whenever user loads or updates from AuthContext
  useEffect(() => {
    if (user) {
      const name =
        localStorage.getItem('admin_profile_name') ||
        user?.FullName ||
        user?.fullName ||
        user?.name
      if (name) setProfileName(name)

      const avatar =
        cleanAvatarUrl(localStorage.getItem('admin_profile_avatar')) ||
        cleanAvatarUrl(typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) ||
        cleanAvatarUrl(user?.avatarUrl) ||
        cleanAvatarUrl(user?.profilePicture)
      if (avatar) {
        setProfileAvatar(avatar)
      }
    }
  }, [user])

  // Left Sidebar navigation items (Dashboard, Opportunities, Create Opportunity, Users)
  const navItems: Array<{
    id: AdminTab
    label: string
    href: string
    icon: typeof LayoutDashboard
    badge?: string | number
  }> = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { id: 'opportunities', label: 'Opportunities', href: '/admin/opportunities', icon: Briefcase },
    { id: 'create', label: 'Create Opportunity', href: '/admin/create-opportunity', icon: PlusCircle },
    { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
  ]

  const displayName = profileName
  const displayEmail = user?.email || 'admin@opportunityradar.org'
  const displayAvatar = profileAvatar

  const handleLogout = async () => {
    try {
      if (authLogout) {
        await authLogout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('admin_profile_avatar')
      navigate('/login')
    }
  }

  const handleNavClick = (tab: AdminTab, href: string) => {
    setMobileMenuOpen(false)
    if (onTabChange) {
      onTabChange(tab)
    }
    navigate(href)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* 1. Sticky Top Admin Bar (Height: 60px, Deep Blue Background, White Text) */}
      <header className="sticky top-0 z-40 h-[60px] bg-[#0B1528] text-white border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle (< lg) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          {/* Brand Logo & Title */}
          <Link
            to="/admin"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-95"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 shrink-0">
              <Compass size={17} className="text-white" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#0B1528]" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                Opportunity Radar
              </span>
              <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cyan-300 ring-1 ring-cyan-500/30">
                ADMIN
              </span>
            </div>
          </Link>
        </div>

        {/* Right Navigation Area */}
        <div className="flex items-center gap-3">
          {/* Administrator Photo/Name Area (Click opens Admin Profile Page directly) */}
          <button
            type="button"
            onClick={() => navigate('/admin/profile')}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 px-1.5 sm:pr-3 text-left hover:border-white/30 hover:bg-white/10 transition-colors group cursor-pointer"
            title="Open Admin Profile"
            aria-label="Admin Profile"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                onError={() => setProfileAvatar(null)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-cyan-500/50 group-hover:ring-cyan-400"
              />
            ) : (
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-end justify-center rounded-full overflow-hidden bg-slate-800 border border-slate-700/80 ring-2 ring-white/10 group-hover:ring-cyan-400 select-none">
                <svg
                  className="h-full w-full text-slate-400 pt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold text-white leading-tight group-hover:text-cyan-300 transition-colors">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-300 truncate max-w-[140px]">{displayEmail}</div>
            </div>
          </button>

          {/* Single Navbar Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Body Container: Desktop Sidebar + Main Content */}
      <div className="flex flex-1 min-w-0">
        {/* 2. Desktop Sidebar: Width w-56 (224px), Sticky below top bar, White light / Slate dark */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto">
          <div className="space-y-4">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Admin Menu
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id, item.href)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-cyan-300 dark:ring-cyan-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-cyan-400 animate-pulse" />
                <span>Database Online</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                Live opportunity indexing synchronized.
              </p>
            </div>
          </div>
        </aside>

        {/* 3. Main Admin Content: p-5 on smaller screens, sm:p-7 on larger screens */}
        <main className="flex-1 min-w-0 p-5 sm:p-7 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* 4. Mobile Slide-Over Drawer for Screens < lg */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[85vw] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Compass size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Opportunity Radar</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id, item.href)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
