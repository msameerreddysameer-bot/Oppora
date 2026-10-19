import { Compass } from "lucide-react";
import { Link } from "react-router-dom";


export default function FooterSection() {
  return (
    <div className="bg-slate-900 max-w-7xl mx-auto ">
       
        
            <div className="px-2.5 py-14  lg:grid lg:grid-cols-2 gap-4">
            <div className="flex flex-col  gap-4 ">
                <div className="flex flex-row gap-4">
                    <div className="w-9 h-9  bg-blue-900 rounded-xl flex items-center justify-center">
                        <Compass></Compass>
                    </div>

                    <div className="text-white font-bold">Opportunity Radar</div>
                </div>

                <p className="text-gray-400 leading-relaxed">A platform for college students to discover, save, and track scholarships, internships, fellowships, and more.</p>
            </div>

            <div className="py-9 grid grid-cols-2 lg: col-span-2 lg:grid-cols-3 lg:gap-12 items-start gap-9">

                <div className="flex flex-col  items-start gap-4">
                    <h4 className="text-white font-semibold ">Explore</h4>
                    <ol className="text-gray-400 flex flex-col gap-2 ">
                        <li className="hover:text-white">All Opportunities</li>
                        <li className="hover:text-white">Scholarships</li>
                        <li className="hover:text-white">internships</li>
                        <li className="hover:text-white">Hackathon</li>
                        <li className="hover:text-white">Fellowships</li>
                        <li className="hover:text-white">Research</li>
                    </ol>
                </div>

                <div className="flex flex-col items-start gap-4">
                    <h4 className="text-white font-semibold ">Platform</h4>
                    <ol className="text-gray-400 flex flex-col gap-2 ">
                        <li className="hover:text-white">How it works</li>
                        <li className="hover:text-white">Saved Opportunities</li>
                        <li className="hover:text-white">Application Tracker</li>
                        <li className="hover:text-white">My Profile</li>
                       
                    </ol>
                </div>

                  <div className="flex flex-col items-start gap-4">

                    <h4 className="text-white font-semibold ">Account</h4>
                    <ol className="text-gray-400 flex flex-col gap-2 ">
                        <Link to="/login" className="hover:text-white">Login</Link>
                        <Link to="/signup" className="hover:text-white">Sign Up</Link>
                        <li className="hover:text-white">Forgot Password</li>
                         <Link to="/signup" className="flex items-center justify-center  px-6 py-4 my-6 bg-blue-800 rounded-xl text-white font-bold text-xs ">Get Started ➝</Link>
                      
                       
                    </ol>
                </div>

        </div>
            </div>

            {/* <hr className="border-slate-600"></hr> */}


        
        </div>
      
    
  )
}
