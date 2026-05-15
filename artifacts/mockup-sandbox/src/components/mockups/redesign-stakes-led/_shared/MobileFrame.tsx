import { ReactNode } from "react";
import { Battery, Wifi, Signal, Bell, Settings } from "lucide-react";

export function MobileFrame({ children, title, showRightIcons = true }: { children: ReactNode, title?: string, showRightIcons?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <div className="relative w-[390px] h-[844px] bg-zinc-950 text-zinc-100 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-zinc-900 flex flex-col stakes-led-theme">
        {/* Status Bar */}
        <div className="h-12 px-6 flex items-center justify-between text-xs font-medium z-50 shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-5 h-5" />
          </div>
        </div>

        {/* Top App Bar */}
        {title && (
          <div className="h-14 px-4 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur z-40 shrink-0 border-b border-zinc-900">
            <div className="text-lg font-semibold">{title}</div>
            {showRightIcons && (
              <div className="flex items-center gap-4 text-zinc-400">
                <Bell className="w-5 h-5" />
                <Settings className="w-5 h-5" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetContent={{__html: `::-webkit-scrollbar { display: none; }`}} />
          {children}
        </div>
      </div>
    </div>
  );
}
