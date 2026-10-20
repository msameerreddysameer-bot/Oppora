import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  LogIn,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/services/authApi";
import { useAuth } from "@/components/AuthContext";

interface ToastNotification {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth, setAuthUser } = useAuth();

  // Read pre-filled email from router state or search params
  const [email, setEmail] = useState<string>(() => {
    const stateEmail = (location.state as { email?: string })?.email;
    if (stateEmail) return stateEmail;
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status-specific UI states
  const [bannerAlert, setBannerAlert] = useState<{
    type: "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Auto-dismiss floating toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Check if redirected from conflict or registration with a message
  useEffect(() => {
    const stateMessage = (location.state as { infoMessage?: string })
      ?.infoMessage;
    if (stateMessage) {
      setBannerAlert({
        type: "info",
        message: stateMessage,
      });
    }
  }, [location.state]);

  // Client-side validation
  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setBannerAlert({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return false;
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setBannerAlert({
        type: "error",
        message: "Please enter your password (minimum 6 characters).",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBannerAlert(null);
    setPasswordError(false);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      // ----------------------------------------------------------------------
      // 200 OK: Successful Login
      // ----------------------------------------------------------------------
      // 1. Resolve user payload from login response
      const userPayload =
        response?.data?.user ||
        response?.user ||
        response?.data ||
        response;

      const rawRole = (
        userPayload?.role ||
        response?.role ||
        response?.data?.role ||
        ""
      )
        .toString()
        .toLowerCase()
        .trim();

      if (rawRole) {
        localStorage.setItem("auth_user_role", rawRole);
      }

      // Immediately set user in AuthContext so isAuthenticated is synchronously true
      setAuthUser(userPayload);

      // 2. Synchronize full profile in background
      refreshAuth().catch(() => {});

      // 3. Show success toast notification
      setToast({
        type: "success",
        title: "Success",
        message: "Logged in successfully!",
      });

      // 4. Resolve effective role and route to dashboard
      const effectiveRole = (
        rawRole ||
        userPayload?.role ||
        localStorage.getItem("auth_user_role") ||
        ""
      )
        .toString()
        .toLowerCase()
        .trim();

      const targetDashboard =
        effectiveRole === "admin" || effectiveRole === "administrator"
          ? "/admin"
          : "/discover";

      setTimeout(() => {
        navigate(targetDashboard, { replace: true });
      }, 500);
    } catch (error: any) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      const backendMessage = responseData?.message || "";

      // ----------------------------------------------------------------------
      // 403 FORBIDDEN: Email not yet verified
      // ----------------------------------------------------------------------
      if (status === 403) {
        const verifyText =
          backendMessage ||
          "Please verify your email address before logging in. Check your inbox for the verification link.";

        setBannerAlert({
          type: "warning",
          message: verifyText,
        });

        setToast({
          type: "warning",
          title: "Verification Required",
          message: verifyText,
        });
        return;
      }

      // ----------------------------------------------------------------------
      // 404 NOT FOUND: Account does not exist
      // ----------------------------------------------------------------------
      if (status === 404) {
        const notFoundText =
          backendMessage ||
          "Account not found. Redirecting you to complete registration...";

        setBannerAlert({
          type: "warning",
          message: notFoundText,
        });

        setToast({
          type: "warning",
          title: "Registration Required",
          message:
            "Account not found or email not yet verified. Redirecting to registration...",
        });

        // Automatically navigate to /register with pre-filled email
        setTimeout(() => {
          navigate("/register", {
            state: {
              email: email.trim(),
              infoMessage:
                "Please complete registration or request a fresh verification link.",
            },
          });
        }, 1800);
        return;
      }

      // ----------------------------------------------------------------------
      // 401 UNAUTHORIZED: Incorrect email or password
      // ----------------------------------------------------------------------
      if (status === 401) {
        const authErrorText = "Incorrect email or password. Please try again.";

        // Highlight password input with red border and clear the password
        setPasswordError(true);
        setPassword("");

        setBannerAlert({
          type: "error",
          message: authErrorText,
        });

        setToast({
          type: "error",
          title: "Authentication Failed",
          message: authErrorText,
        });
        return;
      }

      // ----------------------------------------------------------------------
      // 400 BAD REQUEST: Validation failed
      // ----------------------------------------------------------------------
      if (status === 400) {
        const validationErrorText =
          backendMessage ||
          (Array.isArray(responseData?.errors)
            ? responseData.errors.join(", ")
            : "Please enter a valid email address and password.");

        setBannerAlert({
          type: "error",
          message: validationErrorText,
        });
        return;
      }

      // ----------------------------------------------------------------------
      // DEFAULT / 500: Server Error or Network Issue
      // ----------------------------------------------------------------------
      const fallbackError =
        backendMessage ||
        "Something went wrong on the server. Please try again later.";

      setBannerAlert({
        type: "error",
        message: fallbackError,
      });

      setToast({
        type: "error",
        title: "Server Error",
        message: fallbackError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
            {toast.type === "info" && (
              <Info className="h-5 w-5 text-blue-400" />
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

      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col gap-6", className)}
        noValidate
        {...props}
      >
        <FieldGroup className="bg-slate-900">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold text-white">
              Login to your account
            </h1>
            <p className="text-sm text-balance text-gray-400">
              Enter your email and password below to access Oppora
            </p>

            {/* Inline Banner Alert */}
            {bannerAlert && (
              <div
                className={cn(
                  "mt-3 flex w-full items-start gap-2.5 rounded-lg border p-3.5 text-left text-xs leading-relaxed transition-all",
                  bannerAlert.type === "error" &&
                    "border-rose-500/40 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
                  bannerAlert.type === "warning" &&
                    "border-amber-500/40 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
                  bannerAlert.type === "info" &&
                    "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20"
                )}
                role="alert"
              >
                <div className="mt-0.5 shrink-0">
                  {bannerAlert.type === "error" && (
                    <AlertCircle size={15} className="text-rose-400" />
                  )}
                  {bannerAlert.type === "warning" && (
                    <AlertCircle size={15} className="text-amber-400" />
                  )}
                  {bannerAlert.type === "info" && (
                    <Info size={15} className="text-cyan-400" />
                  )}
                </div>
                <div className="flex-1">{bannerAlert.message}</div>
                <button
                  type="button"
                  onClick={() => setBannerAlert(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Close alert"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Email Field */}
          <Field>
            <FieldLabel htmlFor="email" className="text-white">
              Email Address
            </FieldLabel>
            <Input
              id="email"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                if (bannerAlert) setBannerAlert(null);
              }}
              type="email"
              autoComplete="email"
              className="border-slate-700 bg-slate-950 text-slate-200 placeholder:text-slate-500 focus-visible:ring-cyan-500"
              placeholder="m@example.com"
              required
            />
          </Field>

          {/* Password Field */}
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password" className="text-white">
                Password
              </FieldLabel>
              <Link
                to="/forgot-password"
                className="ml-auto text-sm text-cyan-400 underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                className={cn(
                  "pr-10 text-white placeholder:text-slate-500 bg-slate-950 border-slate-700 focus-visible:ring-cyan-500 transition-colors",
                  passwordError &&
                    "border-rose-500 ring-2 ring-rose-500/40 focus-visible:ring-rose-500"
                )}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(false);
                  if (bannerAlert) setBannerAlert(null);
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <span className="mt-1 text-[11px] text-rose-400">
                Please re-enter your password.
              </span>
            )}
          </Field>

          {/* Submit Button */}
          <Field>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="py-6 text-base font-bold text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-60 cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Login</span>
                </>
              )}
            </Button>
          </Field>

          {/* Registration Redirect Link */}
          <Field>
            <FieldDescription className="text-center text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                state={{ email: email.trim() }}
                className="font-medium text-cyan-400 underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  );
}
