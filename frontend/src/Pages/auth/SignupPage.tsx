import { Check } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import { Link } from "react-router-dom";
import { BackToHomeButton } from "@/components/BackToHomeButton";

export default function SignupPage() {
  return (
    <div className="min-h-svh bg-slate-900">
      <nav className="bg-slate-900 h-16 px-4 flex items-center justify-between sticky top-0 z-20 max-w-7xl mx-auto border-b border-slate-800/80">
        <div className="flex items-center gap-3 sm:gap-4">
          <BackToHomeButton />
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <div className="w-9 h-9 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md shadow-slate-950/40">
              <img
                src="/oppora-logo.svg"
                alt="Oppora Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white font-semibold hidden md:inline">
              Oppora
            </span>
          </Link>
        </div>

        <div className="flex flex-rows items-center justify-between gap-4">
          <span className="text-slate-400 hidden md:inline">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="text-white border border-slate-500 py-2 px-4 rounded-lg  hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </nav>
      <hr className="border-slate-700"></hr>

      <div className="min-h-[calc(100svh-4rem)] lg:grid lg:grid-cols-2">
        <div className="hidden min-h-[calc(100svh-4rem)] bg-slate-950 p-16 lg:flex lg:items-center xl:p-24">
          <div className="flex flex-col gap-12 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-slate-950/40">
              <img
                src="/oppora-logo.svg"
                alt="Oppora Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-white text-3xl font-bold ">
              Start discovering<br></br>what's out there.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Create your free account and get access to scholarships,
              internships, fellowships, hackathons, and more — organized in one
              place.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-row  items-center justify-start gap-4">
                <div className="bg-blue-900 w-12 h-12 flex items-center justify-center rounded-4xl">
                  <Check className="text-white"></Check>
                </div>

                <span className="text-white text-xl ">Create your account</span>
              </div>

              <div className="flex flex-row items-center justify-start gap-4">
                <div className="bg-blue-900 w-12 h-12 flex items-center justify-center rounded-4xl text-slate-400">
                  02
                </div>

                <span className=" text-xl text-slate-400">
                  Verify your email address
                </span>
              </div>

              <div className="flex flex-row items-center justify-start gap-4">
                <div className="bg-blue-900 w-12 h-12 flex items-center justify-center rounded-4xl text-slate-400">
                  03
                </div>

                <span className=" text-xl text-slate-400">
                  Explore and save opportunities
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 bg-slate-900 p-6 md:p-10">
          <div className="flex w-full max-w-2xl flex-col gap-3">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
