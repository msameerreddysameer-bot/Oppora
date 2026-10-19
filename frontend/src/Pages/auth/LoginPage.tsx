import { Compass } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Link } from "react-router-dom";
import { BackToHomeButton } from "@/components/BackToHomeButton";

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-slate-900">
      <nav
        className="bg-slate-900 h-16 px-4 flex items-center justify-between sticky top-0 z-20 max-w-7xl mx-auto border-b border-slate-800/80"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <BackToHomeButton />
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-85">
            <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center">
              <Compass className="text-white" />
            </div>
            <span className="text-white font-semibold hidden md:inline">Opportunity Radar</span>
          </Link>
        </div>

        <div className="flex flex-rows items-center justify-between gap-4">
          <span className="text-slate-400 hidden md:inline">
            Don't have an account?
          </span>
          <Link to="/signup" className="text-white border border-slate-500 py-2 px-4 rounded-lg  hover:bg-slate-800">
            Signup
          </Link>
        </div>
      </nav>
      <hr className="border-slate-700"></hr>

      <div className="min-h-[calc(100svh-4rem)] lg:grid lg:grid-cols-2">
        <div className="hidden min-h-[calc(100svh-4rem)] bg-slate-950 p-16 lg:flex lg:items-center xl:p-24">
          <div className="flex flex-col gap-12 max-w-sm">
            <div className="w-12 h-12  bg-blue-900 rounded-4xl flex items-center justify-center">
              <Compass className="text-white"></Compass>
            </div>
            <h2 className="text-white text-3xl font-bold ">
              Every opportunity,<br></br>in one place.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Scholarships, internships, hackathons, fellowships, and research
              programs — organized so you can spend more time applying and less
              time searching.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                Scholarships
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                internships
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                Hackathons
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                Fellowships
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                Research
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                Open Source
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                competitions
              </span>

              <span className="py-1.5 px-3 text-xs rounded-2xl border border-slate-400 text-white">
                workships
              </span>
            </div>
          </div>
        </div>
        <div className="">
          <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 bg-slate-900 p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
