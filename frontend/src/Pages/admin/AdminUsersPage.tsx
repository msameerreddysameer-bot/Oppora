import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  ArrowLeft,
  GraduationCap,
  Search,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  apiSearchAndFilters,
  apiToogleUserRoleByEmail,
} from '@/services/opportunityService'

export interface AdminUserAccount {
  _id: string
  fullName: string
  email: string
  role: 'user' | 'admin'
  college: string
  branch: string
  year: string
  avatar: string
  joinedDate?: string
}

interface UserAvatarProps {
  avatar?: string
  name: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg' | 'modal'
}

function UserAvatar({ avatar, name, onClick, size = 'md' }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    modal: 'h-28 w-28',
  }[size]

  const showSkeleton = !avatar || hasError

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-700/80 transition-all ${
        onClick ? 'cursor-pointer hover:ring-cyan-400 group/avatar' : 'cursor-default'
      } ${sizeClasses} ${
        showSkeleton ? 'bg-slate-800 text-slate-400' : 'bg-slate-900'
      }`}
      title={onClick ? 'Click to view photo' : undefined}
    >
      {showSkeleton ? (
        <UserIcon
          className={`${
            size === 'modal' ? 'h-14 w-14' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          } text-slate-400`}
        />
      ) : (
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </button>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  // Clean state: Live users from database (NO dummy/mock data!)
  const [users, setUsers] = useState<AdminUserAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Infinite Scroll & Pagination States
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  // Active Role Tab: 'user' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<'user' | 'admin'>('user')

  // Search State with 300ms Debounce
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Role Tab Counts
  const [counts, setCounts] = useState<{ user: number; admin: number }>({
    user: 0,
    admin: 0,
  })

  // Selected photo for preview modal
  const [previewUser, setPreviewUser] = useState<AdminUserAccount | null>(null)

  // Purge any stale mock data previously stored in localStorage
  useEffect(() => {
    localStorage.removeItem('admin_managed_users')
  }, [])

  // Debounce search query to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // =========================================================================
  // [BACKEND API: FETCH USERS WITH FILTERS - PAGE 1]
  // Hits GET /user/search via opportunityService.apiSearchAndFilters()
  // =========================================================================
  useEffect(() => {
    let isMounted = true

    const fetchLiveUsers = async () => {
      try {
        setIsLoading(true)
        const res = await apiSearchAndFilters({
          queryTerm: debouncedSearch.trim() || undefined,
          role: activeRoleTab,
          page: 1,
          limit: 20,
        })

        // Handles common backend response structures
        const backendUsers =
          res?.data?.results ||
          res?.data?.users ||
          res?.data?.data?.results ||
          res?.data?.data ||
          res?.results ||
          (Array.isArray(res?.data) ? res.data : [])

        const total =
          res?.data?.totalResults ??
          res?.data?.totalUsers ??
          res?.data?.total ??
          res?.totalResults ??
          res?.total ??
          (Array.isArray(backendUsers) ? backendUsers.length : 0)

        if (isMounted) {
          if (Array.isArray(backendUsers)) {
            const mapped: AdminUserAccount[] = backendUsers.map((u: any) => ({
              _id: u._id || u.id || String(Math.random()),
              fullName: u.FullName || u.fullName || u.name || 'User',
              email: u.email || '',
              role: u.role === 'admin' ? 'admin' : 'user',
              college: u.college || '',
              branch: u.branch || '',
              year: u.year || '',
              avatar: u.avatar || u.avatarUrl || u.profilePicture || '',
              joinedDate: u.createdAt
                ? new Date(u.createdAt).toISOString().split('T')[0]
                : undefined,
            }))
            setUsers(mapped)
            setTotalResults(total)
            setPage(1)
            setHasMore(mapped.length < total && mapped.length > 0)
            setCounts((prev) => ({
              ...prev,
              [activeRoleTab]: total > 0 ? total : mapped.length,
            }))
          } else {
            setUsers([])
            setTotalResults(0)
            setHasMore(false)
          }
        }
      } catch (err) {
        console.warn('[AdminUsersPage] Error fetching users from API:', err)
        if (isMounted) {
          setUsers([])
          setTotalResults(0)
          setHasMore(false)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchLiveUsers()
    return () => {
      isMounted = false
    }
  }, [activeRoleTab, debouncedSearch])

  // =========================================================================
  // [INFINITE SCROLL: FETCH NEXT PAGE OF USERS]
  // =========================================================================
  const fetchMoreLiveUsers = async () => {
    if (isLoadingMore || !hasMore) return

    const nextPage = page + 1
    setIsLoadingMore(true)

    try {
      console.log(`[AdminUsersPage] Loading page ${nextPage} for role ${activeRoleTab}...`)
      const res = await apiSearchAndFilters({
        queryTerm: debouncedSearch.trim() || undefined,
        role: activeRoleTab,
        page: nextPage,
        limit: 20,
      })

      const backendUsers =
        res?.data?.results ||
        res?.data?.users ||
        res?.data?.data?.results ||
        res?.data?.data ||
        res?.results ||
        (Array.isArray(res?.data) ? res.data : [])

      const total =
        res?.data?.totalResults ??
        res?.data?.totalUsers ??
        res?.data?.total ??
        res?.totalResults ??
        res?.total ??
        totalResults

      if (Array.isArray(backendUsers) && backendUsers.length > 0) {
        const mapped: AdminUserAccount[] = backendUsers.map((u: any) => ({
          _id: u._id || u.id || String(Math.random()),
          fullName: u.FullName || u.fullName || u.name || 'User',
          email: u.email || '',
          role: u.role === 'admin' ? 'admin' : 'user',
          college: u.college || '',
          branch: u.branch || '',
          year: u.year || '',
          avatar: u.avatar || u.avatarUrl || u.profilePicture || '',
          joinedDate: u.createdAt
            ? new Date(u.createdAt).toISOString().split('T')[0]
            : undefined,
        }))

        let reachedEnd = false
        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u._id))
          const uniqueNew = mapped.filter((u) => !existingIds.has(u._id))
          const updated = [...prev, ...uniqueNew]
          if (updated.length >= total || uniqueNew.length === 0 || backendUsers.length < 20) {
            reachedEnd = true
          }
          return updated
        })
        setPage(nextPage)
        if (reachedEnd) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.warn('[AdminUsersPage] Failed to fetch more users:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // =========================================================================
  // [BACKEND API: PROMOTE USER TO ADMIN]
  // Hits PATCH /user/toggle-role via opportunityService.apiToogleUserRoleByEmail()
  // =========================================================================
  const handlePromote = async (userId: string, email?: string) => {
    const target = users.find((u) => u._id === userId)
    if (!target) return
    const userEmail = email || target.email

    if (
      !window.confirm(
        `Promote ${target.fullName} to Administrator? This account will move to the Admin Users tab.`
      )
    ) {
      return
    }

    try {
      if (userEmail) {
        await apiToogleUserRoleByEmail({ email: userEmail })
      }
      // Remove from current Users tab list immediately
      setUsers((prev) => prev.filter((u) => u._id !== userId))
      setCounts((prev) => ({
        user: Math.max(0, prev.user - 1),
        admin: prev.admin + 1,
      }))
    } catch (err: any) {
      console.warn('[API Warning] Could not toggle user role to admin:', err)
      alert(
        `Failed to promote user: ${err?.response?.data?.message || err?.message || 'Server error'}`
      )
    }
  }

  // =========================================================================
  // [BACKEND API: DEMOTE ADMIN TO REGULAR USER]
  // Hits PATCH /user/toggle-role via opportunityService.apiToogleUserRoleByEmail()
  // =========================================================================
  const handleDemote = async (userId: string, email?: string) => {
    const target = users.find((u) => u._id === userId)
    if (!target) return
    const userEmail = email || target.email

    if (
      !window.confirm(
        `Demote ${target.fullName} to Regular User? This account will move to the Users tab.`
      )
    ) {
      return
    }

    try {
      if (userEmail) {
        await apiToogleUserRoleByEmail({ email: userEmail })
      }
      // Remove from current Admin Users tab list immediately
      setUsers((prev) => prev.filter((u) => u._id !== userId))
      setCounts((prev) => ({
        admin: Math.max(0, prev.admin - 1),
        user: prev.user + 1,
      }))
    } catch (err: any) {
      console.warn('[API Warning] Could not toggle user role to regular user:', err)
      alert(
        `Failed to demote user: ${err?.response?.data?.message || err?.message || 'Server error'}`
      )
    }
  }

  // Live account counts for tabs
  const userCount =
    activeRoleTab === 'user'
      ? totalResults > 0
        ? totalResults
        : users.length
      : counts.user
  const adminCount =
    activeRoleTab === 'admin'
      ? totalResults > 0
        ? totalResults
        : users.length
      : counts.admin

  // Filtered list based on active tab and search query
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      // Must match active role tab
      if (user.role !== activeRoleTab) return false

      if (!query) return true

      const matchesName = (user.fullName || '').toLowerCase().includes(query)
      const matchesEmail = (user.email || '').toLowerCase().includes(query)
      const matchesCollege =
        activeRoleTab === 'user' && user.college
          ? user.college.toLowerCase().includes(query)
          : false

      return matchesName || matchesEmail || matchesCollege
    })
  }, [users, activeRoleTab, searchQuery])

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users size={22} className="text-blue-500" />
              User Account Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage student accounts and portal administrators. Promote or demote user roles with instant tab sync.
            </p>
          </div>
        </div>

        {/* Controls Bar: Two Role Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Two Role Tabs: Users & Admins with current account count */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveRoleTab('user')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRoleTab === 'user'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users size={14} />
              <span>Users</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeRoleTab === 'user'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {userCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRoleTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRoleTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Admin Users</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeRoleTab === 'admin'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {adminCount}
              </span>
            </button>
          </div>

          {/* Search Bar: by Name, Email, College with immediate update */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={
                activeRoleTab === 'user'
                  ? 'Search by name, email, or college...'
                  : 'Search by name or email...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-xs text-slate-400">
              Loading {activeRoleTab === 'user' ? 'users' : 'administrators'} from database...
            </span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-1">
            <p className="font-semibold text-slate-300">
              No {activeRoleTab === 'user' ? 'regular users' : 'administrators'} found
            </p>
            <p className="text-[11px] text-slate-500">
              {searchQuery
                ? `No accounts matching "${searchQuery}"`
                : `There are currently no ${
                    activeRoleTab === 'user' ? 'student user' : 'administrator'
                  } accounts in the database.`}
            </p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={filteredList.length}
            next={fetchMoreLiveUsers}
            hasMore={hasMore}
            scrollThreshold={0.8}
            loader={
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-cyan-300 shadow backdrop-blur-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  <span>Loading more {activeRoleTab === 'user' ? 'users' : 'administrators'}...</span>
                </div>
              </div>
            }
            endMessage={
              filteredList.length > 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  ✨ All {activeRoleTab === 'user' ? 'users' : 'administrators'} loaded ({totalResults > 0 ? totalResults : filteredList.length} total)
                </div>
              ) : null
            }
          >
            {/* 1. RESPONSIVE DESKTOP TABLE */}
            <div className="hidden md:block relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
              <table
                className={`w-full text-left text-xs border-collapse ${
                  activeRoleTab === 'user' ? 'min-w-[850px]' : 'min-w-[650px]'
                }`}
              >
                <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 uppercase tracking-wider text-slate-400 text-[11px] backdrop-blur-md">
                  <tr>
                    <th className="w-16 px-5 py-3.5 font-semibold text-center">Avatar</th>
                    <th className="px-5 py-3.5 font-semibold">Name</th>
                    <th className="px-5 py-3.5 font-semibold">Email</th>
                    {activeRoleTab === 'user' && (
                      <>
                        <th className="px-4 py-3.5 font-semibold">College</th>
                        <th className="px-4 py-3.5 font-semibold">Branch</th>
                        <th className="px-4 py-3.5 font-semibold">Year</th>
                      </>
                    )}
                    <th className="px-4 py-3.5 font-semibold">Role</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredList.map((user) => (
                    <tr
                      key={user._id}
                      className="transition-colors group hover:bg-slate-800/40"
                    >
                      {/* Avatar Column */}
                      <td className="px-5 py-4 w-16">
                        <div className="flex justify-center">
                          <UserAvatar
                            avatar={user.avatar}
                            name={user.fullName}
                            size="md"
                            onClick={() => setPreviewUser(user)}
                          />
                        </div>
                      </td>

                      {/* Name Column */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-[13px] leading-tight">
                          {user.fullName}
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="px-5 py-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                        {user.email}
                      </td>

                      {/* College, Branch, Year Columns: ONLY in Users tab */}
                      {activeRoleTab === 'user' && (
                        <>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            {user.college}
                          </td>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            {user.branch}
                          </td>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
                              {user.year}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Role Badge Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-500/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            Regular User
                          </span>
                        )}
                      </td>

                      {/* Actions Column: Promote or Demote */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {user.role === 'user' ? (
                          <button
                            type="button"
                            onClick={() => handlePromote(user._id, user.email)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                          >
                            <ShieldCheck size={14} />
                            <span>Promote to admin</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDemote(user._id, user.email)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition-all active:scale-95"
                          >
                            <ShieldAlert size={14} />
                            <span>Demote to user</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. RESPONSIVE MOBILE USER CARDS (Visible on screens < md) */}
            <div className="md:hidden space-y-3.5">
              {filteredList.map((user) => (
                <div
                  key={user._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3.5 shadow-sm"
                >
                  {/* Card Top: Profile Photo, Name, and Role Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatar={user.avatar}
                        name={user.fullName}
                        size="lg"
                        onClick={() => setPreviewUser(user)}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm leading-tight truncate">
                          {user.fullName}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {user.role === 'admin' ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-500/20 shrink-0">
                        User
                      </span>
                    )}
                  </div>

                  {/* Card Body: College, Branch, Year - ONLY shown for Users */}
                  {activeRoleTab === 'user' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-300">
                        <GraduationCap size={13} className="text-cyan-400 shrink-0" />
                        <span className="truncate">{user.college}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[11px] text-slate-500 block">Branch</span>
                        <span className="text-slate-300 font-medium truncate">{user.branch}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Year</span>
                        <span className="text-slate-300 font-medium">{user.year}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button: Promote or Demote */}
                  <div className="pt-2 border-t border-slate-800/80">
                    {user.role === 'user' ? (
                      <button
                        type="button"
                        onClick={() => handlePromote(user._id, user.email)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                      >
                        <ShieldCheck size={14} />
                        <span>Promote to admin</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDemote(user._id, user.email)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-2.5 text-xs font-semibold text-amber-300 transition-all active:scale-95"
                      >
                        <ShieldAlert size={14} />
                        <span>Demote to user</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}

        {/* Clickable Profile Photo Preview Modal */}
        {previewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
              <button
                type="button"
                onClick={() => setPreviewUser(null)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex justify-center">
                <UserAvatar
                  avatar={previewUser.avatar}
                  name={previewUser.fullName}
                  size="modal"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{previewUser.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{previewUser.email}</p>
              </div>

              {previewUser.role === 'user' && (previewUser.college || previewUser.branch || previewUser.year) ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5 text-left text-slate-300">
                  {previewUser.college && (
                    <p className="flex items-center gap-1.5 truncate">
                      <GraduationCap size={13} className="text-cyan-400 shrink-0" />
                      <span className="text-slate-400">College:</span>{' '}
                      <span className="text-white font-medium truncate">{previewUser.college}</span>
                    </p>
                  )}
                  {previewUser.branch && (
                    <p className="truncate">
                      <span className="text-slate-400">Branch:</span>{' '}
                      <span className="text-white font-medium">{previewUser.branch}</span>
                    </p>
                  )}
                  {previewUser.year && (
                    <p>
                      <span className="text-slate-400">Year:</span>{' '}
                      <span className="text-white font-medium">{previewUser.year}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-center text-slate-300">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                    <ShieldCheck size={12} />
                    Platform Administrator
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewUser(null)}
                  className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUser(null)
                    navigate('/admin')
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
