import { Battery, Signal, Wifi } from "lucide-react";
import React from "react";

export function MobileFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="relative w-[390px] h-[844px] bg-zinc-950 rounded-[44px] shadow-2xl overflow-hidden border-8 border-zinc-900 ring-1 ring-zinc-800 flex flex-col font-['Inter']">
        {/* Status Bar */}
        <div className="absolute top-0 inset-x-0 h-12 flex justify-between items-center px-6 pt-2 z-50 text-white pointer-events-none">
          <div className="text-[15px] font-semibold tracking-tight">9:41</div>
          <div className="flex gap-1.5 items-center">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-6 h-6" />
          </div>
        </div>

        {/* Dynamic Island Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-7 bg-black rounded-full z-50 pointer-events-none"></div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col w-full h-full overflow-hidden ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
