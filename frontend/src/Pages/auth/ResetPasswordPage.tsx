import { type FormEvent, useId, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { resetPassword } from "@/services/authApi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BackToHomeButton } from "@/components/BackToHomeButton";

type ResetState = "idle" | "submitting" | "success" | "error";

export interface ResetPasswordPageProps {
  onBackToLogin?: () => void;
  onSubmit?: (password: string) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage({
  onBackToLogin,
  //onSubmit,
}: ResetPasswordPageProps) {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetState, setResetState] = useState<ResetState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
      return;
    }

    window.history.back();
  };
 

    const Navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    
    


    if (password.length < MIN_PASSWORD_LENGTH) {
      setResetState("error");
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setResetState("error");
      setErrorMessage("Passwords do not match.");
      return;
    }
   try {
        const response = await resetPassword(token, password);

    setResetState("success");

    console.log(response);

    Navigate("/login");
   }
   catch (error) {
    console.error("Password reset failed:", error);
    setResetState("error");
    setErrorMessage("We could not update your password. Please try again.");
   }

    // setResetState("submitting");
    // setErrorMessage("");

    // try {
    //   await onSubmit?.(password);
    //   setResetState("success");
    // } catch {
    //   setResetState("error");
    //   setErrorMessage("We could not update your password. Please try again.");
    // }
  };

  const clearError = () => {
    if (resetState === "error") {
      setResetState("idle");
      setErrorMessage("");
    }
  };

  return (
    <main className="min-h-svh overflow-x-hidden bg-slate-900 text-white">
      <AuthHeader onBackToLogin={handleBackToLogin} />
      <section className="grid min-h-[calc(100svh-4rem)] md:grid-cols-2">
        <SecurityPanel />
        <div className="flex items-center justify-center bg-slate-900 px-4 py-10 sm:px-8 md:px-10 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            {resetState === "success" ? (
              <SuccessState onBackToLogin={handleBackToLogin} />
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/50 text-blue-300 ring-1 ring-blue-800">
                    <KeyRound size={25} aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create a new password</h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400 sm:text-base">
                    Choose a strong password to secure your Opportunity Radar account.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                  <form onSubmit={handleSubmit} noValidate>
                    <PasswordField
                      id={passwordId}
                      label="New password"
                      value={password}
                      visible={showPassword}
                      autoComplete="new-password"
                      placeholder="Enter your new password"
                      onChange={(value) => {
                        setPassword(value);
                        clearError();
                      }}
                      onToggleVisibility={() => setShowPassword((visible) => !visible)}
                    />

                    <PasswordField
                      id={confirmPasswordId}
                      label="Confirm new password"
                      value={confirmPassword}
                      visible={showConfirmPassword}
                      autoComplete="current-password"
                      placeholder="Re-enter your new password"
                      onChange={(value) => {
                        setConfirmPassword(value);
                        clearError();
                      }}
                      onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
                    />

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Use at least {MIN_PASSWORD_LENGTH} characters. Avoid reusing a password from another account.
                    </p>

                    {resetState === "error" && (
                      <p className="mt-4 flex items-center gap-1.5 text-sm text-red-400" role="alert">
                        <AlertCircle size={15} aria-hidden="true" />
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="submit"

                      disabled={resetState === "submitting"}
                      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetState === "submitting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          Updating password...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </button>
                  </form>
                </div>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="mx-auto mt-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back to login
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  placeholder,
  onChange,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-400 focus:ring-3 focus:ring-blue-400/30"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function SuccessState({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/30 text-green-400 ring-8 ring-green-950/30">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold sm:text-3xl">Password updated</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Your password has been changed successfully. You can now log in with your new password.
      </p>
      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <LogIn size={16} aria-hidden="true" />
        Back to login
      </button>
    </div>
  );
}

function SecurityPanel() {
  return (
    <aside className="hidden min-h-[calc(100svh-4rem)] flex-col justify-center bg-slate-950 px-6 py-10 sm:px-12 md:flex lg:px-16 xl:px-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900">
          <ShieldCheck size={24} aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold leading-tight lg:text-4xl">Your account security matters.</h2>
        <p className="mt-5 text-base leading-7 text-slate-400">
          Create a password that keeps your Opportunity Radar account private and protected.
        </p>
        <div className="mt-8 flex flex-col gap-5 lg:mt-10">
          <SecurityPoint icon={<KeyRound size={18} aria-hidden="true" />} title="Use a strong password" description="Choose a password you do not use on another website or account." />
          <SecurityPoint icon={<Mail size={18} aria-hidden="true" />} title="Keep your account protected" description="Your new password will secure access to your saved opportunities and applications." />
        </div>
      </div>
    </aside>
  );
}

function SecurityPoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900/70 text-blue-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function AuthHeader({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <BackToHomeButton />
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg text-left transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-900">
              <Compass size={18} aria-hidden="true" className="text-white" />
            </span>
            <span className="font-semibold tracking-tight text-white hidden sm:inline">Opportunity Radar</span>
          </Link>
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Login
        </button>
      </div>
    </header>
  );
}
