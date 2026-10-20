import {
  AlertCircle,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  WifiOff,
} from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: "network" | "server" | "auth" | "generic";
  className?: string;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  type = "generic",
  className = "",
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case "network":
        return <WifiOff size={24} className="text-rose-500" />;
      case "server":
        return <ServerCrash size={24} className="text-amber-500" />;
      case "auth":
        return <ShieldAlert size={24} className="text-indigo-500" />;
      default:
        return <AlertCircle size={24} className="text-rose-500" />;
    }
  };

  const defaultTitle =
    title ||
    (type === "network"
      ? "Unable to connect"
      : type === "server"
        ? "Server temporarily unavailable"
        : type === "auth"
          ? "Authorization required"
          : "Failed to load content");

  const defaultMessage =
    message ||
    (type === "network"
      ? "Please check your internet connection or network settings and try again."
      : type === "server"
        ? "Our servers encountered an issue. We are working to resolve this quickly."
        : type === "auth"
          ? "Your session may have expired. Please sign in again to access this resource."
          : "An unexpected error occurred while fetching information. Please try again.");

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-12 text-center backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        {getIcon()}
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
        {defaultTitle}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
        {defaultMessage}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
        >
          <RefreshCw size={13} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
