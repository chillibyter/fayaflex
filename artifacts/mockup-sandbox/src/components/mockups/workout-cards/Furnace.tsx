import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain, Crown } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** Furnace — full-bleed dark card. The flame becomes the dominant visual,
 *  scaled and glow-haloed by calories burned. The day's leader gets a giant
 *  flickering flame and a "furnace" rim glow. */
function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);
  const flameSize = 60 + intensity * 90; // 60..150
  const isLeader = !!isCalorieLeader;

  const stats = [
    workout.duration && { icon: Clock, label: "Time", value: workout.duration },
    workout.distance && { icon: MapPin, label: "Distance", value: workout.distance },
    workout.avgHr && { icon: Heart, label: "Avg HR", value: workout.avgHr },
    workout.steps && { icon: Footprints, label: "Steps", value: workout.steps },
    workout.elevation && { icon: Mountain, label: "Elev", value: workout.elevation },
    workout.speed && { icon: Gauge, label: "Pace", value: workout.speed },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, rgba(255,${100 + intensity * 80},20, ${0.18 + intensity * 0.35}) 0%, transparent 55%), linear-gradient(180deg, #18100c 0%, #0a0706 100%)`,
        boxShadow: isLeader
          ? `0 0 0 1px rgba(255,170,60,0.5), 0 30px 80px -20px rgba(255,120,30,${0.35 + intensity * 0.4})`
          : "0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Ember field background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 90%, rgba(255,120,30,0.18), transparent 40%), radial-gradient(circle at 80% 95%, rgba(255,80,20,0.22), transparent 45%)",
        }}
      />

      {isLeader && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-400/90 text-amber-950 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-lg ring-1 ring-amber-200">
          <Crown className="h-3 w-3" /> Hottest today
        </div>
      )}

      <div className="relative px-5 pt-5 pb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-orange-200/70 font-bold">
          {workout.type.toUpperCase()} · WORKOUT
        </div>
      </div>

      {/* Hero flame block */}
      <div className="relative flex items-end justify-center pt-2 pb-4 px-4" style={{ minHeight: 180 }}>
        <AnimatedFlame size={flameSize} intensity={intensity} />
      </div>

      {/* Calorie counter — type-on-flame */}
      <div className="relative text-center pb-5">
        <div
          className="font-extrabold tabular-nums leading-none tracking-tight"
          style={{
            fontSize: 56 + intensity * 18,
            color: isLeader ? "#fff5d6" : "#ffe4b8",
            textShadow: `0 0 ${10 + intensity * 30}px rgba(255,150,40,${0.4 + intensity * 0.5})`,
          }}
        >
          {workout.caloriesNum?.toLocaleString() ?? "0"}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-orange-200/80 font-semibold">
          calories burned
        </div>
      </div>

      {/* Stats row */}
      <div
        className="relative grid grid-cols-3 gap-px bg-white/5 border-t border-white/5"
        style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        {stats.slice(0, 3).map((s) => (
          <div key={s.label} className="bg-black/40 px-3 py-3 text-center">
            <s.icon className="h-3.5 w-3.5 text-orange-200/70 mx-auto mb-1" />
            <div className="text-sm font-bold tabular-nums">{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Furnace() {
  return (
    <div className="min-h-screen bg-[#0a0706] p-6 font-sans">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-xs uppercase tracking-[0.2em] text-orange-200/60 font-semibold">
          Furnace — calories lead, the flame is the metric
        </div>
        {SAMPLE_FEED.map((s, i) => (
          <Card
            key={i}
            workout={s.workout}
            personalBests={s.pb}
            topCaloriesOfDay={TOP_CAL_OF_DAY}
            isCalorieLeader={s.isLeader}
          />
        ))}
      </div>
    </div>
  );
}
