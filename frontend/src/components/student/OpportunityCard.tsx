import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import type { IOpportunity } from "@/demo/studentDemoData";
import OrganizationLogo from "@/components/shared/OrganizationLogo";

interface OpportunityCardProps {
  opportunity: IOpportunity ;
  saved?: boolean;
  onToggleSaved?: () => void;
  onViewDetails?: () => void;
}

export default function OpportunityCard({
  opportunity,
  saved = false,
  onToggleSaved,
  onViewDetails,
}: OpportunityCardProps) {

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
  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xs font-bold text-white">
          {opportunity.initials}
        </div> */}
        <OrganizationLogo
          src={opportunity.organizationLogo}
          originalSrc={opportunity.originalLogo}
          crop={opportunity.logoCrop}
          organization={opportunity.organization}
          size="card"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {opportunity.organization}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {opportunity.location || "Remote"}
          </p>
        </div>
        {onToggleSaved && (
          <button
            type="button"
            onClick={onToggleSaved}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 dark:border-slate-600"
            aria-label={saved ? "Remove from saved" : "Save opportunity"}
          >
            {saved ? (
              <BookmarkCheck size={17} className="text-blue-600" />
            ) : (
              <Bookmark size={17} />
            )}
          </button>
        )}
      </div>
      <h2 className="min-h-12 text-lg font-semibold leading-snug text-slate-900 dark:text-white">
        {opportunity.title}
      </h2>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {opportunity.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${opportunity.status === "active" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
        >
          {opportunity.status === "active" ? "Closing soon" : "Open"}
        </span>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {opportunity.benefitsSummary || "30000rs scholarship"}
        </p>
        <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <GraduationCap size={15} className="shrink-0" />
          {opportunity.eligibilitySummary || "open to all"}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar size={13} />
          {convertIsoDateToNormalDate(opportunity.deadline)}
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            View details <ChevronRight size={13} />
          </button>
        )}
      </div>
    </article>
  );
}
