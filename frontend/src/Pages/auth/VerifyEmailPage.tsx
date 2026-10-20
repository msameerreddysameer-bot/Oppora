import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "@/services/authApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import { cn } from "cn";

const RESEND_COOLDOWN = 60;

type VerificationStatus =
  | "verifying"
  | "success"
  | "invalid_token"
  | "awaiting_verification_email"
  | "missing_token";

interface ToastNotification {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Resolve email from navigation state or sessionStorage
  const [resendEmail, setResendEmail] = useState<string>(() => {
    const stateEmail = (location.state as { email?: string })?.email;
    if (stateEmail) return stateEmail;
    return sessionStorage.getItem("verificationEmail") || "";
  });

  // Determine initial status:
  // 1. If token is in URL -> "verifying"
  // 2. If no token, but user arrived after registering -> "awaiting_verification_email"
  // 3. If no token and no registered email -> "missing_token"
  const [status, setStatus] = useState<VerificationStatus>(() => {
    if (token) return "verifying";
    const state = location.state as {
      isNewRegistration?: boolean;
      isPendingVerification?: boolean;
      email?: string;
    } | null;
    const hasRegisteredEmail = !!(
      state?.email || sessionStorage.getItem("verificationEmail")
    );
    if (
      hasRegisteredEmail ||
      state?.isNewRegistration ||
      state?.isPendingVerification
    ) {
      return "awaiting_verification_email";
    }
    return "missing_token";
  });

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Cooldown countdown
  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start 1-minute cooldown immediately on mount when arriving awaiting verification email
  useEffect(() => {
    if (status === "awaiting_verification_email") {
      startCooldown();
    }
  }, [status]);

  // --------------------------------------------------------------------------
  // BEHAVIOR ON MOUNT: Verify Token if present
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const executeVerification = async () => {
      setStatus("verifying");
      try {
        await verifyEmail(token);

        // 200 OK: Email verified successfully
        setStatus("success");
        setToast({
          type: "success",
          title: "Email Verified",
          message: "Email verified successfully! Your account is active.",
        });
      } catch (error: any) {
        const backendMessage =
          error.response?.data?.message ||
          "This verification link is invalid or has expired.";

        setStatus("invalid_token");
        setErrorMessage(backendMessage);

        setToast({
          type: "error",
          title: "Verification Failed",
          message: backendMessage,
        });
      }
    };

