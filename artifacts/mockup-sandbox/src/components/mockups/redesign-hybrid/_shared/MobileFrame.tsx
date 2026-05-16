import { ReactNode } from "react";
import { Battery, Wifi, Signal } from "lucide-react";
import "./_group.css";

export function MobileFrame({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <div className={`relative w-[390px] h-[844px] bg-zinc-950 text-zinc-100 rounded-[44px] overflow-hidden shadow-2xl border-[8px] border-zinc-900 flex flex-col hybrid-theme ring-1 ring-zinc-800 ${className}`}>
        {/* Status Bar */}
        <div className="h-12 px-6 flex items-center justify-between text-xs font-semibold z-50 shrink-0 pointer-events-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-6 h-6" />
          </div>
        </div>
        
        {/* Dynamic Island Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-7 bg-black rounded-full z-50 pointer-events-none"></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}