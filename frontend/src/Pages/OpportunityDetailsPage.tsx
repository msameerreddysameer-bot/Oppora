import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FileText,
  Gift,
  Info,
  Link2,
  ListChecks,
  MapPin,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import StudentLayout from "@/components/layout/StudentLayout";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { OpportunityDetailSkeleton } from "@/components/shared/Skeletons";
import OrganizationLogo from "@/components/shared/OrganizationLogo";
import { type IOpportunity } from "@/types/studentTypesData";
import {
  checkSavedOpportunity,
  getOpportunitiesById,
  saveOpportinity,
  unSaveOpportunity,
} from "@/services/opportunityService";

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
        <Icon size={16} className="text-blue-600" />
        {title}
      </h2>
      <div className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function OpportunityDetailsPage() {
  const { opportunityId } = useParams();
  const [saved, setSaved] = useState(false);
  const [opportunityDetails, setOpportunityDetails] = useState<IOpportunity>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"network" | "server" | "generic">(
    "generic"
  );

  const fetchOpportunityDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getOpportunitiesById(id);
      const data = response?.data?.opportunity || response?.data || response;
      setOpportunityDetails(data);
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
          "Failed to load opportunity details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!opportunityId) return;
    try {
      const isAlreadySaved = await checkSavedOpportunity(opportunityId);
      setSaved(Boolean(isAlreadySaved));
    } catch {
      // Silently fall back to unsaved
    }
  };

  useEffect(() => {
    if (!opportunityId) {
      setIsLoading(false);
      return;
    }

    fetchOpportunityDetails(opportunityId);
    checkStatus();
  }, [opportunityId]);

  const handleTogglesave = async () => {
    if (!opportunityId) return;
    try {
      if (saved) {
        await unSaveOpportunity(opportunityId);
        setSaved(false);
      } else {
        await saveOpportinity(opportunityId);
        setSaved(true);
      }
    } catch {
      // Silently keep current state on error
    }
  };

  const convertIsoDateToNormalDate = (IsoString?: string) => {
    if (!IsoString || typeof IsoString !== "string" || !IsoString.trim()) {
      return "Rolling";
    }
    try {
      const date = new Date(IsoString);
      if (isNaN(date.getTime())) return IsoString;

      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
        .format(date)
        .replace(/\//g, "-");
    } catch {
      return IsoString || "Rolling";
    }
  };

  if (isLoading) {
    return (
      <StudentLayout activePage="discover">
        <OpportunityDetailSkeleton />
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout activePage="discover">
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
          <ErrorState
            type={errorType}
            title="Unable to load opportunity"
            message={error}
            onRetry={() => {
              if (opportunityId) {
                fetchOpportunityDetails(opportunityId);
                checkStatus();
              }
            }}
          />
        </main>
      </StudentLayout>
    );
  }

  if (!opportunityDetails)
    return (
      <StudentLayout activePage="discover">
        <EmptyState
          icon={Info}
          title="Opportunity not found"
          description="Choose an opportunity from Discover to view its details."
          action={
            <Link
              to="/discover"
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to Discover
            </Link>
          }
        />
      </StudentLayout>
    );

  return (
    <StudentLayout activePage="discover">
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
        >
          ← Back to Discover
        </Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <OrganizationLogo
                  src={(opportunityDetails as IOpportunity).organizationLogo}
                  originalSrc={
                    (opportunityDetails as IOpportunity).originalLogo
                  }
                  crop={(opportunityDetails as IOpportunity).logoCrop}
                  organization={
                    (opportunityDetails as IOpportunity).organization
                  }
                  size="detail"
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {(opportunityDetails as IOpportunity).organization}
                  </p>
                  <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900 dark:text-white sm:text-2xl">
                    {(opportunityDetails as IOpportunity).title}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {(opportunityDetails as IOpportunity).category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${(opportunityDetails as IOpportunity).status === "active" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
                    >
                      {(opportunityDetails as IOpportunity).status === "active"
                        ? "Closing soon"
                        : "Open"}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 ${
                  (opportunityDetails as IOpportunity).startDate
                    ? "sm:grid-cols-4"
                    : "sm:grid-cols-3"
                }`}
              >
                {(opportunityDetails as IOpportunity).startDate && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Start Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {convertIsoDateToNormalDate(
                        (opportunityDetails as IOpportunity).startDate!
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Deadline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber-600">
                    {convertIsoDateToNormalDate(
                      (opportunityDetails as IOpportunity).deadline
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Benefit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {(opportunityDetails as IOpportunity).benefitsSummary ||
                      "Competitive benefits"}
                  </p>
                </div>
                <div
                  className={
                    (opportunityDetails as IOpportunity).startDate
                      ? ""
                      : "col-span-2 sm:col-span-1"
                  }
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <MapPin size={13} />
                    {(opportunityDetails as IOpportunity).location || "Remote"}
                  </p>
                </div>
              </div>
            </section>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                <strong>
                  Applications are submitted on the official website.
                </strong>{" "}
                Oppora helps you discover and track this listing.
              </p>
            </div>
            <DetailSection icon={Info} title="About this opportunity">
              <p className="whitespace-pre-line leading-relaxed">
                {(opportunityDetails as IOpportunity).description}
              </p>
            </DetailSection>
            <DetailSection icon={ListChecks} title="Eligibility requirements">
              <ul className="flex flex-col gap-2">
                {[
                  ...[
                    "Must be a full-time undergraduate student",
                    "Maintain a minimum cumulative GPA of 3.5",
                    "Pursuing a degree in a STEM field",
                    "Must demonstrate verified financial need",
                  ],
                  "Review the official source for complete eligibility rules.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </DetailSection>
            <DetailSection icon={Gift} title="What you get">
              <ul className="flex flex-col gap-2">
                {Array.isArray((opportunityDetails as IOpportunity)?.benefits) &&
                (opportunityDetails as IOpportunity).benefits.length > 0 ? (
                  (opportunityDetails as IOpportunity).benefits.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                      {item}
                    </li>
                  ))
                ) : (opportunityDetails as IOpportunity)?.benefitsSummary ? (
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                    {(opportunityDetails as IOpportunity).benefitsSummary}
                  </li>
                ) : (
                  <li className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                    Check the official announcement for detailed benefits and awards.
                  </li>
                )}
              </ul>
            </DetailSection>
            <DetailSection icon={FileText} title="Required documents">
              <ul className="flex flex-col gap-2">
                {Array.isArray(
                  (opportunityDetails as IOpportunity)?.requiredDocuments
                ) &&
                (opportunityDetails as IOpportunity).requiredDocuments.length >
                  0 ? (
                  (opportunityDetails as IOpportunity).requiredDocuments.map(
                    (item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                        {item}
                      </li>
                    )
                  )
                ) : (
                  <li className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    Standard identification, academic transcripts, and
                    curriculum vitae (CV/resume).
                  </li>
                )}
              </ul>
            </DetailSection>
            <DetailSection icon={Link2} title="Official source">
              <a
                href={(opportunityDetails as IOpportunity).officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-blue-600 hover:underline dark:text-blue-400"
              >
                {(opportunityDetails as IOpportunity).officialSourceUrl}
              </a>
              <p className="mt-2 text-xs text-slate-400">
                Always verify the details on the official source before
                applying.
              </p>
            </DetailSection>
          </div>
          <aside className="hidden flex-col gap-4 lg:sticky lg:top-24 lg:flex">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Deadline</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {convertIsoDateToNormalDate(
                  (opportunityDetails as IOpportunity).deadline
                )}
              </p>
              <a
                href={(opportunityDetails as IOpportunity).applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
              >
                Apply on Official Website <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={handleTogglesave}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {saved ? "Saved" : "Save Opportunity"}
              </button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
                Clicking Apply opens the official website in a new tab.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Quick info
              </h2>
              <dl className="mt-3 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Category</dt>
                  <dd>{(opportunityDetails as IOpportunity).category}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Location</dt>
                  <dd>
                    {(opportunityDetails as IOpportunity).location || "Remote"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Eligibility</dt>
                  <dd className="text-right">
                    {(opportunityDetails as IOpportunity).eligibilitySummary ||
                      "this a eligibilty Summary"}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
        <button
          type="button"
          onClick={handleTogglesave}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600"
          aria-label={saved ? "Unsave opportunity" : "Save opportunity"}
        >
          {saved ? (
            <BookmarkCheck size={18} className="text-blue-600" />
          ) : (
            <Bookmark size={18} />
          )}
        </button>
        <a
          href={(opportunityDetails as IOpportunity).applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white"
        >
          Apply on Official Website <ExternalLink size={14} />
        </a>
      </div>
    </StudentLayout>
  );
}
