import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import OrganizationLogo from "@/components/shared/OrganizationLogo";
import { TableSkeleton } from "@/components/shared/Skeletons";
import {
  type IOpportunity,
  type PublicationStatus,
} from "@/types/studentTypesData";
import {
  deleteOpportunity as apiDeleteOpportunity,
  editOpportunity as apiEditOpportunity,
  apiGetOpportunityStats,
  search as apiSearchOpportunities,
} from "@/services/opportunityService";

export default function AdminOpportunitiesPage() {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT: REAL OPPORTUNITIES ONLY (NO DUMMY / MOCK SEEDING)
  // =========================================================================
  const [opportunities, setOpportunities] = useState<IOpportunity[]>(() => {
    try {
      const saved = localStorage.getItem("admin_managed_opportunities");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock demo IDs if present
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (o) => !["opp-101", "opp-102", "opp-103", "opp-104"].includes(o._id)
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [databaseTotalCount, setDatabaseTotalCount] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // Application status
  const [publicationFilter, setPublicationFilter] = useState<
    "all" | "draft" | "published"
  >("all");

  // Debounce search query to avoid spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tracks which opportunity is selected for deletion (null = modal closed)
  const [opportunityToDelete, setOpportunityToDelete] =
    useState<IOpportunity | null>(null);

  // Tracks which opportunity is selected for publication confirmation (null = modal closed)
  const [opportunityToPublish, setOpportunityToPublish] =
    useState<IOpportunity | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Feedback Toast Notification (auto-dismissed)
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Auto-dismiss toast notification after 4.5 seconds
  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  const saveToStorage = (updated: IOpportunity[]) => {
    setOpportunities(updated);
    localStorage.setItem(
      "admin_managed_opportunities",
      JSON.stringify(updated)
    );
  };

  // =========================================================================
  // [FETCH TOTAL OPPORTUNITIES PRESENT IN DATABASE FROM STATS API]
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    const fetchTotalCount = async () => {
      try {
        const statsRes = await apiGetOpportunityStats();
        const dbTotal =
          statsRes?.data?.totalOpportunities ??
          statsRes?.totalOpportunities ??
          0;
        if (isMounted && dbTotal > 0) {
          setDatabaseTotalCount(dbTotal);
        }
      } catch {
        // Silently use defaults
      }
    };

    fetchTotalCount();

    // Re-fetch count when any opportunity is created, edited, or deleted
    const handleOpportunityChange = () => {
      fetchTotalCount();
    };
    window.addEventListener("opportunity-updated", handleOpportunityChange);
    window.addEventListener("storage", handleOpportunityChange);

    return () => {
      isMounted = false;
      window.removeEventListener(
        "opportunity-updated",
        handleOpportunityChange
      );
      window.removeEventListener("storage", handleOpportunityChange);
    };
  }, []);

  // =========================================================================
  // [BACKEND API INTEGRATION POINT 1: FETCH OPPORTUNITIES WITH FILTERS]
  // =========================================================================
  // Hits GET /opportunity/search via opportunityService.search()
  useEffect(() => {
    let isMounted = true;

    const fetchLiveOpportunities = async () => {
      try {
        setIsLoading(true);
        const res = await apiSearchOpportunities({
          page: 1,
          limit: 20,
          queryTerm: debouncedSearch.trim() || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          sourceStatus:
            statusFilter === "closed"
              ? "expired"
              : statusFilter === "active"
                ? "live"
                : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          publicationStatus:
            publicationFilter !== "all" ? publicationFilter : undefined,
        });

        // Robust results extraction matching backend ApiResponse structure
        const liveList =
          res?.data?.results ||
          res?.data?.data?.results ||
          res?.results ||
          (Array.isArray(res?.data) ? res.data : []);

        const total =
          res?.data?.totalResults ??
          res?.data?.data?.totalResults ??
          res?.totalResults ??
          (Array.isArray(liveList) ? liveList.length : 0);

        if (isMounted && Array.isArray(liveList)) {
          setOpportunities(liveList);
          setTotalResults(total);
          setPage(1);
          setHasMore(liveList.length < total && liveList.length > 0);
          localStorage.setItem(
            "admin_managed_opportunities",
            JSON.stringify(liveList)
          );
        }
      } catch {
        // Backend API unreachable or error, using local fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveOpportunities();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, categoryFilter, statusFilter, publicationFilter]);

  // =========================================================================
  // [INFINITE SCROLL: FETCH NEXT PAGE FROM SERVER DATABASE]
  // =========================================================================
  const fetchMoreLiveOpportunities = async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const res = await apiSearchOpportunities({
        page: nextPage,
        limit: 20,
        queryTerm: debouncedSearch.trim() || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        sourceStatus:
          statusFilter === "closed"
            ? "expired"
            : statusFilter === "active"
              ? "live"
              : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        publicationStatus:
          publicationFilter !== "all" ? publicationFilter : undefined,
      });

      const newResults =
        res?.data?.results ||
        res?.data?.data?.results ||
        res?.results ||
        (Array.isArray(res?.data) ? res.data : []);

      const total =
        res?.data?.totalResults ??
        res?.data?.data?.totalResults ??
        res?.totalResults ??
        totalResults;

      if (Array.isArray(newResults) && newResults.length > 0) {
        let reachedEnd = false;
        setOpportunities((prev) => {
          const existingIds = new Set(prev.map((o) => o._id));
          const uniqueNew = newResults.filter((o) => !existingIds.has(o._id));
          const updated = [...prev, ...uniqueNew];

          if (
            updated.length >= total ||
            newResults.length < 20 ||
            uniqueNew.length === 0
          ) {
            reachedEnd = true;
          }
          localStorage.setItem(
            "admin_managed_opportunities",
            JSON.stringify(updated)
          );
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

  // =========================================================================
  // [BACKEND API INTEGRATION POINT 2: DELETE OPPORTUNITY]
  // =========================================================================
  // Hits DELETE /opportunity/:id via opportunityService.deleteOpportunity()
  // Triggered when user confirms deletion in the modal
  const handleConfirmDelete = async () => {
    if (!opportunityToDelete) return;

    const id = opportunityToDelete._id;

    // 1. Optimistic update: Remove from screen immediately
    const updated = opportunities.filter((o) => o._id !== id);
    saveToStorage(updated);

    // 2. Close modal
    setOpportunityToDelete(null);

    // 3. Delete from backend database
    try {
      await apiDeleteOpportunity(id);
    } catch {
      // Silently keep local state or let user retry
    }
  };

  // =========================================================================
  // [BACKEND API INTEGRATION POINT 3: CONFIRM & PUBLISH DRAFT OPPORTUNITY]
  // =========================================================================
  // Hits PATCH /opportunity/:id via opportunityService.apiEditOpportunity()
  const handleConfirmPublish = async () => {
    if (!opportunityToPublish) return;
    const targetId = opportunityToPublish._id;
    const targetTitle = opportunityToPublish.title;

    setIsPublishing(true);

    try {
      // 1. Call Backend API to update status to active and publicationStatus to published
      await apiEditOpportunity(targetId, {
        status: "active",
        publicationStatus: "published",
      });

      // 2. Optimistic & Local Storage update
      const updated = opportunities.map((o) => {
        if (o._id === targetId) {
          return {
            ...o,
            publicationStatus: "published" as PublicationStatus,
            status: "active",
            updatedAt: new Date().toISOString(),
          } as IOpportunity;
        }
        return o;
      });
      saveToStorage(updated);

      // 3. Display good success message in frontend
      setFeedbackToast({
        type: "success",
        title: "Opportunity Published Successfully!",
        message: `"${targetTitle}" is now live and visible to students in the directory.`,
      });

      // 4. Close the confirmation alert modal
      setOpportunityToPublish(null);
    } catch (err: any) {
      setFeedbackToast({
        type: "error",
        title: "Publish Failed",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to publish opportunity. Please check backend connection and try again.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Quick toggle helper for publication status
  const handleToggleStatus = async (id: string) => {
    const target = opportunities.find((o) => o._id === id);
    if (!target) return;

    const isCurrentlyDraft =
      target.publicationStatus === "draft" || target.status === "draft";

    // If currently draft, open the confirmation alert modal per requirements
    if (isCurrentlyDraft) {
      setOpportunityToPublish(target);
      return;
    }

    // If currently published, moving back to draft
    const nextPubStatus: PublicationStatus = "draft";
    const nextStatus = "draft";

    // Optimistic UI state update
    const updated = opportunities.map((o) => {
      if (o._id === id) {
        return {
          ...o,
          publicationStatus: nextPubStatus,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        } as IOpportunity;
      }
      return o;
    });
    saveToStorage(updated);

    // Backend API Call
    try {
      await apiEditOpportunity(id, {
        publicationStatus: nextPubStatus,
        status: nextStatus,
      });
      setFeedbackToast({
        type: "success",
        title: "Status Updated",
        message: `"${target.title}" moved back to draft.`,
      });
    } catch {
      setFeedbackToast({
        type: "error",
        title: "Status Sync Failed",
        message: "Could not sync status change with the backend.",
      });
    }
  };

  // Format date helper
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Helper to normalize category comparison across database variants ('intership' vs 'internship', 'open-source' vs 'open source')
  const normalizeCategory = (cat?: string): string => {
    if (!cat) return "";
    const lower = cat.toLowerCase().trim();
    if (lower === "internship" || lower === "intership") return "internship";
    if (lower === "open source" || lower === "open-source") return "open-source";
    return lower;
  };

  // Helper to determine if an opportunity is closed or expired (by sourceStatus, status, or passed deadline)
  const isOpportunityClosedOrExpired = (opp: IOpportunity): boolean => {
    if (
      opp.sourceStatus === "expired" ||
      opp.status === "closed" ||
      (opp as any).status === "expired" ||
      (opp as any).sourceStatus === "closed"
    ) {
      return true;
    }
    if (opp.sourceStatus === "live") {
      return false;
    }
    if (opp.deadline) {
      const d = new Date(opp.deadline);
      if (!isNaN(d.getTime())) {
        return d.getTime() < Date.now();
      }
    }
    return false;
  };

  // Helper to get formatted status badge info: 'Live' or 'Closed / Expired'
  const getOpportunityStatusBadge = (opp: IOpportunity) => {
    const isClosed = isOpportunityClosedOrExpired(opp);
    if (isClosed) {
      return {
        label: "Closed / Expired",
        badgeClass: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
        dotClass: "bg-rose-400",
      };
    }
    return {
      label: "Live",
      badgeClass:
        "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
      dotClass: "bg-emerald-400",
    };
  };

  // Filtered & Sorted dataset
  const filtered = useMemo(() => {
    const list = opportunities.filter((o) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (o.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.organization || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (o.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (o.category || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesCat =
        categoryFilter === "all" ||
        normalizeCategory(o.category) === normalizeCategory(categoryFilter);

      const currentPubStatus: PublicationStatus =
        o.publicationStatus || (o.status === "draft" ? "draft" : "published");
      const matchesPub =
        publicationFilter === "all" || currentPubStatus === publicationFilter;

      // Application status filter:
      // 'all' -> all application statuses
      // 'active' -> live opportunities (not expired/closed)
      // 'closed' -> closed or expired opportunities (by sourceStatus, status, or past deadline)
      const isClosed = isOpportunityClosedOrExpired(o);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !isClosed) ||
        (statusFilter === "closed" && isClosed);

      return matchesSearch && matchesCat && matchesPub && matchesStatus;
    });

    return list;
  }, [
    opportunities,
    searchQuery,
    categoryFilter,
    publicationFilter,
    statusFilter,
  ]);

  return (
    <AdminLayout activeTab="opportunities">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Briefcase size={22} className="text-blue-500" />
              Opportunity Catalog Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete opportunity management: search, filter application &
              publication states, and edit opportunities.
            </p>
          </div>
          <Link
            to="/admin/create-opportunity"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Add Opportunity</span>
          </Link>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by opportunity title or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 2. Application Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Application Statuses</option>
                <option value="active">Live</option>
                <option value="closed">Closed / Expired</option>
              </select>
            </div>

            {/* 3. Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Scholarship">Scholarship</option>
                <option value="internship">Internship</option>
                <option value="fellowship">Fellowship</option>
                <option value="open-source">Open Source</option>
                <option value="hackathon">Hackathon</option>
                <option value="competition">Competition</option>
                <option value="research">Research</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            {/* 4. Publication Status Filter */}
            <div>
              <select
                value={publicationFilter}
                onChange={(e) => setPublicationFilter(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Drafts and published</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Results Count Bar: Displays total opportunities present in the database */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <div>
              {debouncedSearch ||
              categoryFilter !== "all" ||
              statusFilter !== "all" ||
              publicationFilter !== "all" ? (
                <>
                  Found{" "}
                  <span className="font-semibold text-white">
                    {filtered.length}
                  </span>{" "}
                  matching{" "}
                  {filtered.length === 1 ? "opportunity" : "opportunities"} (Total{" "}
                  <span className="font-semibold text-white">
                    {databaseTotalCount > 0
                      ? databaseTotalCount
                      : totalResults > 0
                        ? totalResults
                        : filtered.length}
                  </span>{" "}
                  present in the database)
                </>
              ) : (
                <>
                  Total{" "}
                  <span className="font-semibold text-white">
                    {databaseTotalCount > 0
                      ? databaseTotalCount
                      : totalResults > 0
                        ? totalResults
                        : filtered.length}
                  </span>{" "}
                  {(databaseTotalCount > 0
                    ? databaseTotalCount
                    : totalResults > 0
                      ? totalResults
                      : filtered.length) === 1
                    ? "opportunity"
                    : "opportunities"}{" "}
                  present in the database
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-2.5 px-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-center text-xs text-cyan-300 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Syncing opportunities from server database...</span>
          </div>
        )}

        {/* AUTOMATIC INFINITE SCROLL CONTAINER (Seamless Window Scroll for both Desktop Table & Mobile Cards) */}
        {filtered.length > 0 && (
          <InfiniteScroll
            dataLength={filtered.length}
            next={fetchMoreLiveOpportunities}
            hasMore={hasMore}
            scrollThreshold={0.8}
            loader={
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-cyan-300 shadow backdrop-blur-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  <span>Loading more opportunities...</span>
                </div>
              </div>
            }
            endMessage={
              filtered.length > 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  ✨ All opportunities loaded (
                  {databaseTotalCount > 0
                    ? databaseTotalCount
                    : totalResults > 0
                      ? totalResults
                      : filtered.length}{" "}
                  total in database)
                </div>
              ) : null
            }
          >
            {/* 1. RESPONSIVE DESKTOP TABLE */}
            <div className="hidden md:block relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs min-w-230 border-collapse">
                <thead className="border-b border-slate-800 bg-slate-900/95 uppercase tracking-wider text-slate-400 text-[11px] backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">
                      Opportunity & Organization
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Category</th>
                    <th className="px-4 py-3.5 font-semibold">
                      Application Status
                    </th>
                    <th className="px-4 py-3.5 font-semibold">
                      Publication Status
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Deadline</th>
                    <th className="px-4 py-3.5 font-semibold">Created Date</th>
                    <th className="px-4 py-3.5 font-semibold">Updated Date</th>
                    <th className="px-5 py-3.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filtered.map((opp) => {
                    const currentPubStatus: PublicationStatus =
                      opp.publicationStatus ||
                      (opp.status === "draft" ? "draft" : "published");
                    const isPublished = currentPubStatus === "published";

                    return (
                      <tr
                        key={opp._id}
                        className="transition-colors group hover:bg-slate-800/40"
                      >
                        {/* Cropped Organization Logo + Opportunity Title + Organization Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <OrganizationLogo
                              src={opp.organizationLogo}
                              originalSrc={opp.originalLogo}
                              crop={opp.logoCrop}
                              organization={opp.organization}
                              size="adminTable"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-white text-[13px] leading-tight truncate max-w-xs group-hover:text-blue-300 transition-colors">
                                {opp.title}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                                <span className="font-medium text-slate-300">
                                  {opp.organization}
                                </span>
                                <span>•</span>
                                <span>{opp.location || "Remote"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-block rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-500/20 capitalize">
                            {opp.category === "intership"
                              ? "Internship"
                              : opp.category}
                          </span>
                        </td>

                        {/* Application Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {(() => {
                            const statusInfo = getOpportunityStatusBadge(opp);
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize ${statusInfo.badgeClass}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}
                                />
                                <span>{statusInfo.label}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* Publication Status (Draft / Published with quick toggle) */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(opp._id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                              isPublished
                                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20"
                            }`}
                            title="Click to toggle publication status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isPublished
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-amber-400"
                              }`}
                            />
                            <span>{isPublished ? "Published" : "Draft"}</span>
                          </button>
                        </td>

                        {/* Deadline */}
                        <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDateDisplay(opp.deadline)}</span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-500" />
                            <span>{formatDateDisplay(opp.createdAt)}</span>
                          </div>
                        </td>

                        {/* Updated Date */}
                        <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-500" />
                            <span>{formatDateDisplay(opp.updatedAt)}</span>
                          </div>
                        </td>

                        {/* Actions: Publish (if draft), Edit & Delete */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPublished && (
                              <button
                                type="button"
                                onClick={() => setOpportunityToPublish(opp)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300 transition-all shadow-sm shadow-emerald-950/20"
                                title="Publish Opportunity (Live for Students)"
                              >
                                <UploadCloud size={13} />
                                <span>Publish</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/opportunities/edit/${opp._id}`)
                              }
                              className="rounded-lg border border-slate-700/60 bg-slate-800/80 p-2 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                              title="Edit Opportunity (Full Form)"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setOpportunityToDelete(opp)}
                              className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/20 transition-colors"
                              title="Delete Opportunity"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. RESPONSIVE MOBILE OPPORTUNITY CARDS */}
            <div className="md:hidden space-y-3.5">
              {filtered.map((opp) => {
                const currentPubStatus: PublicationStatus =
                  opp.publicationStatus ||
                  (opp.status === "draft" ? "draft" : "published");
                const isPublished = currentPubStatus === "published";

                return (
                  <div
                    key={opp._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3.5 transition-all"
                  >
                    {/* Card Top Row: Logo, Title & Org, Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <OrganizationLogo
                          src={opp.organizationLogo}
                          originalSrc={opp.originalLogo}
                          crop={opp.logoCrop}
                          organization={opp.organization}
                          size="card"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm leading-snug truncate">
                            {opp.title}
                          </h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {opp.organization} • {opp.location || "Remote"}
                          </p>
                        </div>
                      </div>

                      {/* Actions: Publish, Edit, Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => setOpportunityToPublish(opp)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-all"
                            title="Publish Opportunity"
                          >
                            <UploadCloud size={13} />
                            <span>Publish</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/opportunities/edit/${opp._id}`)
                          }
                          className="rounded-lg border border-slate-700/60 bg-slate-800 p-2 text-slate-300 hover:text-white"
                          title="Edit Opportunity"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpportunityToDelete(opp)}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                          title="Delete Opportunity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Status Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <span className="rounded-lg bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-500/20 capitalize">
                        {opp.category === "intership"
                          ? "Internship"
                          : opp.category}
                      </span>

                      {(() => {
                        const statusInfo = getOpportunityStatusBadge(opp);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium capitalize ${statusInfo.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}
                            />
                            <span>{statusInfo.label}</span>
                          </span>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(opp._id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isPublished
                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPublished ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        <span>{isPublished ? "Published" : "Draft"}</span>
                      </button>
                    </div>

                    {/* Dates Information Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar
                          size={12}
                          className="text-amber-400 shrink-0"
                        />
                        <span className="truncate">
                          Deadline: {formatDateDisplay(opp.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500 shrink-0" />
                        <span className="truncate">
                          Created: {formatDateDisplay(opp.createdAt)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock size={11} className="text-slate-600 shrink-0" />
                        <span>
                          Last updated: {formatDateDisplay(opp.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
        )}

        {/* Loading Skeleton */}
        {isLoading && opportunities.length === 0 ? (
          <div className="py-4">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Briefcase size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                {opportunities.length === 0
                  ? "No opportunities in database yet"
                  : "No opportunities match your filter"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {opportunities.length === 0
                  ? "Get started by creating your first opportunity listing or sync with your backend database."
                  : "Try clearing your search query or switching filters to see more results."}
              </p>
            </div>
            {opportunities.length === 0 && (
              <Link
                to="/admin/create-opportunity"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus size={15} />
                <span>Add Opportunity</span>
              </Link>
            )}
          </div>
        ) : null}

        {/* PROFESSIONAL DELETE CONFIRMATION MODAL */}
        {opportunityToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-rose-950/30 space-y-5">
              {/* Warning Icon & Heading */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Delete Opportunity Listing?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Are you sure you want to delete this listing? This action is
                    permanent and will remove it from the student portal and
                    database.
                  </p>
                </div>
              </div>

              {/* Target Opportunity Preview Card */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex items-center gap-3">
                <OrganizationLogo
                  src={opportunityToDelete.organizationLogo}
                  originalSrc={opportunityToDelete.originalLogo}
                  crop={opportunityToDelete.logoCrop}
                  organization={opportunityToDelete.organization}
                  size="card"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {opportunityToDelete.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {opportunityToDelete.organization} •{" "}
                    {opportunityToDelete.category}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpportunityToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all"
                >
                  Delete opportunity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFESSIONAL PUBLISH CONFIRMATION MODAL / ALERT */}
        {opportunityToPublish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-emerald-950/20 space-y-5">
              {/* Header Icon & Question */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Publish Opportunity?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Do you want to publish it? This will immediately make it
                    active and visible to all students in the opportunity
                    directory.
                  </p>
                </div>
              </div>

              {/* Target Opportunity Preview Card */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center gap-3">
                <OrganizationLogo
                  src={opportunityToPublish.organizationLogo}
                  originalSrc={opportunityToPublish.originalLogo}
                  crop={opportunityToPublish.logoCrop}
                  organization={opportunityToPublish.organization}
                  size="card"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {opportunityToPublish.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="truncate">
                      {opportunityToPublish.organization}
                    </span>
                    <span>•</span>
                    <span className="capitalize text-cyan-400 font-medium">
                      {opportunityToPublish.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => setOpportunityToPublish(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handleConfirmPublish}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Yes, Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TOAST NOTIFICATION / ALERT */}
        {feedbackToast && (
          <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
            <div
              className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5 ${
                feedbackToast.type === "success"
                  ? "border-emerald-500/30 bg-slate-900/95 text-white shadow-emerald-950/40 ring-1 ring-emerald-500/20"
                  : "border-rose-500/30 bg-slate-900/95 text-white shadow-rose-950/40 ring-1 ring-rose-500/20"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  feedbackToast.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {feedbackToast.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-white">
                  {feedbackToast.title}
                </p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {feedbackToast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
