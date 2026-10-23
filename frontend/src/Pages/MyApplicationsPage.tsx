import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import StudentLayout from "@/components/layout/StudentLayout";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/Skeletons";
import OrganizationLogo from "@/components/shared/OrganizationLogo";
import { type DemoApplication } from "@/types/studentTypesData";
import {
  createApplication,
  deleteApplication,
  getUserApplicationsAndsearchAndfilters,
  search,
  updateApplication,
} from "@/services/opportunityService";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "all" },
  { label: "Internship", value: "intership" }, // Matches backend database spelling
  { label: "Scholarship", value: "scholarship" },
  { label: "Hackathon", value: "hackathon" },
  { label: "Competition", value: "competition" },
  { label: "Fellowship", value: "fellowship" },
  { label: "Research", value: "research" },
  { label: "Open Source", value: "open-source" },
  { label: "Workshop", value: "workshop" },
];

const ORGANISATION_OPTIONS = [
  { label: "All Organisations", value: "all" },
  { label: "Government", value: "government" },
  { label: "Private", value: "private" },
  { label: "University", value: "university" },
  { label: "NGO", value: "ngo" },
  { label: "Start-up", value: "start-up" },
  { label: "Non-Profit", value: "non-profit" },
  { label: "International Organisation", value: "international-organisation" },
];

const APPLICATION_STATUS_OPTIONS: {
  label: string;
  value: DemoApplication["status"] | "all";
}[] = [
  { label: "All Status", value: "all" },
  { label: "Applied", value: "applied" },
  { label: "Under Review", value: "under-review" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Offered", value: "offered" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Withdrawn", value: "withdrawn" },
];

const statuses: DemoApplication["status"][] = [
  "applied",
  "under-review",
  "interviewing",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];

const statusBadgeStyles: Record<
  string,
  { bg: string; dot: string; border: string }
