import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/shared/Skeletons";
import {
  apiSearchAndFilters,
  apiToogleUserRoleByEmail,
} from "@/services/opportunityService";

export interface AdminUserAccount {
  _id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  college: string;
  branch: string;
  year: string;
  avatar: string;
  joinedDate?: string;
}

interface UserAvatarProps {
  avatar?: string;
  name: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "modal";
}

function UserAvatar({ avatar, name, onClick, size = "md" }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    modal: "h-28 w-28",
  }[size];

  const showSkeleton = !avatar || hasError;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-700/80 transition-all ${
        onClick
          ? "cursor-pointer hover:ring-cyan-400 group/avatar"
          : "cursor-default"
      } ${sizeClasses} ${
        showSkeleton ? "bg-slate-800 text-slate-400" : "bg-slate-900"
      }`}
      title={onClick ? "Click to view photo" : undefined}
    >
      {showSkeleton ? (
        <UserIcon
          className={`${
            size === "modal"
              ? "h-14 w-14"
              : size === "lg"
                ? "h-6 w-6"
                : "h-5 w-5"
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
  );
}

export default function AdminUsersPage() {
  const navigate = useNavigate();

  // Clean state: Live users from database (NO dummy/mock data!)
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Infinite Scroll & Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Active Role Tab: 'user' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<"user" | "admin">("user");

  // Search State with 300ms Debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Role Tab Counts
  const [counts, setCounts] = useState<{ user: number; admin: number }>({
    user: 0,
    admin: 0,
  });

  // Selected photo for preview modal
  const [previewUser, setPreviewUser] = useState<AdminUserAccount | null>(null);

  // Professional role toggle confirmation modal
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote";
    user: AdminUserAccount;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Purge any stale mock data previously stored in localStorage
  useEffect(() => {
    localStorage.removeItem("admin_managed_users");
  }, []);

  // Debounce search query to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // =========================================================================
  // [BACKEND API: FETCH USERS WITH FILTERS - PAGE 1]
  // Hits GET /user/search via opportunityService.apiSearchAndFilters()
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    const fetchLiveUsers = async () => {
      try {
        setIsLoading(true);
        const res = await apiSearchAndFilters({
          queryTerm: debouncedSearch.trim() || undefined,
          role: activeRoleTab,
          page: 1,
          limit: 20,
        });

        // Handles common backend response structures
        const backendUsers =
          res?.data?.results ||
          res?.data?.users ||
          res?.data?.data?.results ||
          res?.data?.data ||
          res?.results ||
          (Array.isArray(res?.data) ? res.data : []);

        const total =
          res?.data?.totalResults ??
          res?.data?.totalUsers ??
          res?.data?.total ??
          res?.totalResults ??
          res?.total ??
          (Array.isArray(backendUsers) ? backendUsers.length : 0);

        if (isMounted) {
          if (Array.isArray(backendUsers)) {
            const mapped: AdminUserAccount[] = backendUsers.map((u: any) => ({
              _id: u._id || u.id || String(Math.random()),
              fullName: u.FullName || u.fullName || u.name || "User",
              email: u.email || "",
              role: u.role === "admin" ? "admin" : "user",
              college: u.college || "",
              branch: u.branch || "",
              year: u.year || "",
              avatar: u.avatar || u.avatarUrl || u.profilePicture || "",
              joinedDate: u.createdAt
                ? new Date(u.createdAt).toISOString().split("T")[0]
                : undefined,
            }));
            setUsers(mapped);
            setTotalResults(total);
            setPage(1);
            setHasMore(mapped.length < total && mapped.length > 0);
            setCounts((prev) => ({
              ...prev,
              [activeRoleTab]: total > 0 ? total : mapped.length,
            }));
          } else {
            setUsers([]);
            setTotalResults(0);
            setHasMore(false);
          }
        }
      } catch {
        if (isMounted) {
          setUsers([]);
          setTotalResults(0);
          setHasMore(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveUsers();
    return () => {
      isMounted = false;
    };
  }, [activeRoleTab, debouncedSearch]);

  // =========================================================================
  // [INFINITE SCROLL: FETCH NEXT PAGE OF USERS]
  // =========================================================================
  const fetchMoreLiveUsers = async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const res = await apiSearchAndFilters({
        queryTerm: debouncedSearch.trim() || undefined,
        role: activeRoleTab,
        page: nextPage,
        limit: 20,
      });

      const backendUsers =
        res?.data?.results ||
        res?.data?.users ||
        res?.data?.data?.results ||
        res?.data?.data ||
        res?.results ||
        (Array.isArray(res?.data) ? res.data : []);

      const total =
        res?.data?.totalResults ??
        res?.data?.totalUsers ??
        res?.data?.total ??
        res?.totalResults ??
        res?.total ??
        totalResults;

      if (Array.isArray(backendUsers) && backendUsers.length > 0) {
        const mapped: AdminUserAccount[] = backendUsers.map((u: any) => ({
          _id: u._id || u.id || String(Math.random()),
          fullName: u.FullName || u.fullName || u.name || "User",
          email: u.email || "",
          role: u.role === "admin" ? "admin" : "user",
          college: u.college || "",
          branch: u.branch || "",
          year: u.year || "",
          avatar: u.avatar || u.avatarUrl || u.profilePicture || "",
          joinedDate: u.createdAt
            ? new Date(u.createdAt).toISOString().split("T")[0]
            : undefined,
        }));

        let reachedEnd = false;
        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u._id));
          const uniqueNew = mapped.filter((u) => !existingIds.has(u._id));
          const updated = [...prev, ...uniqueNew];
          if (
            updated.length >= total ||
            uniqueNew.length === 0 ||
            backendUsers.length < 20
          ) {
            reachedEnd = true;
          }
          return updated;
        });
        setPage(nextPage);
        if (reachedEnd) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle switching role tabs with instant skeleton feedback (no stale-data empty state flicker)
  const handleRoleTabChange = (tab: "user" | "admin") => {
    if (activeRoleTab !== tab) {
      setIsLoading(true);
      setUsers([]);
      setActiveRoleTab(tab);
    }
  };

  // Open professional confirmation modal for promoting user
  const handlePromote = (userId: string, email?: string) => {
    const target = users.find((u) => u._id === userId);
    if (!target) return;
    setConfirmAction({
      type: "promote",
      user: { ...target, email: email || target.email },
    });
  };

  // Open professional confirmation modal for demoting admin
  const handleDemote = (userId: string, email?: string) => {
    const target = users.find((u) => u._id === userId);
    if (!target) return;
    setConfirmAction({
      type: "demote",
      user: { ...target, email: email || target.email },
    });
  };

  // Execute role toggle with clean toast feedback
  const executeRoleToggle = async () => {
    if (!confirmAction) return;
    const { type, user: targetUser } = confirmAction;
    setIsActionLoading(true);

    try {
      if (targetUser.email) {
        await apiToogleUserRoleByEmail({ email: targetUser.email });
      }

      // Remove from current active tab list immediately
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      setCounts((prev) => ({
        user:
          type === "promote"
            ? Math.max(0, prev.user - 1)
            : prev.user + 1,
        admin:
          type === "promote"
            ? prev.admin + 1
            : Math.max(0, prev.admin - 1),
      }));

      setToast({
        type: "success",
        message:
          type === "promote"
            ? `Successfully promoted ${targetUser.fullName} to Administrator.`
            : `Successfully demoted ${targetUser.fullName} to Regular User.`,
      });

      setConfirmAction(null);
    } catch (err: any) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          `Failed to ${type} user. Please try again.`,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Live account counts for tabs
  const userCount =
    activeRoleTab === "user"
      ? totalResults > 0
        ? totalResults
        : users.length
      : counts.user;
  const adminCount =
    activeRoleTab === "admin"
      ? totalResults > 0
        ? totalResults
        : users.length
      : counts.admin;

  // Filtered list based on active tab and search query
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      // Must match active role tab
      if (user.role !== activeRoleTab) return false;

      if (!query) return true;

      const matchesName = (user.fullName || "").toLowerCase().includes(query);
      const matchesEmail = (user.email || "").toLowerCase().includes(query);
      const matchesCollege =
        activeRoleTab === "user" && user.college
          ? user.college.toLowerCase().includes(query)
          : false;

      return matchesName || matchesEmail || matchesCollege;
    });
  }, [users, activeRoleTab, searchQuery]);

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
              Manage student accounts and portal administrators. Promote or
              demote user roles with instant tab sync.
            </p>
          </div>
        </div>

        {/* Controls Bar: Two Role Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Two Role Tabs: Users & Admins with current account count */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => handleRoleTabChange("user")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRoleTab === "user"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users size={14} />
              <span>Users</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeRoleTab === "user"
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {userCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange("admin")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeRoleTab === "admin"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShieldCheck size={14} />
              <span>Admin Users</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeRoleTab === "admin"
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-300"
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
                activeRoleTab === "user"
                  ? "Search by name, email, or college..."
                  : "Search by name or email..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={activeRoleTab === "user" ? 6 : 4} />
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-1">
            <p className="font-semibold text-slate-300">
              No {activeRoleTab === "user" ? "regular users" : "administrators"}{" "}
              found
            </p>
            <p className="text-[11px] text-slate-500">
              {searchQuery
                ? `No accounts matching "${searchQuery}"`
                : `There are currently no ${
                    activeRoleTab === "user" ? "student user" : "administrator"
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
                  <span>
                    Loading more{" "}
                    {activeRoleTab === "user" ? "users" : "administrators"}...
                  </span>
                </div>
              </div>
            }
            endMessage={
              filteredList.length > 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  ✨ All {activeRoleTab === "user" ? "users" : "administrators"}{" "}
                  loaded (
                  {totalResults > 0 ? totalResults : filteredList.length} total)
                </div>
              ) : null
            }
          >
            {/* 1. RESPONSIVE DESKTOP TABLE */}
            <div className="hidden md:block relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
              <table
                className={`w-full text-left text-xs border-collapse ${
                  activeRoleTab === "user" ? "min-w-212.5" : "min-w-162.5"
                }`}
              >
                <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 uppercase tracking-wider text-slate-400 text-[11px] backdrop-blur-md">
                  <tr>
                    <th className="w-16 px-5 py-3.5 font-semibold text-center">
                      Avatar
                    </th>
                    <th className="px-5 py-3.5 font-semibold">Name</th>
                    <th className="px-5 py-3.5 font-semibold">Email</th>
                    {activeRoleTab === "user" && (
                      <>
                        <th className="px-4 py-3.5 font-semibold">College</th>
                        <th className="px-4 py-3.5 font-semibold">Branch</th>
                        <th className="px-4 py-3.5 font-semibold">Year</th>
                      </>
                    )}
                    <th className="px-4 py-3.5 font-semibold">Role</th>
                    <th className="px-5 py-3.5 text-right font-semibold">
                      Actions
                    </th>
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
                      {activeRoleTab === "user" && (
                        <>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            {user.college}
                          </td>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            {user.branch}
                          </td>
                          <td className="px-4 py-4 text-slate-300 whitespace-nowrap">
                            { user.year? 

                            
                              
                              <span className="inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
                              {user.year}
                            </span>:<span></span>}
                          </td>
                        </>
                      )}

                      {/* Role Badge Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.role === "admin" ? (
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
                        {user.role === "user" ? (
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

                    {user.role === "admin" ? (
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
                  {activeRoleTab === "user" && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-300">
                        <GraduationCap
                          size={13}
                          className="text-cyan-400 shrink-0"
                        />
                        <span className="truncate">{user.college}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[11px] text-slate-500 block">
                          Branch
                        </span>
                        <span className="text-slate-300 font-medium truncate">
                          {user.branch}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Year
                        </span>
                        <span className="text-slate-300 font-medium">
                          {user.year}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button: Promote or Demote */}
                  <div className="pt-2 border-t border-slate-800/80">
                    {user.role === "user" ? (
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
                <h3 className="text-lg font-bold text-white">
                  {previewUser.fullName}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {previewUser.email}
                </p>
              </div>

              {/* Profile Details or Role Info */}
              {previewUser.role === "admin" ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 text-center text-slate-300 space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    <ShieldCheck size={13} />
                    Platform Administrator
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Full administrative privileges across Oppora.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-left text-slate-300 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-500/20">
                      <GraduationCap size={12} />
                      Regular Student
                    </span>
                    {previewUser.joinedDate && (
                      <span className="text-[10px] text-slate-500">
                        Joined {previewUser.joinedDate}
                      </span>
                    )}
                  </div>

                  {previewUser.college ||
                  previewUser.branch ||
                  previewUser.year ? (
                    <div className="space-y-1.5 pt-0.5">
                      {previewUser.college && (
                        <p className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-500 text-[11px]">College:</span>{" "}
                          <span className="text-white font-medium truncate">
                            {previewUser.college}
                          </span>
                        </p>
                      )}
                      {previewUser.branch && (
                        <p className="truncate">
                          <span className="text-slate-500 text-[11px]">Branch:</span>{" "}
                          <span className="text-white font-medium">
                            {previewUser.branch}
                          </span>
                        </p>
                      )}
                      {previewUser.year && (
                        <p>
                          <span className="text-slate-500 text-[11px]">Year:</span>{" "}
                          <span className="text-white font-medium">
                            {previewUser.year}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center py-1 text-slate-400 text-xs italic">
                      Student profile details (college, branch) not provided yet.
                    </p>
                  )}
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
                    setPreviewUser(null);
                    navigate("/admin");
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

        {/* Professional Role Toggle Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isActionLoading}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    confirmAction.type === "promote"
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                  }`}
                >
                  {confirmAction.type === "promote" ? (
                    <ShieldCheck size={24} />
                  ) : (
                    <ShieldAlert size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {confirmAction.type === "promote"
                      ? "Promote to Administrator"
                      : "Demote to Regular User"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {confirmAction.type === "promote"
                      ? "Grant full administrative permissions"
                      : "Revoke administrative permissions"}
                  </p>
                </div>
              </div>

              {/* Target User Info Card */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <UserAvatar
                  avatar={confirmAction.user.avatar}
                  name={confirmAction.user.fullName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-sm truncate">
                    {confirmAction.user.fullName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">
                    {confirmAction.user.email}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmAction.type === "promote" ? (
                  <>
                    Are you sure you want to promote{" "}
                    <span className="font-semibold text-white">
                      {confirmAction.user.fullName}
                    </span>{" "}
                    to an Administrator? This account will gain complete access to
                    manage opportunities, users, and platform settings.
                  </>
                ) : (
                  <>
                    Are you sure you want to demote{" "}
                    <span className="font-semibold text-white">
                      {confirmAction.user.fullName}
                    </span>{" "}
                    to a Regular User? They will lose access to all admin tools
                    and move to the standard student users list.
                  </>
                )}
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={isActionLoading}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeRoleToggle}
                  disabled={isActionLoading}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-all shadow-md disabled:opacity-50 ${
                    confirmAction.type === "promote"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
                      : "bg-amber-600 hover:bg-amber-500 shadow-amber-950/40"
                  }`}
                >
                  {isActionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : confirmAction.type === "promote" ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  <span>
                    {isActionLoading
                      ? "Updating..."
                      : confirmAction.type === "promote"
                        ? "Confirm Promotion"
                        : "Confirm Demotion"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed right-4 top-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-top-2 duration-200 ${
              toast.type === "success"
                ? "border-emerald-500/40 bg-slate-900/95 text-emerald-200 ring-1 ring-emerald-500/30"
                : "border-rose-500/40 bg-slate-900/95 text-rose-200 ring-1 ring-rose-500/30"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              )}
            </div>
            <div className="flex-1 text-xs text-slate-200 leading-relaxed font-medium">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
