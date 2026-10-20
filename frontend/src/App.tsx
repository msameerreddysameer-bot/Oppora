import "./App.css";
import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./components/AuthContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { RefreshCw } from "lucide-react";

function AppContent() {
  const { isLoading } = useAuth();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSlowNotice(true);
      }, 5000);
    } else {
      setShowSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium text-slate-400">
            Verifying session permissions...
          </span>
          {showSlowNotice && (
            <div className="mt-2 flex flex-col items-center gap-2">
              <p className="text-xs text-slate-500">
                Connecting to server is taking longer than usual.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw size={12} /> Reload
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
