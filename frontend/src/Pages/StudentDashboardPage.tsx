import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  FilterX,
  Inbox,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "@/components/layout/StudentLayout";
import EmptyState from "@/components/shared/EmptyState";
import OpportunityCard from "@/components/student/OpportunityCard";
import {
 // DEMO_OPPORTUNITIES,
  type IOpportunity,
  type OpportunityEducationLevel,
  type OpportunityGender,
  type OpportunityorganizationType,
  type OpportunitySourceStatus,
} from "@/demo/studentDemoData";
import {
 // checkSavedOpportunity,
  getSavedOpportunitiesByUserIdAndSearch,
  saveOpportinity,
  search,
  unSaveOpportunity,
} from "@/services/opportunityService";

const CATEGORY_OPTIONS = [
  "Scholarship",
  "internship",
  "hackathon",
  "competition",
  "fellowship",
  "research",
  "open Source",
  "workshop",
];
const GENDER_OPTIONS: OpportunityGender[] = ["all", "Male", "Female", "Other"];
const SOURCE_OPTIONS: Array<OpportunitySourceStatus | "all"> = [
  "all",
  "live",
  "expired",
];
const EDUCATION_LEVEL_OPTIONS: Array<OpportunityEducationLevel | "all"> = [
  "all",
  "high-school",
  "diploma",
  "phd",
  "undergraduate",
  "postgraduate",
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
type FilterKey =
  | "category"
  | "gender"
  | "source"
  | "organisation"
  | "education";

type DiscoverFilters = {
  category: "all" | string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus | "all";
  organizationType: OpportunityorganizationType | "all";
  educationLevel: OpportunityEducationLevel | "all";
};

interface FilterGroupProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterGroup({ title, open, onToggle, children }: FilterGroupProps) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 dark:border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
      >
        {title}
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-2 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function RadioChoice({
  selected,
  label,
  onSelect,
  indicator,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  indicator?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="group flex w-full items-center gap-2.5 text-left"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-blue-600" : "border-slate-300 group-hover:border-blue-400 dark:border-slate-600"}`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
      </span>
      {indicator && (
        <span className={`h-1.5 w-1.5 rounded-full ${indicator}`} />
      )}
      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
        {label}
      </span>
    </button>
  );
}

function FilterPanel({
  filters,
  setFilters,
}: {
  filters: DiscoverFilters;
  setFilters: (filters: DiscoverFilters) => void;
}) {
  const [openSection, setOpenSection] = useState<FilterKey>("category");
  const toggle = (section: FilterKey) =>
    setOpenSection((current) => (current === section ? section : section));
  return (
    <div className="flex flex-col gap-4">
      <FilterGroup
        title="Category"
        open={openSection === "category"}
        onToggle={() => toggle("category")}
      >
        <RadioChoice
          selected={filters.category === "all"}
          label="all Categories"
          onSelect={() => setFilters({ ...filters, category: "all" })}
        />
        {CATEGORY_OPTIONS.map((category) => (
          <RadioChoice
            key={category}
            selected={filters.category === category}
            label={category}
            onSelect={() => setFilters({ ...filters, category })}
          />
        ))}
      </FilterGroup>
      <FilterGroup
        title="Gender"
        open={openSection === "gender"}
        onToggle={() => toggle("gender")}
      >
        <div className="grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map((gender) => (
            <button
              key={gender}
              type="button"
              aria-pressed={filters.gender === gender}
              onClick={() => setFilters({ ...filters, gender })}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${filters.gender === gender ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-400 dark:border-slate-600 dark:text-slate-300"}`}
            >
              {gender}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup
        title="Source Status"
        open={openSection === "source"}
        onToggle={() => toggle("source")}
      >
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filters.sourceStatus === status}
              onClick={() => setFilters({ ...filters, sourceStatus: status })}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${filters.sourceStatus === status ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-400 dark:border-slate-600 dark:text-slate-300"}`}
            >
              {status}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup
        title="education level"
        open={openSection === "education"}
        onToggle={() => toggle("education")}
      >
        {EDUCATION_LEVEL_OPTIONS.map((type) => (
          <RadioChoice
            key={type}
            selected={filters.educationLevel === type}
            label={type}
            onSelect={() => setFilters({ ...filters, educationLevel: type })}
          />
        ))}
      </FilterGroup>

      <FilterGroup
        title="Organisation Type"
        open={openSection === "organisation"}
        onToggle={() => toggle("organisation")}
      >
        {ORGANISATION_OPTIONS.map((type) => (
          <RadioChoice
            key={type}
            selected={filters.organizationType === type}
            label={type}
            onSelect={() => setFilters({ ...filters, organizationType: type })}
          />
        ))}
      </FilterGroup>
    </div>
  );
}

interface StudentDashboardPageProps {
  opportunities?: IOpportunity[];
}

export default function StudentDashboardPage({
 // opportunities = DEMO_OPPORTUNITIES,
}: StudentDashboardPageProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
 // const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>([
   // DEMO_OPPORTUNITIES[0]._id,
  ]);
  const [filters, setFilters] = useState<DiscoverFilters>({
    category: "all",
    gender: "all",
    sourceStatus: "all",
    organizationType: "all",
    educationLevel: "all",
  });
  const [opportunitiesList, setOpportunitiesList] = useState<IOpportunity[]>(
    [],
  );

  // -------------------------------------------------------------
  // INFINITE SCROLL & PAGINATION STATES
  // -------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const addFilters = useMemo(
    () => ({
      ...(filters.category !== "all" && { category: filters.category }),
      ...(filters.organizationType !== "all" && {
        organizationType: filters.organizationType,
      }),
      ...(filters.sourceStatus !== "all" && {
        sourceStatus: filters.sourceStatus.toLowerCase() as "live" | "expired",
      }),
      ...(debouncedQuery.trim() !== "" && { queryTerm: debouncedQuery.trim() }),
      ...(filters.educationLevel !== "all" && {
        educationLevel: filters.educationLevel,
      }),
      ...(filters.gender !== "all" && {
        gender: filters.gender,
      }),
    }),
    [
      filters.category,
      filters.organizationType,
      filters.sourceStatus,
      debouncedQuery,
      filters.educationLevel,
      filters.gender,
    ],
  );

  const activeFilterCount =
    Number(filters.category !== "all") +
    Number(filters.gender !== "all") +
    Number(filters.sourceStatus !== "all") +
    Number(filters.organizationType !== "all") +
    Number(filters.educationLevel !== "all");

  // Load user saved opportunities IDs to highlight bookmark icons
  useEffect(() => {
    const fetchUserSavedOpportunities = async () => {
      try {
        const response = await getSavedOpportunitiesByUserIdAndSearch({});
        const userSavedOpportunities = response?.data?.results || [];
        const matchedIds = userSavedOpportunities.map(
          (item: any) => item.opportunity,
        );
        setSavedIds(matchedIds);
      } catch (error) {
        console.error("Failed to load saved opportunity IDs:", error);
      }
    };

    fetchUserSavedOpportunities();
  }, []);

  // -------------------------------------------------------------
  // 1. INITIAL LOAD & FILTER CHANGES (Page 1)
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const fetchInitialOpportunities = async () => {
      setInitialLoading(true);
      try {
        console.log("Discover: Fetching initial page 1 with filters:", addFilters);
        const response = await search({
          ...addFilters,
          page: 1,
          limit: 20,
        });

        console.log("Discover: Page 1 API response:", response);

        const results =
          response?.data?.results ||
          response?.data?.data?.results ||
          response?.data ||
          [];

        const total =
          response?.data?.totalResults ??
          response?.data?.data?.totalResults ??
          response?.totalResults ??
          (Array.isArray(results) ? results.length : 0);

        if (active) {
          // Keep all live opportunities returned from the backend search
          const apiList = Array.isArray(results) ? results : [];

          // Merge locally published opportunities if available
          let localPubs: IOpportunity[] = [];
          const localSaved = localStorage.getItem('admin_managed_opportunities');
          if (localSaved) {
            try {
              localPubs = JSON.parse(localSaved).filter(
                (o: IOpportunity) =>
                  o.publicationStatus === 'published' ||
                  (!o.publicationStatus && o.status === 'active')
              );
            } catch {
              localPubs = [];
            }
          }

          const existingIds = new Set(apiList.map((o) => o._id));
          const uniqueLocals = localPubs.filter((o) => !existingIds.has(o._id));
          const list = [...uniqueLocals, ...apiList];

          setOpportunitiesList(list);
          setTotalResults(total + uniqueLocals.length);
          setPage(1);
          // Enable infinite scroll if there are remaining items to load
          setHasMore(apiList.length < total && apiList.length >= 20);
        }
      } catch (error) {
        console.error("Discover: Failed to fetch initial opportunities:", error);
        if (active) {
          let localPubs: IOpportunity[] = [];
          const localSaved = localStorage.getItem('admin_managed_opportunities');
          if (localSaved) {
            try {
              localPubs = JSON.parse(localSaved).filter(
                (o: IOpportunity) =>
                  o.publicationStatus === 'published' ||
                  (!o.publicationStatus && o.status === 'active')
              );
            } catch {
              localPubs = [];
            }
          }
          setOpportunitiesList(localPubs);
          setTotalResults(localPubs.length);
          setHasMore(false);
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    };

    fetchInitialOpportunities();

    return () => {
      active = false;
    };
  }, [addFilters]);

  // -------------------------------------------------------------
  // 2. INFINITE SCROLL: FETCH NEXT PAGE
  // -------------------------------------------------------------
  const fetchMoreOpportunities = async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      console.log(`Discover: Fetching page ${nextPage}...`);
      const response = await search({
        ...addFilters,
        page: nextPage,
        limit: 20,
      });

      console.log(`Discover: Page ${nextPage} API response:`, response);

      const newResults =
        response?.data?.results ||
        response?.data?.data?.results ||
        response?.data ||
        [];

      const total =
        response?.data?.totalResults ??
        response?.data?.data?.totalResults ??
        response?.totalResults ??
        totalResults;

      if (Array.isArray(newResults) && newResults.length > 0) {
        let reachedEnd = false;
        setOpportunitiesList((prev) => {
          // Deduplicate opportunities by _id
          const existingIds = new Set(prev.map((item) => item._id));
          const uniqueNew = newResults.filter(
            (item: IOpportunity) => !existingIds.has(item._id)
          );
          const updated = [...prev, ...uniqueNew];

          if (updated.length >= total || newResults.length < 20 || uniqueNew.length === 0) {
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
      console.error(`Discover: Failed to fetch page ${nextPage}:`, error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // -------------------------------------------------------------
  // OPPORTUNITIES LIST (Natural backend recently-added order)
  // -------------------------------------------------------------
  const displayedOpportunities = opportunitiesList;

  // const filteredOpportunities = useMemo(() => {
  //   const text = query.trim().toLowerCase();
  //   return opportunities
  //     .filter(
  //       (opportunity) =>
  //         (filters.category === "all" ||
  //           opportunity.category === filters.category) &&
  //         (filters.gender === "all" || opportunity.gender === filters.gender) &&
  //         (filters.sourceStatus === "all" ||
  //           opportunity.sourceStatus === filters.sourceStatus) &&
  //         (filters.organizationType === "all" ||
  //           opportunity.organizationType === filters.organizationType) &&
  //         (!text ||
  //           `${opportunity.title} ${opportunity.organization} ${opportunity.category}`
  //             .toLowerCase()
  //             .includes(text)),
  //     )
  //     .sort((first, second) =>
  //       sort === "deadline"
  //         ? first.deadline.localeCompare(second.deadline)
  //         : sort === "newest"
  //           ? second.title.localeCompare(first.title)
  //           : first.organization.localeCompare(second.organization),
  //     );
  // }, [filters, opportunities, query, sort]);

  function resetFilters() {
    setFilters({
      category: "all",
      gender: "all",
      sourceStatus: "all",
      organizationType: "all",
      educationLevel: "all",
    });
    setQuery("");
  }

  function toggleSaved(opportunityId: string) {


    const saveOrUnSave = async (opportunityId: string) => {


      //const currentSavedStatus = isSaved
      try {
        if (!savedIds.includes(opportunityId)) {
            console.log("👉 3. Calling Save Opportunity with:", opportunityId);
          const response = await saveOpportinity(opportunityId);

          console.log("response of after saving :", response);
          setSavedIds((prev) => [...prev,opportunityId])

          //setIsSaved(true);
        } else {
          console.log("👉 3. Calling unSaveOpportunity with:", opportunityId);
          const response = await unSaveOpportunity(opportunityId);
          setSavedIds((prev) => prev.filter((id) => id!==opportunityId))

          console.log("response of after un saving :", response);

          //setIsSaved(false);
        }
      } catch (error) {

        //setIsSaved(currentSavedStatus)
        console.log("failed to toggle save or unsave ",error)
      }
    };

    saveOrUnSave(opportunityId)
  }

  // const CheckIsSaved = async(opportunityId:string) => {

  //   const response = await checkSavedOpportunity(opportunityId)

  //   return response


  // } 

  // function toggleSaved(opportunity: IOpportunity) {
  //   setSavedIds((current) =>
  //     current.includes(opportunity._id)
  //       ? current.filter((id) => id !== opportunity._id)
  //       : [...current, opportunity._id],
  //   );
  // }

  console.log("opportunityList:", opportunitiesList);

  return (
    <StudentLayout activePage="discover">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 shrink-0">
          <div className="mb-4 hidden sm:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              Curated for students
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Discover Opportunities
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Find programs that match your goals, experience, and timeline.
            </p>
          </div>
          <label className="relative block" htmlFor="opportunity-search">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="opportunity-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, organization, or category..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden w-72 shrink-0 self-start sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 lg:block dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Filters
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                Reset all
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
          </aside>
          <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10 sm:px-5">
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {totalResults > 0 ? totalResults : opportunitiesList.length}
                </span>{" "}
                opportunities
              </p>
            </div>
            {opportunitiesList.length === 0 ? (
              initialLoading ? (
                <div className="flex flex-1 items-center justify-center p-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Loading opportunities...
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No opportunities yet"
                  description="New opportunities will appear here when they are available."
                />
              )
            ) : (
              /* Professional Infinite Scroll using Student Layout standard window scroll */
              <InfiniteScroll
                dataLength={displayedOpportunities.length}
                next={fetchMoreOpportunities}
                hasMore={hasMore}
                scrollThreshold={0.8}
                loader={
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                      <span>Loading more opportunities...</span>
                    </div>
                  </div>
                }
                endMessage={
                  displayedOpportunities.length > 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <p className="rounded-full bg-slate-100 px-4 py-1.5 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        ✨ You've reached the end of curated opportunities ({totalResults > 0 ? totalResults : displayedOpportunities.length} total).
                      </p>
                    </div>
                  ) : null
                }
              >
                <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
                  {displayedOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity._id}
                      opportunity={opportunity}
                      saved={savedIds.includes(opportunity._id)}
                      onToggleSaved={() => {
                        console.log("👉 1. Card clicked! Sending ID:", opportunity._id);
                        toggleSaved(opportunity._id);
                      }}
                      onViewDetails={() =>
                        navigate(`/opportunities/${opportunity._id}`)
                      }
                    />
                  ))}
                </div>
              </InfiniteScroll>
            )}
          </section>
        </div>
        {(query || activeFilterCount > 0) && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center justify-center gap-2 self-center text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <FilterX size={13} /> Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="fixed inset-x-3 bottom-3 z-30 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg lg:hidden"
          aria-label="Open filters"
        >
          <SlidersHorizontal size={17} />
          Filters
        </button>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
            />
            <section className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-sm font-semibold text-blue-600"
                >
                  Done
                </button>
              </div>
              <FilterPanel filters={filters} setFilters={setFilters} />
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                >
                  <X size={13} />
                  Reset all
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Show {opportunitiesList.length} results
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
