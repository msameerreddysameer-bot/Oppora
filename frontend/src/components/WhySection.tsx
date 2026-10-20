// import React from "react"

import {
  Calendar,
  CircleCheck,
  Globe,
  Layers,
  Save,
  Sparkles,
} from "lucide-react";

export default function WhySection() {
  return (
    <div className="w-full bg-slate-800">
      <div className="bg-slate-800 max-w-7xl mx-auto">
        <div className="py-17">
          <div className="px-2.5">
            <h2 className="text-3xl text-white">Why Oppora</h2>
            <p className="text-gray-300 py-3">
              Built around what students actually need when searching for
              opportunities.
            </p>
          </div>

          <div className="px-2.5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <Layers className="text-blue-400"></Layers>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">
                  Everything in one place
                </h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  Find scholarships, internships, fellowships, and more —
                  without searching across dozens of websites.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <Save className="text-blue-400"></Save>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">Save for later</h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  Bookmark opportunities you want to revisit. Never lose track
                  of something that looked interesting.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <CircleCheck className="text-blue-400"></CircleCheck>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">
                  Track your applications
                </h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  Keep a personal record of the opportunities you applied to and
                  what stage they are in.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <Calendar className="text-blue-400"></Calendar>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">Clear deadlines</h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  Every opportunity shows its deadline prominently so you always
                  know how much time you have.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <Globe className="text-blue-400"></Globe>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">
                  Direct to the official source
                </h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  Each listing links to the official application or program
                  website so you always apply through the right channel.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                <Sparkles className="text-blue-400"></Sparkles>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-white">
                  Organized, not overwhelming
                </h3>
                <p className="text-gray-400 leading-relaxed py-2">
                  A clean interface built around information that matters — so
                  you spend time on opportunities, not hunting for them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
