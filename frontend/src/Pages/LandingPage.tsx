import CategoriesSection from "../components/CategoriesSection";
import FinalCTASection from "../components/FinalCTASection";
import FooterSection from "../components/FooterSection";
import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import Navbar from "../components/Navbar";
import TrustSection from "../components/TrustSection";
import WhySection from "../components/WhySection";

export default function LandingPage() {
  return (
    <div>
      <div className=" min-h-screen bg-slate-900 overflow-x-hidden">
        <Navbar />
        <hr className="border-gray-600  mx-auto"></hr>
        <HeroSection />
        <CategoriesSection />
        <HowItWorksSection />
        <WhySection />
        <TrustSection />
        <FinalCTASection />
        <FooterSection />
      </div>
    </div>
  );
}
