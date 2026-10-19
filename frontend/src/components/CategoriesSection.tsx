// import React from 'react'

import { BookOpen, Briefcase, CodeXml, FlaskConical, GitBranch, GraduationCap, Star, Trophy } from "lucide-react";

export default function CategoriesSection() {
  return (
    <div className="w-full bg-slate-800">
    <div className="bg-slate-800 max-w-7xl mx-auto">
      <div className="py-12 px-2.5">
        <h2 className="text-3xl text-white ">What you can find here</h2>
        <p className="text-gray-500 leading-relaxed py-3">
          Eight categories of student opportunities, curated and kept up to
          date.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div className="bg-slate-700 w-full flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <GraduationCap   className="text-blue-400"></GraduationCap>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Scholarships</h3>
          </div>
        

         
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <Briefcase  className="text-blue-400"></Briefcase>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">internships</h3>
          </div>
        

         
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <CodeXml  className="text-blue-400"></CodeXml>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Hackathon</h3>
          </div>
        
         
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
             <Trophy  className="text-blue-400"></Trophy>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">competitions</h3>
          </div>
        
        
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <Star  className="text-blue-400"></Star>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Fellowships</h3>
          </div>
        
         
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <FlaskConical  className="text-blue-400"></FlaskConical>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Research</h3>
          </div>
        
        
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
              <BookOpen  className="text-blue-400"></BookOpen>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Workshops</h3>
          </div>
        
     
          <div className="bg-slate-700 w-full  flex flex-col rounded-xl   hover:border-blue-800 hover:border  hover:cursor-pointer">
            <div className="mt-4 mx-5">
            <div className="bg-blue-900 w-9 h-9 ml-2 rounded-lg flex items-center justify-center">
             <GitBranch  className="text-blue-400"></GitBranch>
            </div>
            </div>
            <h3 className="py-3 px-7 text-white">Open Source</h3>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
