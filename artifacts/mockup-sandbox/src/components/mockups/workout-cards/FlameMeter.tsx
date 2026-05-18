import "./_group.css";
import { Flame, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { FlameCanvas, calorieIntensity } from "./_flameCanvas";

function Card({ calories, duration, distance }: { calories: number; duration: string; distance: string }) {
  const intensity = calorieIntensity(calories);
  const fillPct = 20 + intensity * 75;

  return (
    <div className="w-full max-w-[420px]">
      <div
        className="relative rounded-3xl p-7 text-white"
        style={{
          background: "linear-gradient(165deg,#353535 0%,#262626 35%,#1a1a1a 100%)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.75)",
        }}
      >
        <div className="text-center mb-6">
          <div className="text-[26px] font-black tracking-[0.3px]">Running</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-[3px] text-[10px] font-bold tracking-[2px] uppercase text-orange-500">
            <CheckCircle2 className="h-3 w-3" /> Workout Completed
          </div>
        </div>

        <div className="flex gap-2.5">
          {/* Calorie panel — flame fills from bottom */}
          <div
            className="relative flex-1 rounded-2xl text-center overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#343434 0%,#272727 45%,#1c1c1c 100%)",
              boxShadow: `inset 0 0 0 1px rgba(255,106,0,${0.2 + intensity * 0.35}), 0 6px 14px rgba(0,0,0,0.55)`,
              height: 140,
            }}
          >
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: `${fillPct}%` }}
            >
              <FlameCanvas intensity={intensity} width={120} height={Math.round(140 * fillPct / 100)} anchorX={0.5} anchorY={0.95} />
            </div>
            <div className="relative z-[1] flex flex-col items-center justify-end h-full pt-3 pb-3 px-2">
              <Flame className="h-5 w-5 text-orange-400 mb-1" style={{ filter: "drop-shadow(0 1px 4px rgba(255,106,0,0.6))" }} />
              <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-zinc-300 mb-1">Calories</div>
              <div className="flex items-baseline gap-[3px]">
                <span className="text-[26px] font-black leading-none text-white tabular-nums" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{calories}</span>
                <span className="text-xs font-medium text-zinc-300">cal</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <Side icon={Clock} label="Time" value={duration} />
            <Side icon={MapPin} label="Dist" value={distance} unit="km" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Side({
  icon: Icon, label, value, unit,
}: { icon: typeof Flame; label: string; value: string; unit?: string }) {
  return (
    <div
      className="relative flex-1 rounded-2xl px-3 py-3 text-center"
      style={{
        background: "linear-gradient(160deg,#343434 0%,#272727 45%,#1c1c1c 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.55)",
      }}
    >
      <Icon className="mx-auto mb-1 h-4 w-4 text-zinc-300" />
      <div className="text-[9px] font-bold tracking-[1.6px] uppercase text-zinc-400 mb-1">{label}</div>
      <div className="flex items-baseline justify-center gap-[3px]">
        <span className="text-[18px] font-extrabold leading-none text-white tabular-nums">{value}</span>
        {unit && <span className="text-[11px] font-medium text-zinc-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function FlameMeter() {
  return (
    <div
      className="min-h-screen flex flex-col items-center gap-8 py-10 px-6"
      style={{ background: "radial-gradient(ellipse at 60% 40%, #1c1008 0%, #0d0d0d 70%)" }}
    >
      <Tier label="Light · 250 cal" cal={250} dur="22m" dist="2.4" />
      <Tier label="Solid · 750 cal" cal={750} dur="55m" dist="7.1" />
      <Tier label="Beast · 1500 cal" cal={1500} dur="1h 45m" dist="12.5" />
    </div>
  );
}

function Tier({ label, cal, dur, dist }: { label: string; cal: number; dur: string; dist: string }) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-zinc-500">{label}</div>
      <Card calories={cal} duration={dur} distance={dist} />
    </div>
  );
}