> = {
  applied: {
    bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  "under-review": {
    bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  interviewing: {
    bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    dot: "bg-purple-500",
    border: "border-purple-200 dark:border-purple-800",
  },
  offered: {
    bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  accepted: {
    bg: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    dot: "bg-teal-500",
    border: "border-teal-200 dark:border-teal-800",
  },
  rejected: {
    bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-800",
  },
  withdrawn: {
    bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
  "planning to apply": {
    bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    dot: "bg-sky-500",
    border: "border-sky-200 dark:border-sky-800",
  },
};

const getStatusStyle = (status: string = "") => {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  return (
    statusBadgeStyles[normalized] || {
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      dot: "bg-slate-400",
      border: "border-slate-200 dark:border-slate-700",
    }
  );
};

const formatDate = (isoString?: string) => {
  if (!isoString) return "N/A";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

type TrackApplicationDialogProps = {
  onClose: () => void;
  onSave: (opportunity: any, status: string) => void;
  isSaving?: boolean;
  appliedOpportunityIds?: Set<string>;
};

function TrackApplicationDialog({
  onClose,
  onSave,
  isSaving = false,
  appliedOpportunityIds = new Set(),
}: TrackApplicationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(
    null
  );
  const [status, setStatus] = useState<string>("applied");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let active = true;

    // Do NOT fetch random opportunities if search box is empty
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const fetchSearchOpportunities = async () => {
      setIsSearching(true);
      try {
        const response = await search({
          queryTerm: searchQuery.trim(),
        });

        if (active) {
          const fetchedResults =
            response.data?.data?.results ||
            response.data?.results ||
            response.data?.data ||
            [];
          const list = Array.isArray(fetchedResults) ? fetchedResults : [];

          // Filter out opportunities that have already been applied to
          const unapplied = list.filter(
            (opp: any) => !appliedOpportunityIds.has(opp._id)
          );

          setResults(unapplied);
        }
      } catch {
        // Silently clear results on error
      } finally {
        if (active) setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSearchOpportunities();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, appliedOpportunityIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close track application dialog"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-application-title"
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <h2
            id="track-application-title"
            className="font-semibold text-slate-900 dark:text-white"
          >
            Track an application
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search opportunities by name or organization..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>

          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Search size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                Search for an opportunity
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                Type an opportunity title or organisation name above to track
                your application.
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">
                Searching opportunities...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No new opportunities found matching "{searchQuery}".
              <br />
              <span className="mt-1 inline-block text-[11px] text-slate-500">
                (Opportunities you've already tracked are hidden).
              </span>
            </div>
          ) : (
            <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {results.map((opportunity: any) => (
                <button
                  key={opportunity._id}
                  type="button"
                  onClick={() => setSelectedOpportunity(opportunity)}
                  className={`flex min-h-28 flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                    selectedOpportunity?._id === opportunity._id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-900/20"
                      : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-600 dark:bg-slate-900"
                  }`}
                >
                  <OrganizationLogo
                    src={opportunity.organizationLogo}
                    originalSrc={(opportunity as any).originalLogo}
                    crop={(opportunity as any).logoCrop}
                    organization={opportunity.organization}
                    size="appTable"
                  />
                  <span className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {opportunity.title}
                  </span>
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {opportunity.organization}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedOpportunity && (
            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-700">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                <OrganizationLogo
                  src={selectedOpportunity.organizationLogo}
                  originalSrc={(selectedOpportunity as any).originalLogo}
                  crop={(selectedOpportunity as any).logoCrop}
                  organization={selectedOpportunity.organization}
                  size="card"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedOpportunity.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedOpportunity.organization || "Selected opportunity"}
                  </p>
                </div>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Application status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal capitalize dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                >
                  {statuses.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
        <footer className="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedOpportunity || isSaving}
            onClick={() =>
              selectedOpportunity && onSave(selectedOpportunity, status)
            }
            className="flex-1 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Saving..." : "Save entry"}
          </button>
        </footer>
      </section>
    </div>
  );
}

type ActiveDropdown = "category" | "status" | "organisation" | null;

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<DemoApplication[] | []>([]);
  const [statusFilter, setStatusFilter] = useState<
    DemoApplication["status"] | "all"
  >("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [organizationType, setOrganizationType] = useState<string>("all");
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "undo" | "success" | "error";
    onUndo?: () => void;
  } | null>(null);
  const pendingDeleteTimerRef = useRef<{
    timer: any;
    app: any;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"network" | "server" | "generic">(
    "generic"
  );

  // 1. Initial Load (Page 1): Replaces the list when filters change
  const fetchInitialApplications = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await getUserApplicationsAndsearchAndfilters({
        page: 1,
        limit: 10,
        queryTerm: query.trim() || undefined,
        category: category !== "all" ? category : undefined,
        organizationType:
          organizationType !== "all" ? organizationType : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const results =
        response?.data?.results ||
        response?.data?.data?.results ||
        response?.data ||
        [];

      const total =
        response?.data?.totalResults ??
        response?.data?.data?.totalResults ??
        results.length;

      setApplications(Array.isArray(results) ? results : []);
      setTotalResults(total);
      setPage(1);
      setHasMore(results.length < total);
    } catch (err: any) {
      if (
        err?.code === "ERR_NETWORK" ||
        err?.code === "ECONNABORTED" ||
        !err?.response
      ) {
        setErrorType("network");
      } else if (err?.response?.status >= 500) {
        setErrorType("server");
      } else {
        setErrorType("generic");
      }
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load applications."
      );
    } finally {
      setInitialLoading(false);
    }
  };

  // 2. Next Page Load: Triggered by InfiniteScroll when scrolling down
  const fetchMoreApplications = async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const response = await getUserApplicationsAndsearchAndfilters({
        page: nextPage,
        limit: 10,
        queryTerm: query.trim() || undefined,
        category: category !== "all" ? category : undefined,
        organizationType:
          organizationType !== "all" ? organizationType : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const newResults =
        response?.data?.results ||
        response?.data?.data?.results ||
        response?.data ||
        [];

      if (Array.isArray(newResults) && newResults.length > 0) {
        let reachedEnd = false;
        setApplications((prev) => {
          const existingIds = new Set(prev.map((app) => app._id));
          const uniqueNew = newResults.filter(
            (app: any) => !existingIds.has(app._id)
          );
          const updated = [...prev, ...uniqueNew];
          if (
            updated.length >= totalResults ||
            newResults.length < 10 ||
            uniqueNew.length === 0
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

  // Flush any pending delete when leaving page
  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current.timer);
        deleteApplication(pendingDeleteTimerRef.current.app._id).catch(
          () => {}
        );
      }
    };
  }, []);

  const hasActiveFilters = Boolean(
    query.trim() ||
    category !== "all" ||
    organizationType !== "all" ||
    statusFilter !== "all"
  );

  const fetchApplicationData = async () => {
    try {
      const response = await getUserApplicationsAndsearchAndfilters({
        queryTerm: query.trim() || undefined,
        category: category !== "all" ? category : undefined,
        organizationType:
          organizationType !== "all" ? organizationType : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const results =
        response?.data?.results ||
        response?.data?.data?.results ||
        response?.data ||
        [];

      setApplications(Array.isArray(results) ? results : []);
    } catch {
      // Silently handled
    }
  };

  useEffect(() => {
    fetchInitialApplications();
  }, [query, category, organizationType, statusFilter]);

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setOrganizationType("all");
    setStatusFilter("all");
    setActiveDropdown(null);
  }

  const filtered = useMemo(() => {
    return applications
      .filter((application: any) => {
        if (statusFilter === "all") return true;
        return (
          application.status?.toLowerCase().replace(/\s+/g, "-") ===
          statusFilter.toLowerCase().replace(/\s+/g, "-")
        );
      })
      .sort((first: any, second: any) => {
        const firstDate = first.createdAt || "";
        const secondDate = second.createdAt || "";
        return sortNewest
          ? secondDate.localeCompare(firstDate)
          : firstDate.localeCompare(secondDate);
      });
  }, [applications, statusFilter, sortNewest]);

  const appliedOpportunityIds = useMemo(() => {
    return new Set<string>(
      applications
        .map((app: any) => app.opportunity || app.opportunityDetails?._id)
        .filter(Boolean)
    );
  }, [applications]);

  const counts = statuses.map((s) => ({
    status: s,
    count: applications.filter(
      (app: any) =>
        app.status?.toLowerCase().replace(/\s+/g, "-") ===
        s.toLowerCase().replace(/\s+/g, "-")
    ).length,
  }));

  async function updateStatus(id: string, newStatus: string) {
    // Optimistic UI update
    setApplications((current: any) =>
      current.map((application: any) =>
        application._id === id
          ? { ...application, status: newStatus }
          : application
      )
    );

    try {
      await updateApplication(id, newStatus);
    } catch {
      fetchApplicationData();
    }
  }

  async function addApplication(opportunity: any, chosenStatus: string) {
    try {
      setIsSavingApp(true);
      await createApplication(opportunity._id, chosenStatus);
      setTrackOpen(false);
      await fetchApplicationData();
    } catch {
      // Handled silently
    } finally {
      setIsSavingApp(false);
    }
  }

  function handleRequestDelete(application: any) {
    setItemToDelete(application);
  }

  function handleConfirmDelete() {
    if (!itemToDelete) return;

    // Flush previous pending delete if any
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current.timer);
      deleteApplication(pendingDeleteTimerRef.current.app._id).catch(() => {});
    }

    const appToDelete = itemToDelete;
    const appId = appToDelete._id;
    const appTitle = appToDelete.opportunityDetails?.title || "Application";
    setItemToDelete(null);

    // Optimistically remove from visible state
    setApplications((current: any) =>
      current.filter((app: any) => app._id !== appId)
    );

    // Schedule deletion in backend with 6-second undo window
    const timer = setTimeout(async () => {
      try {
        await deleteApplication(appId);
        pendingDeleteTimerRef.current = null;
      } catch {
        setToast({
          message: "Failed to delete application from server.",
          type: "error",
        });
        fetchApplicationData();
      }
    }, 6000);

    pendingDeleteTimerRef.current = { timer, app: appToDelete };

    // Show professional elastic undo toast
    setToast({
      message: `Deleted "${appTitle}"`,
      type: "undo",
      onUndo: () => {
        if (pendingDeleteTimerRef.current) {
          clearTimeout(pendingDeleteTimerRef.current.timer);
          pendingDeleteTimerRef.current = null;
        }
        setApplications((current: any) => [appToDelete, ...current]);
        setToast({
          message: `Restored "${appTitle}"`,
          type: "success",
        });
        setTimeout(() => setToast(null), 2500);
      },
    });
  }

  const currentCategoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.label || "Category";
  const currentOrgLabel =
    ORGANISATION_OPTIONS.find((o) => o.value === organizationType)?.label ||
    "Organisation";
  const currentStatusLabel =
    APPLICATION_STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ||
    "Status";

  return (
    <StudentLayout activePage="applications">
      {/* Invisible backdrop to dismiss open dropdown on outside click */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {applications.length} tracked · Keep your progress in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTrackOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Track application
          </button>
        </div>

        {/* Application Status Counter Summary Cards */}
        {applications.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {counts.map(({ status: s, count }) => {
              const isSelected = statusFilter.toLowerCase() === s.toLowerCase();
              const style = getStatusStyle(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      statusFilter.toLowerCase() === s.toLowerCase() ? "all" : s
                    )
                  }
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? `${style.bg} ${style.border} ring-2 ring-blue-500/20 shadow-sm`
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800/80"
                  } ${count === 0 ? "opacity-60" : ""}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {count}
                  </span>
                  <span className="truncate w-full text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">
                    {s.replace(/-/g, " ")}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Responsive Professional Filter Bar */}
        {(applications.length > 0 || hasActiveFilters) && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search applications by opportunity or organisation..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Dropdown Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Dropdown */}
                <div className="relative flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "category" ? null : "category"
                      )
                    }
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium transition sm:w-auto ${
                      category !== "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate max-w-32.5">
                      {currentCategoryLabel}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${
                        activeDropdown === "category"
                          ? "rotate-180 text-blue-600"
                          : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === "category" && (
                    <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      {CATEGORY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCategory(option.value);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                            category === option.value
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>{option.label}</span>
                          {category === option.value && (
                            <Check
                              size={14}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Application Status Dropdown */}
                <div className="relative flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "status" ? null : "status"
                      )
                    }
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium transition sm:w-auto ${
                      statusFilter !== "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate max-w-30 capitalize">
                      {currentStatusLabel}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${
                        activeDropdown === "status"
                          ? "rotate-180 text-blue-600"
                          : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === "status" && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      {APPLICATION_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(option.value);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs capitalize transition ${
                            statusFilter === option.value
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>{option.label}</span>
                          {statusFilter === option.value && (
                            <Check
                              size={14}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Organisation Type Dropdown */}
                <div className="relative flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "organisation"
                          ? null
                          : "organisation"
                      )
                    }
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium transition sm:w-auto ${
                      organizationType !== "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate max-w-32.5 capitalize">
                      {currentOrgLabel}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${
                        activeDropdown === "organisation"
                          ? "rotate-180 text-blue-600"
                          : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === "organisation" && (
                    <div className="absolute right-0 top-full z-30 mt-2 max-h-64 w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      {ORGANISATION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setOrganizationType(option.value);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs capitalize transition ${
                            organizationType === option.value
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>{option.label}</span>
                          {organizationType === option.value && (
                            <Check
                              size={14}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-400">
                  Filters:
                </span>

                {query && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Search: "{query}"
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {category !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Category: {currentCategoryLabel}
                    <button
                      type="button"
                      onClick={() => setCategory("all")}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {organizationType !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs capitalize text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Org: {currentOrgLabel}
                    <button
                      type="button"
                      onClick={() => setOrganizationType("all")}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs capitalize text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    Status: {currentStatusLabel}
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className="text-purple-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Applications Content: Skeleton, Error, Empty State, or Table */}
        {initialLoading ? (
          <div className="mt-8">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : error && applications.length === 0 ? (
          <div className="mt-8">
            <ErrorState
              type={errorType}
              title="Unable to load applications"
              message={error}
              onRetry={fetchInitialApplications}
            />
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={ClipboardList}
              title={
                hasActiveFilters
                  ? "No matching applications"
                  : "No applications tracked yet"
              }
              description={
                hasActiveFilters
                  ? "Try clearing your filters or search terms."
                  : "Track an opportunity to keep track of deadlines and status."
              }
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTrackOpen(true)}
                    className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Track first application
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Table Meta Bar (Count + Sort) */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {filtered.length}
                </span>{" "}
                of {applications.length} applications
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ArrowUpDown size={13} />
                  {sortNewest ? "Newest first" : "Oldest first"}
                  <ChevronDown size={13} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSortNewest(true);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Newest first
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortNewest(false);
                        setSortOpen(false);
                      }}
                      className="block w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Oldest first
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Table */}
            <InfiniteScroll
              dataLength={applications.length}
              next={fetchMoreApplications}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                </div>
              }
              endMessage={
                applications.length > 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    You've reached the end of your applications.
                  </p>
                ) : null
              }
            >
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80">
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Opportunity</th>
                        <th className="px-4 py-3.5">Application Status</th>
                        <th className="px-4 py-3.5">Applied Date</th>
                        <th className="px-4 py-3.5">Deadline</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-xs text-slate-400"
                          >
                            No applications match the selected status or
                            filters.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((application: any) => {
                          const opportunity =
                            application.opportunityDetails || {};
                          const currentStyle = getStatusStyle(
                            application.status
                          );

                          return (
                            <tr
                              key={application._id}
                              className="transition-colors hover:bg-blue-50/30 dark:hover:bg-slate-700/30"
                            >
                              {/* Opportunity Column with Organisation Type */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <OrganizationLogo
                                    src={opportunity.organizationLogo}
                                    originalSrc={
                                      (opportunity as any).originalLogo
                                    }
                                    crop={(opportunity as any).logoCrop}
                                    organization={opportunity.organization}
                                    initials={opportunity.initials}
                                    size="card"
                                  />
                                  <div className="min-w-0 max-w-sm">
                                    <p className="truncate text-[11px] font-medium text-slate-400 dark:text-slate-400">
                                      {opportunity.organization ||
                                        "Organization"}
                                    </p>
                                    <Link
                                      to={`/opportunities/${opportunity._id || application.opportunity}`}
                                      className="block truncate font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                                    >
                                      {opportunity.title ||
                                        "Untitled Opportunity"}
                                    </Link>

                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      {/* Category tag */}
                                      {opportunity.category && (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                          {opportunity.category === "intership"
                                            ? "internship"
                                            : opportunity.category}
                                        </span>
                                      )}

                                      {/* Organisation Type Badge */}
                                      {opportunity.organizationType && (
                                        <span className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                                          {opportunity.organizationType.replace(
                                            /-/g,
                                            " "
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Status Selector Column */}
                              <td className="px-4 py-4">
                                <select
                                  value={application.status}
                                  onChange={(event) =>
                                    updateStatus(
                                      application._id,
                                      event.target.value
                                    )
                                  }
                                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold capitalize outline-none transition ${currentStyle.bg} ${currentStyle.border}`}
                                >
                                  {statuses.map((s) => (
                                    <option
                                      key={s}
                                      value={s}
                                      className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                      {s.replace(/-/g, " ")}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Applied Date */}
                              <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {formatDate(application.createdAt)}
                              </td>

                              {/* Deadline */}
                              <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  <Calendar
                                    size={12}
                                    className="text-slate-400"
                                  />
                                  {formatDate(opportunity.deadline)}
                                </span>
                              </td>

                              {/* Actions: Delete Button */}
                              <td className="px-4 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRequestDelete(application)
                                  }
                                  title="Delete application"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}

                <div className="flex flex-col gap-3 p-3 md:hidden">
                  {filtered.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No applications match the selected status or filters.
                    </div>
                  ) : (
                    filtered.map((application: any) => {
                      const opportunity = application.opportunityDetails || {};
                      const currentStyle = getStatusStyle(application.status);

                      return (
                        <article
                          key={application._id}
                          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div className="flex items-start gap-3">
                            <OrganizationLogo
                              src={opportunity.organizationLogo}
                              originalSrc={(opportunity as any).originalLogo}
                              crop={(opportunity as any).logoCrop}
                              organization={opportunity.organization}
                              initials={opportunity.initials}
                              size="card"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-medium text-slate-400">
                                {opportunity.organization || "Organization"}
                              </p>
                              <Link
                                to={`/opportunities/${opportunity._id || application.opportunity}`}
                                className="mt-0.5 block truncate text-sm font-semibold text-slate-900 dark:text-white"
                              >
                                {opportunity.title || "Untitled Opportunity"}
                              </Link>

                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {opportunity.category && (
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {opportunity.category === "intership"
                                      ? "internship"
                                      : opportunity.category}
                                  </span>
                                )}

                                {opportunity.organizationType && (
                                  <span className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                                    {opportunity.organizationType.replace(
                                      /-/g,
                                      " "
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                            <select
                              value={application.status}
                              onChange={(event) =>
                                updateStatus(
                                  application._id,
                                  event.target.value
                                )
                              }
                              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold capitalize outline-none transition ${currentStyle.bg} ${currentStyle.border}`}
                            >
                              {statuses.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                  {s.replace(/-/g, " ")}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                <Calendar
                                  size={12}
                                  className="text-slate-400"
                                />
                                {formatDate(opportunity.deadline)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRequestDelete(application)}
                                title="Delete application"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </InfiniteScroll>
          </>
        )}
      </main>

      {/* Track Application Dialog */}
      {trackOpen && (
        <TrackApplicationDialog
          onClose={() => setTrackOpen(false)}
          onSave={addApplication}
          isSaving={isSavingApp}
          appliedOpportunityIds={appliedOpportunityIds}
        />
      )}

      {/* Elastic Professional Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setItemToDelete(null)}
            aria-hidden="true"
          />

          {/* Elastic Spring Modal Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-950/30">
                <Trash2 size={22} className="animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Application?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    "
                    {itemToDelete.opportunityDetails?.title ||
                      "this opportunity"}
                    "
                  </span>{" "}
                  from your tracker? You will be able to undo this immediately.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-rose-600 to-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-700 hover:to-red-700"
              >
                <Trash2 size={14} />
                Delete application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elastic Floating Notification / Undo Toast */}
      {toast && (
        <aside
          aria-label="Notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in slide-in-from-bottom-5 dark:border-slate-700 dark:bg-slate-800/95"
        >
          {toast.type === "undo" ? (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0 max-w-50 sm:max-w-xs">
                <p className="truncate text-xs font-medium text-slate-200">
                  {toast.message}
                </p>
              </div>
              {toast.onUndo && (
                <button
                  type="button"
                  onClick={toast.onUndo}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
                >
                  <Undo2 size={13} />
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (pendingDeleteTimerRef.current) {
                    clearTimeout(pendingDeleteTimerRef.current.timer);
                    deleteApplication(
                      pendingDeleteTimerRef.current.app._id
                    ).catch(() => {});
                    pendingDeleteTimerRef.current = null;
                  }
                  setToast(null);
                }}
                className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          ) : toast.type === "success" ? (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-medium text-slate-200">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <AlertCircle size={16} />
              </div>
              <p className="text-xs font-medium text-slate-200">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          )}
        </aside>
      )}
    </StudentLayout>
  );
}
