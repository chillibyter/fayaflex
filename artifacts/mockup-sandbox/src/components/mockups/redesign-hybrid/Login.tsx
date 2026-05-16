import { MobileFrame } from "./_shared/MobileFrame";
import { Flame } from "lucide-react";

export function Login() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full px-6 pt-24 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center -mt-20">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <Flame className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">FayaFlex</h1>
          <p className="text-zinc-400 font-medium tracking-wide">FUEL YOUR FIRE</p>
        </div>
        
        <div className="w-full space-y-4">
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          
          <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-colors">
            Log In
          </button>
          
          <div className="text-center py-2">
            <span className="text-sm text-zinc-500">or</span>
          </div>
          
          <button className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
            Continue with Google
          </button>
          
          <button className="w-full bg-zinc-900 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800 transition-colors mt-2">
            Use Face ID / Passkey
          </button>
        </div>
        
        <div className="mt-8 flex items-center justify-between text-sm px-2 font-medium">
          <button className="text-zinc-500 hover:text-white transition-colors">Forgot password?</button>
          <button className="text-emerald-400 hover:text-emerald-300 transition-colors">Sign up</button>
        </div>
      </div>
    </MobileFrame>
  );
}