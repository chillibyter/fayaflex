import "./_group.css";
import { Flame, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { FlameCanvas, calorieIntensity } from "./_flameCanvas";

function tierFor(intensity: number): { flames: number; label: string } {
  if (intensity < 0.2) return { flames: 1, label: "Ember" };
  if (intensity < 0.45) return { flames: 2, label: "Burning" };
  if (intensity < 0.75) return { flames: 3, label: "Roaring" };
  return { flames: 4, label: "Inferno" };
}

function FlameBadgeChip({ intensity }: { intensity: number }) {
  const tier = tierFor(intensity);
  const size = 64 + intensity * 28;
  return (
    <div
      className="relative flex-shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size, height: size,
        background: "radial-gradient(circle at 30% 25%, #2a2a2a 0%, #1a1a1a 70%)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1.5px rgba(255,106,0,${0.4 + intensity * 0.5}), 0 0 ${10 + intensity * 30}px rgba(255,90,0,${0.25 + intensity * 0.45})`,
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <FlameCanvas intensity={intensity} width={size} height={size} anchorX={0.5} anchorY={0.85} />
      </div>
      <div className="relative z-[1] flex items-end gap-[1px]">
        {Array.from({ length: tier.flames }).map((_, i) => (
          <Flame
            key={i}
            className="text-orange-400"
            style={{
              width: 14 + i * 3,
              height: 14 + i * 3,
              filter: `drop-shadow(0 0 ${4 + intensity * 6}px rgba(255,106,0,${0.6 + intensity * 0.4}))`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Card({ calories, duration, distance }: { calories: number; duration: string; distance: string }) {
  const intensity = calorieIntensity(calories);
  const tier = tierFor(intensity);
  return (
    <div className="w-full max-w-[420px]">
      <div
        className="relative rounded-3xl p-7 text-white"
        style={{
          background: "linear-gradient(165deg,#353535 0%,#262626 35%,#1a1a1a 100%)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.75)",
          overflow: "visible",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <div className="text-[24px] font-black tracking-[0.3px]">Running</div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-[3px] text-[10px] font-bold tracking-[2px] uppercase text-orange-500">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FlameBadgeChip intensity={intensity} />
            <div className="text-[9px] font-bold tracking-[2px] uppercase text-orange-400">{tier.label}</div>
          </div>
        </div>

        <div className="flex gap-2.5">
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
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.55)",
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

export default function FlameBadge() {
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
