import { Link } from "react-router-dom";


export default function FinalCTASection() {
  return (
    <div className="w-full bg-blue-900">
    <div className="bg-blue-900 max-w-7xl mx-auto">

      <div className="px-2.5 py-16 flex flex-col items-center gap-6">
        <h2 className="text-2xl text-white font-bold">Find your next opportunity.</h2>
        <p className="text-gray-400 px-18 leading-relaxed">Scholarships, internships, fellowships and more — in one organized place.</p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
        <button className="flex items-center justify-center  px-10 py-4 bg-white rounded-xl text-blue-800 font-bold transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 ">Explore Opportunities ➝</button>
        
        <Link to="/signup" className="flex items-center justify-center  px-19 py-4 bg-blue-800 rounded-xl text-white font-bold transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 ">Create an Account</Link>
      </div>

      </div>
      
    </div>
    </div>
  )
}