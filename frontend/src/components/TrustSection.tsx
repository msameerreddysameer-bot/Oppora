import { ExternalLink, Globe, Lock } from "lucide-react";

export default function TrustSection() {
  return (
    <div className="bg-slate-900 max-w-7xl mx-auto">
      <div className="py-12 px-2.5 lg:grid lg:grid-cols-2 lg:items-center gap-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-white text-3xl">
            Opportunities link to their official source.
          </h3>
          <p className="text-gray-400   leading-relaxed">
            Every listing on Opportunity Radar includes a link to the official
            program website or application portal. You always know exactly where
            to apply — and you apply there, not here.
          </p>
          <p className="text-gray-600  text-xs  leading-relaxed ">
            Opportunity Radar does not claim to verify every listing
            independently. Always review the official source before applying.
          </p>
        </div>

        <div className=" py-9 grid grid-cols-1 gap-4">
            <div className="bg-slate-800  rounded-xl px-4 py-5 flex flex-row  items-start gap-4 ">
                <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Globe className="text-blue-400"></Globe>
                </div>
                <div className="flex flex-col">
                    <h4 className="text-white font-bold">Official source URL</h4>
                    <p className="text-gray-400 leading-relaxed py-1">Links to the primary program or organization page.</p>
                </div>


            </div>

            <div className="bg-slate-800  rounded-xl px-4 py-5 flex flex-row  items-start gap-4 ">
                <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                  <ExternalLink className="text-blue-400"></ExternalLink>
                </div>
                <div>
                    <h4 className="text-white font-bold">Direct application link</h4>
                    <p className="text-gray-400 leading-relaxed py-1">Opens the official application portal in a new tab.</p>
                </div>


            </div>

            <div className="bg-slate-800  rounded-xl px-4 py-5 flex flex-row  items-start gap-4 ">
                <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Lock className="text-blue-400"></Lock>
                </div>
                <div>
                    <h4 className="text-white font-bold">Opportunity status</h4>
                    <p className="text-gray-400 leading-relaxed py-1">Shows whether a listing is open, closing soon, or past deadline.</p>
                </div>


            </div>
        </div>
      </div>
    </div>
  );
}
