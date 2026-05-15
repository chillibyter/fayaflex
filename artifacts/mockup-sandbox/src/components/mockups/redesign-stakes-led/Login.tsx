import { MobileFrame } from "./_shared/MobileFrame";
import "./_group.css";
import { Flame } from "lucide-react";

export function Login() {
  return (
    <MobileFrame showRightIcons={false}>
      <div className="flex flex-col h-full px-6 pt-20 pb-8">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">FayaFlex</h1>
          <p className="text-zinc-400 text-center">Track workouts. Crush your team. Win stakes.</p>
        </div>
        
        <div className="space-y-4 w-full mt-12">
          <div className="space-y-3">
            <input type="email" placeholder="Email address" className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500" />
            <input type="password" placeholder="Password" className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500" />
          </div>
          
          <button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
            Sign In
          </button>
          
          <div className="relative py-4 flex items-center">
            <div className="flex-1 border-t border-zinc-800"></div>
            <span className="px-4 text-xs text-zinc-500 uppercase tracking-wider font-semibold">Or</span>
            <div className="flex-1 border-t border-zinc-800"></div>
          </div>
          
          <button className="w-full h-12 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
            Continue with Google
          </button>
          
          <button className="w-full h-12 bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
            Use Face ID / Passkey
          </button>
        </div>
        
        <div className="mt-8 flex items-center justify-between text-sm text-zinc-400 font-medium w-full">
          <button className="hover:text-zinc-300">Forgot password?</button>
          <button className="text-emerald-500 hover:text-emerald-400">Sign up</button>
        </div>
      </div>
    </MobileFrame>
  );
}
