import { MobileFrame } from "./_shared/MobileFrame";
import { Flame } from "lucide-react";

export function Login() {
  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-zinc-950 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-12 z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FayaFlex</h1>
          <p className="text-zinc-400 text-center text-sm">Burn together. Build together.</p>
        </div>

        <div className="w-full space-y-4 z-10">
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors">
            Sign In
          </button>
          
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="h-px flex-1 bg-zinc-800"></div>
            <span className="text-xs text-zinc-500 font-medium">OR</span>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>

          <button className="w-full bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button className="w-full bg-zinc-900 border border-zinc-800 text-white font-medium py-3 rounded-full flex items-center justify-center gap-2 mt-4 text-sm mx-auto max-w-[200px]">
            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Use Face ID / Passkey
          </button>
        </div>

        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6 text-sm">
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">Forgot password?</a>
          <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign up</a>
        </div>
      </div>
    </MobileFrame>
  );
}
