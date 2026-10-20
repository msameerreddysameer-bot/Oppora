import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackToHomeButtonProps {
  className?: string;
  label?: string;
}

export const BackToHomeButton = ({
  className = "",
  label = "Back to Home",
}: BackToHomeButtonProps) => {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 bg-slate-900/60 group shadow-sm ${className}`}
      title="Return to Landing Page"
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-cyan-400" />
      <span>{label}</span>
    </Link>
  );
};

export default BackToHomeButton;
