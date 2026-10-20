import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signup } from "@/services/authApi";

interface ToastNotification {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const location = useLocation();

  // Read pre-filled email from router state or search params
  const [email, setEmail] = useState<string>(() => {
    const stateEmail = (location.state as { email?: string })?.email;
    if (stateEmail) return stateEmail;
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  });

  const [FullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status-specific feedback states
  const [bannerAlert, setBannerAlert] = useState<{
    type: "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Client-side validation
  const validateForm = (): boolean => {
    const trimmedName = FullName.trim();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName || trimmedName.length < 2) {
      setBannerAlert({
        type: "error",
        message: "Please enter your full name (at least 2 characters).",
      });
      return false;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setBannerAlert({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return false;
    }

    if (!password || password.length < 8) {
      setBannerAlert({
        type: "error",
        message: "Password must be at least 8 characters long.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBannerAlert(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await signup({
        FullName: FullName.trim(),
        email: email.trim(),
        password,
      });

      const status = response?.status;
      const responseMessage = response?.message || "";

      // Save email for verification screen
      sessionStorage.setItem("verificationEmail", email.trim());

      // ----------------------------------------------------------------------
      // 1. 200 OK: User previously registered but never verified their email
      // Directly navigate to /verify-email (no modal asking permission)
      // ----------------------------------------------------------------------
      if (
        status === 200 ||
        responseMessage
          .toLowerCase()
          .includes("already exists but was not verified")
      ) {
        navigate("/verify-email", {
          state: {
            email: email.trim(),
            isPendingVerification: true,
            infoMessage:
              "You already started registering previously. A fresh verification email has been sent to your inbox.",
          },
        });
        return;
      }

      // ----------------------------------------------------------------------
      // 2. 201 CREATED: Normal new registration
      // Directly navigate to /verify-email (no modal asking permission)
      // ----------------------------------------------------------------------
      navigate("/verify-email", {
        state: {
          email: email.trim(),
          isNewRegistration: true,
          infoMessage:
            "Registration successful! We've sent a verification link to your email. Please verify before logging in.",
        },
      });
    } catch (error: any) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      const backendMessage = responseData?.message || "";

      // ----------------------------------------------------------------------
      // 3. 409 CONFLICT: User with this email already exists and is verified
      // Show user already exists and take directly to login
      // ----------------------------------------------------------------------
      if (status === 409) {
        const conflictText =
          backendMessage ||
          "An account with this email already exists and is verified. Redirecting to login...";

        setBannerAlert({
          type: "warning",
          message: conflictText,
        });

        setToast({
          type: "warning",
          title: "Account Already Exists",
          message: conflictText,
        });

        // Redirect directly to /login with pre-filled email so user can sign in
        setTimeout(() => {
          navigate("/login", {
            state: {
              email: email.trim(),
              infoMessage:
                backendMessage ||
                "An account with this email is already registered and verified. Please log in with your password.",
            },
          });
        }, 1200);
        return;
      }

      // ----------------------------------------------------------------------
      // 4. 400 BAD REQUEST: Validation error
      // ----------------------------------------------------------------------
      if (status === 400) {
        const errorText =
          backendMessage ||
          (Array.isArray(responseData?.errors)
            ? responseData.errors.join(", ")
            : "Please review the form for valid name, email, and password.");

        setBannerAlert({
          type: "error",
          message: errorText,
        });
        return;
      }

      // ----------------------------------------------------------------------
      // 5. DEFAULT / 500: Server Error or Network Issue
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
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
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

      <Card className="min-h-128 w-full max-w-2xl bg-slate-950 px-4 py-8 sm:px-8 lg:px-12 lg:py-10 border-slate-800 shadow-xl">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-3xl font-bold text-white">
            Create your account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your details below to create your Oppora account
          </CardDescription>

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
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="w-full" noValidate>
            <FieldGroup>
              {/* Full Name */}
              <Field>
                <FieldLabel htmlFor="name" className="text-white">
                  Full Name
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  disabled={isSubmitting}
                  placeholder="John Doe"
                  className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus-visible:ring-cyan-500"
                  required
                  value={FullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    if (bannerAlert) setBannerAlert(null);
                  }}
                />
              </Field>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email" className="text-white">
                  Email Address
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  disabled={isSubmitting}
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                  className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus-visible:ring-cyan-500"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (bannerAlert) setBannerAlert(null);
                  }}
                />
              </Field>

              {/* Password */}
              <Field>
                <FieldLabel htmlFor="password" className="text-white">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="Create a strong password"
                    className="border-slate-700 bg-slate-900 pr-10 text-white placeholder-slate-500 focus-visible:ring-cyan-500"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (bannerAlert) setBannerAlert(null);
                    }}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldDescription className="text-slate-400">
                  Must be at least 8 characters long.
                </FieldDescription>
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
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </Button>

                <FieldDescription className="text-center text-slate-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    state={{ email: email.trim() }}
                    className="font-medium text-cyan-400 underline underline-offset-4 hover:underline"
                  >
                    Login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
