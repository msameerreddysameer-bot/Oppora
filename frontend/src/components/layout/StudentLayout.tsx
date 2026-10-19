import { useEffect, useState, type ReactNode } from 'react'
import { BadgeCheck, Bookmark, Compass, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { logout } from '@/services/authApi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/AuthContext'

type StudentPage = 'discover' | 'saved' | 'applications' | 'profile'

interface StudentLayoutProps {
  children: ReactNode
  activePage: StudentPage
  dark?: boolean
  onToggleDark?: () => void
  onLogout?: () => void
}

const navigation: Array<{ label: string; page: StudentPage; href: string; icon: typeof Compass }> = [
  { label: 'Discover', page: 'discover', href: '/discover', icon: Compass },
  { label: 'Saved', page: 'saved', href: '/saved', icon: Bookmark },
  { label: 'Applications', page: 'applications', href: '/applications', icon: BadgeCheck },
]

export default function StudentLayout({ children, activePage, dark = false, onToggleDark, onLogout }: StudentLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout: authLogout } = useAuth()
  const [navAvatar, setNavAvatar] = useState<string | null>(() => {
    return localStorage.getItem('student_profile_avatar')
  })
  const navigate = useNavigate()

  const displayName = user?.FullName || user?.fullName || user?.name || ''
  const displayEmail = user?.email || ''
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
    : 'U'
  const displayAvatar = (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) || user?.avatarUrl || user?.profilePicture || navAvatar

  const handleLogout = async () => {
    try {
      if (authLogout) {
        await authLogout();
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Logout failed on backend:', error);
    } finally {
      // 1. Clear cached student data from browser
      localStorage.removeItem('student_profile_avatar');

      // 2. Run any custom onLogout callback if passed
      if (onLogout) {
        onLogout();
      }

      // 3. Redirect user back to the login page
      navigate('/login');
    }
  };

  useEffect(() => {
    const syncAvatar = () => {
      setNavAvatar(localStorage.getItem('student_profile_avatar'))
    }
    window.addEventListener('profile-avatar-updated', syncAvatar)
    window.addEventListener('storage', syncAvatar)
    return () => {
      window.removeEventListener('profile-avatar-updated', syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [])

  

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900">
        <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/discover" className="flex shrink-0 items-center gap-2 hover:opacity-80" onClick={() => setMenuOpen(false)}>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Compass size={16} className="text-white" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
            </span>
            <span className="hidden text-[15px] font-semibold tracking-tight text-white min-[400px]:inline">Opportunity Radar</span>
          </Link>

          <div className="hidden flex-1 items-center gap-1 md:flex md:ml-4">
            {navigation.map(({ label, page, href, icon: Icon }) => (
              <Link key={page} to={href} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activePage === page ? 'bg-blue-500/15 text-blue-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {onToggleDark && (
              <button type="button" onClick={onToggleDark} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Toggle dark mode">
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}
            <Link to="/profile" className="hidden items-center gap-2 rounded-full px-1 py-1 text-left hover:bg-white/5 sm:flex" aria-label="Open profile">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName || "Profile"}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/50"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials}</span>
              )}
              {displayName && (
                <span className="hidden leading-tight lg:block">
                  <span className="block text-xs font-semibold text-white">{displayName}</span>
                  {displayEmail && <span className="block text-[10px] text-slate-400">{displayEmail}</span>}
                </span>
              )}
            </Link>

            {/* Desktop Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-400 sm:inline-flex"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>

            <button type="button" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="fixed inset-0 z-60 md:hidden">
            <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />
            <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col border-l border-white/10 bg-slate-950 px-4 py-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-sm font-semibold text-white">Navigation</span>
                <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close navigation menu">
                  <X size={19} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {navigation.map(({ label, page, href, icon: Icon }) => (
                  <Link key={page} to={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${activePage === page ? 'bg-blue-500/15 text-blue-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
                  <User size={16} />
                  Profile
                </Link>

                <div className="my-2 border-t border-white/10" />

                {/* Mobile Drawer Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </header>
      {children}
    </div>
  )
}