// import React from 'react'

import { Bookmark, CircleCheck, ExternalLink, Search } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <div className="bg-slate-900  max-w-7xl mx-auto">
      <div className="py-14 px-2.5">
        <div>
          <h2 className="text-2xl  text-white font-bold py-4">How it Works</h2>
          <p className="text-gray-400 leading-relaxed">
            Oppora helps you discover and stay organized. The actual
            application happens on the official program website.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-0 py-10">
          <div className="flex gap-4 ">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                <Search className="text-white"></Search>
              </div>
              <div className="bg-slate-700 md:hidden  w-px min-h-20"></div>
            </div>

            <div>
              <div className="flex gap-3">
                <span className="text-gray-400">01</span>
                <h3 className="text-white font-bold">Discover</h3>
              </div>
              <p className="text-gray-400 leading-relaxed py-2">
                Browse scholarships, internships, hackathons, fellowships, and
                more — all in one place.
              </p>
            </div>
          </div>

          <div className="flex gap-4 py-1">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                <Bookmark className="text-white"></Bookmark>
              </div>
              <div className="bg-slate-700  md:hidden  w-px min-h-20"></div>
            </div>

            <div>
              <div className="flex gap-3">
                <span className="text-gray-400">02</span>
                <h3 className="text-white font-bold">Save</h3>
              </div>
              <p className="text-gray-400 leading-relaxed py-2">
                Bookmark opportunities you're interested in. Come back to them
                anytime without losing track.
              </p>
            </div>
          </div>

          <div className="flex gap-4 py-1">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                <ExternalLink className="text-white"></ExternalLink>
              </div>
              <div className="bg-slate-700  md:hidden  w-px min-h-20"></div>
            </div>

            <div>
              <div className="flex gap-3">
                <span className="text-gray-400">03</span>
                <h3 className="text-white font-bold">Apply</h3>
              </div>
              <p className="text-gray-400 leading-relaxed py-2">
                Visit the official application website directly. Opportunity
                Radar links you to the source — you apply there.
              </p>
            </div>
          </div>

          <div className="flex gap-4 py-1">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                <CircleCheck className="text-white"></CircleCheck>
              </div>
            </div>

            <div>
              <div className="flex gap-3">
                <span className="text-gray-400">04</span>
                <h3 className="text-white font-bold">Track</h3>
              </div>
              <p className="text-gray-400 leading-relaxed py-2">
                Manually mark your application status and keep a clear record of
                everything you applied to.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
