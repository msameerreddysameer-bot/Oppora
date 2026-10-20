// import React from 'react'

import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <div>
      <div className="bg-slate-900 px-2.5 py-17 max-w-7xl mx-auto">
        <div
          className="bg-blue-900 w-69
         rounded-full flex items-center gap-2.5"
        >
          <span className="text-blue-400 text-xs px-1">· Scholarships</span>
          <span className="text-blue-400 text-xs">· Hackathons </span>
          <span className="text-blue-400 text-xs">· internships </span>
        </div>

        <h1 className="text-5xl lg:text-6xl  text-white py-7  max-w-3xl font-semibold ">
          Find every opportunity
          <span className="text-blue-600"> built for students.</span>
        </h1>
        <p className="text-gray-400 leading-relaxed mb-7 max-w-xl ">
          Oppora brings scholarships, internships, hackathons,
          fellowships, and research programs into one place — so you spend less
          time searching and more time applying.
        </p>

        <Link
          to="/signup"
          className="text-white bg-blue-700 px-4 py-2   mt-6 rounded-xl"
        >
          Create a free account
        </Link>
        <hr className="border-gray-600 mt-14"></hr>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <div>
            <div className="text-xl text-white">8+</div>
            <div className="text-gray-400">Opportunity types</div>
          </div>
          <div>
            <div className="text-xl text-white">One place</div>
            <div className="text-gray-400">For all your searches</div>
          </div>
          <div>
            <div className="text-xl text-white">Free</div>
            <div className="text-gray-400">To use, always</div>
          </div>
          <div>
            <div className="text-xl text-white">Official</div>
            <div className="text-gray-400">source only</div>
          </div>
        </div>
      </div>
    </div>
  );
}
