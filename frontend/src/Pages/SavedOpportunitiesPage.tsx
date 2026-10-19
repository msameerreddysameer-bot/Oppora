import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";
import { Bookmark, Check, ChevronDown, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "@/components/layout/StudentLayout";
import EmptyState from "@/components/shared/EmptyState";
import OpportunityCard from "@/components/student/OpportunityCard";
import {
  type ISavedOpportunity,
  type OpportunityorganizationType,
  type OpportunitySourceStatus,
} from "@/demo/studentDemoData";
import {
  getSavedOpportunitiesByUserIdAndSearch,
  unSaveOpportunity,
} from "@/services/opportunityService";

const CATEGORY_OPTIONS = [
  "all",
  "Scholarship",
  "internship",
  "hackathon",
  "competition",
  "fellowship",
  "research",
  "open Source",
  "workshop",
];

const ORGANISATION_OPTIONS: Array<OpportunityorganizationType | "all"> = [
  "all",
  "government",
  "private",
  "university",
  "nGO",
  "start-up",
  "non-Profit",
  "international organisation",
];

const SOURCE_OPTIONS: Array<OpportunitySourceStatus | "all"> = [
  "all",
  "live",
  "expired",
];

type ActiveDropdown = "category" | "status" | "organisation" | null;

export default function SavedOpportunitiesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [organizationType, setOrganizationType] = useState<
    OpportunityorganizationType | "all"
  >("all");
  const [sourceStatus, setSourceStatus] = useState<
    OpportunitySourceStatus | "all"
  >("all");
  const [savedOpportunitiesList, setSavedopportunitiesList] = useState<
    ISavedOpportunity[]
  >([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  // -------------------------------------------------------------
  // INFINITE SCROLL & PAGINATION STATES
  // -------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const hasActiveFilters = Boolean(
    query.trim() ||
      category !== "all" ||
      organizationType !== "all" ||
      sourceStatus !== "all"
  );

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setOrganizationType("all");
    setSourceStatus("all");
    setActiveDropdown(null);
  }

  // Handle removing a saved item with optimistic total count update
  const handleUnsave = async (opportunityId: string) => {
    try {
      await unSaveOpportunity(opportunityId);

      setSavedopportunitiesList((prev) =>
        prev.filter((item) => item.opportunityDetails._id !== opportunityId)
      );
      setTotalResults((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to unsave opportunity:", error);
    }
  };

  // -------------------------------------------------------------
  // 1. INITIAL LOAD & FILTER CHANGES (Page 1)
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const fetchInitialSavedOpportunities = async () => {
      try {
        console.log("Saved: Fetching page 1 with filters:", {
          query,
          category,
          organizationType,
          sourceStatus,
        });

        const response = await getSavedOpportunitiesByUserIdAndSearch({
          page: 1,
          limit: 10,
          queryTerm: query.trim() || undefined,
          category: category !== "all" ? category : undefined,
          organizationType:
            organizationType !== "all" ? organizationType : undefined,
          sourceStatus: sourceStatus !== "all" ? sourceStatus : undefined,
        });

        console.log("Saved: Page 1 API response:", response);

        const results =
          response?.data?.results ||
          response?.data?.data?.results ||
          response?.data ||
          [];

        const total =
          response?.data?.totalResults ||
          response?.data?.data?.totalResults ||
          response?.totalResults ||
          (Array.isArray(results) ? results.length : 0);

        if (active) {
          const list = Array.isArray(results) ? results : [];
          setSavedopportunitiesList(list);
          setTotalResults(total);
          setPage(1);
          // Enable infinite scroll if more items remain to be loaded
          setHasMore(list.length < total && list.length >= 10);
        }
      } catch (error) {
        console.error("Saved: Failed to fetch initial saved opportunities:", error);
        if (active) {
          setSavedopportunitiesList([]);
          setHasMore(false);
        }
      } finally {
        if (active) {
          setInitialLoaded(true);
        }
      }
    };

    fetchInitialSavedOpportunities();

    return () => {
      active = false;
    };
  }, [query, category, organizationType, sourceStatus]);

  // -------------------------------------------------------------
  // 2. INFINITE SCROLL: FETCH NEXT PAGE
  // -------------------------------------------------------------
  const fetchMoreSavedOpportunities = async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      console.log(`Saved: Fetching page ${nextPage}...`);
      const response = await getSavedOpportunitiesByUserIdAndSearch({
        page: nextPage,
        limit: 10,
        queryTerm: query.trim() || undefined,
        category: category !== "all" ? category : undefined,
        organizationType:
          organizationType !== "all" ? organizationType : undefined,
        sourceStatus: sourceStatus !== "all" ? sourceStatus : undefined,
      });

      console.log(`Saved: Page ${nextPage} API response:`, response);

      const newResults =
        response?.data?.results ||
        response?.data?.data?.results ||
        response?.data ||
        [];

      const total =
        response?.data?.totalResults ||
        response?.data?.data?.totalResults ||
        response?.totalResults ||
        totalResults;

      if (Array.isArray(newResults) && newResults.length > 0) {
        let reachedEnd = false;
        setSavedopportunitiesList((prev) => {
          // Deduplicate items by opportunityDetails._id
          const existingIds = new Set(
            prev.map((item) => item.opportunityDetails?._id)
          );
          const uniqueNew = newResults.filter(
            (item: ISavedOpportunity) =>
              !existingIds.has(item.opportunityDetails?._id)
          );
          const updated = [...prev, ...uniqueNew];

          if (updated.length >= total || newResults.length < 10 || uniqueNew.length === 0) {
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
    } catch (error) {
      console.error(`Saved: Failed to fetch page ${nextPage}:`, error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <StudentLayout activePage="saved">
      {/* Invisible backdrop to dismiss open dropdown on outside click */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Saved Opportunities
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {savedOpportunitiesList.length}{" "}
            {totalResults > savedOpportunitiesList.length
              ? `of ${totalResults} `
              : ""}
            saved
          </p>
        </div>

        {/* Responsive Professional Filter Bar */}
        {initialLoaded && (savedOpportunitiesList.length > 0 || hasActiveFilters) && (
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
                  placeholder="Search saved opportunities..."
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
                      {category === "all" ? "Category" : category}
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
                          key={option}
                          type="button"
                          onClick={() => {
                            setCategory(option);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                            category === option
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>
                            {option === "all" ? "All Categories" : option}
                          </span>
                          {category === option && (
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

                {/* Source Status Dropdown */}
                <div className="relative flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "status" ? null : "status"
                      )
                    }
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium transition sm:w-auto ${
                      sourceStatus !== "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate max-w-30 capitalize">
                      {sourceStatus === "all"
                        ? "Status"
                        : sourceStatus === "live"
                          ? "Live"
                          : "Expired"}
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
                    <div className="absolute left-0 top-full z-30 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      {SOURCE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSourceStatus(option);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs capitalize transition ${
                            sourceStatus === option
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>
                            {option === "all" ? "All Status" : option}
                          </span>
                          {sourceStatus === option && (
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
                        activeDropdown === "organisation" ? null : "organisation"
                      )
                    }
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-xs font-medium transition sm:w-auto ${
                      organizationType !== "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate max-w-32.5 capitalize">
                      {organizationType === "all"
                        ? "Organisation"
                        : organizationType}
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
                          key={option}
                          type="button"
                          onClick={() => {
                            setOrganizationType(option);
                            setActiveDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs capitalize transition ${
                            organizationType === option
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>
                            {option === "all" ? "All Organisations" : option}
                          </span>
                          {organizationType === option && (
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
                    Category: {category}
                    <button
                      type="button"
                      onClick={() => setCategory("all")}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {sourceStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs capitalize text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Status: {sourceStatus}
                    <button
                      type="button"
                      onClick={() => setSourceStatus("all")}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {organizationType !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs capitalize text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Org: {organizationType}
                    <button
                      type="button"
                      onClick={() => setOrganizationType("all")}
                      className="text-blue-400 hover:text-red-500"
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

        {/* Opportunities List or Empty State */}
        {savedOpportunitiesList.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={
              hasActiveFilters
                ? "No matches found"
                : "No saved opportunities yet"
            }
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your filters to see saved opportunities."
                : "Save an opportunity from Discover to revisit it here."
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
                <Link
                  to="/discover"
                  className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Explore opportunities
                </Link>
              )
            }
          />
        ) : (
          /* Professional Infinite Scroll container for Saved Opportunities */
          <InfiniteScroll
            dataLength={savedOpportunitiesList.length}
            next={fetchMoreSavedOpportunities}
            hasMore={hasMore}
            scrollThreshold={0.8}
            loader={
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                  <span>Loading more saved opportunities...</span>
                </div>
              </div>
            }
            endMessage={
              savedOpportunitiesList.length > 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="rounded-full bg-slate-100 px-4 py-1.5 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    ✨ You've reached the end of your saved opportunities.
                  </p>
                </div>
              ) : null
            }
          >
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedOpportunitiesList.map((opportunity) => (
                <div
                  key={opportunity.opportunityDetails._id}
                  className="relative"
                >
                  <OpportunityCard
                    opportunity={opportunity.opportunityDetails}
                    saved={true}
                    onToggleSaved={() =>
                      handleUnsave(opportunity.opportunityDetails._id)
                    }
                    onViewDetails={() =>
                      navigate(
                        `/opportunities/${opportunity.opportunityDetails._id}`,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </main>
    </StudentLayout>
  );
}
