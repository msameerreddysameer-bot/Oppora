import { useId, useState, useEffect, useRef } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Loader2,
  LogIn,
  Mail,
  Send,
  X,
} from "lucide-react"
import { forgotPassword } from "@/services/authApi"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/BackToHomeButton"
import { cn } from "cn"

type RequestState = "idle" | "submitting" | "success" | "error"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN = 60

export default function ForgotPasswordPage() {
  const emailId = useId()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [requestState, setRequestState] = useState<RequestState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer for resend
  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCooldown(RESEND_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setRequestState("error")
      setErrorMessage("Please enter your email address.")
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      setRequestState("error")
      setErrorMessage("Please enter a valid email address.")
      return
    }

    setRequestState("submitting")

    try {
      // 1. Check with database via backend API
      await forgotPassword(normalizedEmail)

      // 2. Email was found in database and reset link was successfully dispatched!
      setSubmittedEmail(normalizedEmail)
      setRequestState("success")
      startCooldown()
    } catch (error: any) {
      console.warn("Forgot password request failed:", error)
      const status = error.response?.status
      const backendMessage = error.response?.data?.message || ""

      setRequestState("error")

      // 3. If email is NOT present in the database (404 Not Found)
      if (
        status === 404 ||
        backendMessage.toLowerCase().includes("not found") ||
        backendMessage.toLowerCase().includes("does not exist") ||
        backendMessage.toLowerCase().includes("no user")
      ) {
        setErrorMessage(
          backendMessage ||
            "No account found with this email address. Please check your email or create a new account."
        )
      } else if (status === 400) {
        setErrorMessage(backendMessage || "Please enter a valid email address.")
      } else {
        setErrorMessage(
          backendMessage ||
            "Unable to process password reset. Please verify your email or try again later."
        )
      }
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || !submittedEmail) return
    setRequestState("submitting")
    setResendSuccess(false)

    try {
      await forgotPassword(submittedEmail)
      setRequestState("success")
      setResendSuccess(true)
      startCooldown()
    } catch (error: any) {
      console.warn("Resend reset link failed:", error)
      const backendMessage =
        error.response?.data?.message ||
        "Could not resend reset link. Please try again."
      setErrorMessage(backendMessage)
      setRequestState("error")
    }
  }

  return (
    <main className="min-h-svh overflow-x-hidden bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackToHomeButton />
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700">
                <Compass size={18} className="text-white" />
              </span>
              <span className="font-semibold tracking-tight text-white hidden sm:inline">
                Opportunity Radar
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

      {/* Main Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="w-full max-w-md">
          {/* =============================================================== */}
          {/* SUCCESS SCREEN: Email found in DB & reset link dispatched       */}
          {/* =============================================================== */}
          {requestState === "success" ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-6 sm:p-8 text-center shadow-2xl ring-1 ring-emerald-500/20 animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900/30 text-emerald-400 ring-8 ring-emerald-950/40">
                <CheckCircle2 size={32} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Password Reset Link Sent
              </h1>
              <p className="text-sm leading-relaxed text-slate-300 mb-4">
                We found your account and sent a secure password reset link to:
              </p>

              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
                <Mail size={14} className="shrink-0 text-slate-400" />
                <span className="truncate font-mono text-xs font-semibold text-cyan-300">
                  {submittedEmail}
                </span>
              </div>

              <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left text-xs leading-relaxed text-slate-400 space-y-2">
                <p>
                  • Click the link in the email to choose a new password.
                </p>
                <p>
                  • The reset link is valid for a limited time for your account security.
                </p>
                <p>
                  • If you don&apos;t see the email, please check your <span className="font-semibold text-slate-200">spam or junk folder</span>.
                </p>
              </div>

              {resendSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 text-left">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>A fresh password reset link has been sent to your email.</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={() =>
                    navigate("/login", { state: { email: submittedEmail } })
                  }
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5 cursor-pointer shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Return to Login</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={cooldown > 0}
                  onClick={handleResend}
                  className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 cursor-pointer disabled:opacity-50 text-xs py-4 flex items-center justify-center gap-2"
                >
                  {cooldown > 0 ? (
                    <>
                      <Loader2 size={14} className="animate-spin opacity-50" />
                      <span>Resend available in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Resend password reset link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* INPUT FORM SCREEN: Ask for email & check database                */
            /* =============================================================== */
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-2xl">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/40 text-blue-300 ring-1 ring-blue-700/50">
                  <Mail size={24} aria-hidden="true" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                  Forgot your password?
                </h1>
                <p className="text-sm leading-relaxed text-slate-400">
                  Enter your email address below. We&apos;ll check our database and send you a secure link to reset your password.
                </p>
              </div>

              {/* Error Alert if email not in DB or other failure */}
              {errorMessage && (
                <div
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-300 ring-1 ring-rose-500/20"
                  role="alert"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">{errorMessage}</div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage("")}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={emailId} className="text-xs font-semibold text-slate-200">
                    Email address
                  </label>
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={requestState === "submitting"}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errorMessage) setErrorMessage("")
                    }}
                    placeholder="you@example.com"
                    className={cn(
                      "h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 transition-colors",
                      errorMessage && "border-rose-500 ring-2 ring-rose-500/30 focus-visible:ring-rose-500"
                    )}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={requestState === "submitting"}
                  className="mt-2 w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-5 text-sm cursor-pointer shadow-lg shadow-blue-900/30 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {requestState === "submitting" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Checking database & sending link...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send reset link</span>
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to login</span>
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
