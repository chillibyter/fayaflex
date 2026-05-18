import "./_group.css";
import { Flame, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { FlameCanvas, calorieIntensity } from "./_flameCanvas";

function Card({ calories, duration, distance }: { calories: number; duration: string; distance: string }) {
  const intensity = calorieIntensity(calories);
  const flameH = 140 + intensity * 220;

  return (
    <div className="w-full max-w-[420px]">
      <div
        className="relative rounded-3xl p-7 pt-[120px] text-white"
        style={{
          background: "linear-gradient(165deg,#353535 0%,#262626 35%,#1a1a1a 100%)",
          boxShadow: `0 0 ${40 + intensity * 100}px rgba(255,90,0,${0.15 + intensity * 0.35}), 0 18px 48px rgba(0,0,0,0.75)`,
          overflow: "visible",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -flameH * 0.55, width: 320, height: flameH, zIndex: 0 }}
        >
          <FlameCanvas intensity={intensity} width={320} height={flameH} anchorX={0.5} anchorY={0.95} />
        </div>

        <div className="relative z-[1] text-center mb-6">
          <div className="text-[26px] font-black tracking-[0.3px]">Running</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-[3px] text-[10px] font-bold tracking-[2px] uppercase text-orange-500">
            <CheckCircle2 className="h-3 w-3" /> Workout Completed
          </div>
        </div>

        <div className="relative z-[1] flex gap-2.5">
          <Metric icon={Flame} label="Calories" value={String(calories)} unit="cal" emphasized />
          <Metric icon={Clock} label="Time" value={duration} />
          <Metric icon={MapPin} label="Distance" value={distance} unit="km" />
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon, label, value, unit, emphasized,
}: { icon: typeof Flame; label: string; value: string; unit?: string; emphasized?: boolean }) {
  return (
    <div
      className="relative flex-1 rounded-2xl px-3 py-4 text-center"
      style={{
        background: "linear-gradient(160deg,#343434 0%,#272727 45%,#1c1c1c 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.55)",
      }}
    >
      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${emphasized ? "text-orange-400" : "text-zinc-300"}`} />
      <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-zinc-400 mb-2">{label}</div>
      <div className="flex items-baseline justify-center gap-[3px]">
        <span className="text-[22px] font-extrabold leading-none text-white tabular-nums">{value}</span>
        {unit && <span className="text-xs font-medium text-zinc-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function FlameHero() {
  return (
    <div
      className="min-h-screen flex flex-col items-center gap-12 py-16 px-6"
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
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-zinc-500">{label}</div>
      <Card calories={cal} duration={dur} distance={dist} />
    </div>
  );
}