    executeVerification();
  }, [token]);

  // --------------------------------------------------------------------------
  // RESEND VERIFICATION EMAIL HANDLER
  // --------------------------------------------------------------------------
  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResendError("");
    setResendSuccess(false);

    const trimmed = resendEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setResendError("Please enter a valid email address.");
      return;
    }

    if (cooldown > 0) return;

    setIsResending(true);

    try {
      const response = await resendVerificationEmail(trimmed);
      const msg =
        response?.message ||
        "A fresh verification link has been sent to your inbox.";

      setResendSuccess(true);
      startCooldown();

      setToast({
        type: "success",
        title: "Verification Email Sent",
        message: msg,
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "We could not resend the verification email. Please check the email and try again.";

      setResendError(msg);
      setToast({
        type: "error",
        title: "Resend Failed",
        message: msg,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-900 text-white flex flex-col">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed right-4 top-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-top-2 duration-200",
            toast.type === "success" &&
              "border-emerald-500/40 bg-emerald-950/90 text-emerald-200 ring-1 ring-emerald-500/30",
            toast.type === "error" &&
              "border-rose-500/40 bg-rose-950/90 text-rose-200 ring-1 ring-rose-500/30",
            toast.type === "warning" &&
              "border-amber-500/40 bg-amber-950/90 text-amber-200 ring-1 ring-amber-500/30",
            toast.type === "info" &&
              "border-blue-500/40 bg-blue-950/90 text-blue-200 ring-1 ring-blue-500/30"
          )}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            {toast.type === "warning" && (
              <AlertCircle className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-90">
              {toast.title}
            </h4>
            <p className="mt-0.5 text-xs leading-relaxed">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white"
            aria-label="Dismiss toast"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackToHomeButton />
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-slate-950/40">
                <img
                  src="/oppora-logo.svg"
                  alt="Oppora Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-semibold tracking-tight text-white hidden sm:inline">
                Oppora
              </span>
            </Link>
          </div>

          <Link
            to="/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-12">
        {/* ================================================================= */}
        {/* 1. VERIFYING STATE: Spinner while API is checking token           */}
        {/* ================================================================= */}
        {status === "verifying" && (
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center shadow-2xl animate-in fade-in duration-200">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900/30 text-blue-400">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verifying your email...
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Please wait while we confirm your verification link with the
              server.
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. SUCCESS STATE (200 OK): Email verified successfully           */}
        {/* ================================================================= */}
        {status === "success" && (
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-emerald-500/20">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900/40 text-emerald-400 ring-8 ring-emerald-950/40">
              <CheckCircle2 size={34} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Email verified successfully!
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 mb-8 max-w-sm mx-auto">
              Your account is active. You can now log in and start discovering
              scholarships, internships, and opportunities.
            </p>

            <Button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 text-base cursor-pointer shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Go to Login</span>
            </Button>

            <div className="mt-5">
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. AWAITING VERIFICATION EMAIL (Directly arrived after register)   */}
        {/* ================================================================= */}
        {status === "awaiting_verification_email" && (
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900/30 text-blue-400 ring-8 ring-blue-950/30">
                <Mail size={32} />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                  1
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Check your inbox
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                We've sent a verification link to your email address:
              </p>

              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2">
                <Mail size={14} className="shrink-0 text-slate-400" />
                <span className="truncate font-mono text-xs font-semibold text-cyan-300">
                  {resendEmail || "your registered email"}
                </span>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="mb-3 text-xs text-slate-400">
                Please follow these steps to activate your account:
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  "Open the email from Oppora",
                  'Click "Verify my email address"',
                  "You will be redirected back to log in",
                ].map((step, idx) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900/50 text-[10px] font-bold text-cyan-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resend Action */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 mb-5 text-center">
              <p className="text-xs text-slate-400 mb-3">
                Didn't receive the email? Check your spam folder or request a
                new one.
              </p>
              <Button
                type="button"
                onClick={() => void handleResend()}
                disabled={isResending || cooldown > 0 || !resendEmail.trim()}
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white py-5 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-cyan-400" />
                    <span>Resending verification link...</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin text-amber-400 opacity-60"
                    />
                    <span>Resend available in {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <Mail size={15} />
                    <span>Resend verification email</span>
                  </>
                )}
              </Button>

              {cooldown > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Button is disabled for 1 minute while email arrives (
                  {cooldown}s remaining).
                </p>
              )}

              {resendSuccess && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 text-left">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Verification link resent! Please check your inbox.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <Link to="/login" className="hover:text-white transition-colors">
                ← Back to Login
              </Link>
              <Link
                to="/register"
                className="hover:text-white transition-colors"
              >
                Wrong email? Re-register →
              </Link>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. INVALID / EXPIRED TOKEN STATE (400 Bad Request)               */}
        {/* ================================================================= */}
        {status === "invalid_token" && (
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-950 p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-900/30 text-rose-400 ring-8 ring-rose-950/30">
                <AlertCircle size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                This verification link is invalid or has expired.
              </h1>
              <p className="text-sm text-slate-300">
                {errorMessage ||
                  "This verification link is invalid or has expired."}
              </p>
            </div>

            {/* Resend Verification Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 mb-5">
              <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                <span>Resend Verification Link</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Enter your email address below and we'll send you a fresh
                verification link to activate your account.
              </p>

              <form onSubmit={handleResend} className="space-y-3" noValidate>
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    disabled={isResending || cooldown > 0}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      if (resendError) setResendError("");
                    }}
                    className="border-slate-700 bg-slate-950 text-white placeholder-slate-500"
                    required
                  />
                  {resendError && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {resendError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isResending || cooldown > 0 || !resendEmail.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5 cursor-pointer disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending verification link...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Loader2 size={16} className="animate-spin opacity-50" />
                      <span>Resend available in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Resend Verification Link</span>
                    </>
                  )}
                </Button>
              </form>

              {resendSuccess && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>
                    A fresh verification link has been sent to your email.
                    Please check your inbox and spam folder.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <Link to="/login" className="hover:text-white transition-colors">
                ← Back to Login
              </Link>
              <Link
                to="/register"
                className="hover:text-white transition-colors"
              >
                Create New Account →
              </Link>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. MISSING TOKEN STATE: No token and no registered email          */}
        {/* ================================================================= */}
        {status === "missing_token" && (
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-900/30 text-amber-400 ring-8 ring-amber-950/30">
                <Mail size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                No verification token found in URL
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Please click the direct link sent to your email address, or
                enter your email below to receive a new verification link.
              </p>
            </div>

            {/* Resend Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 mb-5">
              <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Send size={15} className="text-cyan-400" />
                <span>Request Verification Link</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Enter your registered email address to get a verification link.
              </p>

              <form onSubmit={handleResend} className="space-y-3" noValidate>
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    disabled={isResending || cooldown > 0}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      if (resendError) setResendError("");
                    }}
                    className="border-slate-700 bg-slate-950 text-white placeholder-slate-500"
                    required
                  />
                  {resendError && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {resendError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isResending || cooldown > 0 || !resendEmail.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5 cursor-pointer disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending verification link...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Loader2 size={16} className="animate-spin opacity-50" />
                      <span>Resend available in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      <span>Send Verification Email</span>
                    </>
                  )}
                </Button>
              </form>

              {resendSuccess && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Verification link sent! Please check your inbox and spam
                    folder.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <Link to="/login" className="hover:text-white transition-colors">
                ← Back to Login
              </Link>
              <Link
                to="/register"
                className="hover:text-white transition-colors"
              >
                Register an Account →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Security Guidance Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>
              Secure account verification powered by Oppora
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
