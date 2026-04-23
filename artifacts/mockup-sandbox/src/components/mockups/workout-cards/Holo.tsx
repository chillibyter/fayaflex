import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain, Zap } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** Holo — glassmorphic, iridescent neo-card.
 *  Holographic mesh background, frosted glass surfaces, cyan/magenta accents.
 *  The flame sits inside a glass orb with refractive halos. */
function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);
  const flameSize = 56 + intensity * 36;
  const isLeader = !!isCalorieLeader;

  const stats = [
    workout.duration && { icon: Clock, label: "TIME", value: workout.duration },
    workout.distance && { icon: MapPin, label: "DIST", value: workout.distance },
    workout.avgHr && { icon: Heart, label: "HR", value: workout.avgHr },
    workout.steps && { icon: Footprints, label: "STEPS", value: workout.steps },
    workout.elevation && { icon: Mountain, label: "ELEV", value: workout.elevation },
    workout.speed && { icon: Gauge, label: "PACE", value: workout.speed },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: isLeader
          ? "0 0 0 1px rgba(255,180,80,0.5), 0 30px 80px -20px rgba(255,140,40,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {/* Holographic mesh */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(120, 220, 255, 0.25), transparent 45%), radial-gradient(circle at 100% 0%, rgba(255, 100, 220, 0.22), transparent 45%), radial-gradient(circle at 50% 100%, rgba(180, 120, 255, 0.18), transparent 55%)",
        }}
      />
      {/* Iridescent top sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(120,220,255,0.6) 25%, rgba(255,150,220,0.6) 60%, transparent 100%)",
        }}
      />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#7df0ff", boxShadow: "0 0 8px #7df0ff" }}
            />
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/70 font-bold">
              {workout.type} · SESSION
            </div>
          </div>
          {isLeader && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
              style={{
                background: "linear-gradient(135deg, rgba(255,200,80,0.9), rgba(255,120,180,0.9))",
                color: "#1a0a1f",
                boxShadow: "0 0 12px rgba(255,160,100,0.6)",
              }}
            >
              <Zap className="h-2.5 w-2.5" /> Apex
            </div>
          )}
        </div>

        {/* Glass orb with flame */}
        <div className="relative flex items-center gap-5">
          <div
            className="relative shrink-0 rounded-full grid place-items-center"
            style={{
              width: 130,
              height: 130,
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.3) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow:
                "inset 0 2px 12px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.4)",
            }}
          >
            <AnimatedFlame size={flameSize} intensity={intensity} />
            {/* Glass refract highlight */}
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                top: 8, left: 18, width: 30, height: 16,
                background: "linear-gradient(180deg, rgba(255,255,255,0.7), transparent)",
                filter: "blur(2px)",
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-200/70 font-bold">
              CALORIES
            </div>
            <div
              className="text-5xl font-black tabular-nums leading-none mt-1"
              style={{
                background: isLeader
                  ? "linear-gradient(135deg, #fff5d6 0%, #ffb240 50%, #ff6090 100%)"
                  : "linear-gradient(135deg, #e0f5ff 0%, #b8c8ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: isLeader ? "0 0 30px rgba(255,160,80,0.4)" : "0 0 20px rgba(120,200,255,0.3)",
              }}
            >
              {workout.caloriesNum?.toLocaleString() ?? "0"}
            </div>
            {/* Spectrum bar */}
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(intensity * 100)}%`,
                  background: "linear-gradient(90deg, #7df0ff 0%, #b894ff 50%, #ff6fa8 100%)",
                  boxShadow: "0 0 8px rgba(180,148,255,0.7)",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/50 font-semibold">
              <span>BURN INDEX</span>
              <span className="tabular-nums text-white/80">{Math.round(intensity * 100)}</span>
            </div>
          </div>
        </div>

        {/* Glass stat chips */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {stats.slice(0, 3).map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-2.5 py-2.5 text-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <s.icon className="h-3 w-3 text-cyan-200/70 mx-auto mb-1" />
              <div className="text-sm font-bold tabular-nums text-white">{s.value}</div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Holo() {
  return (
    <div
      className="min-h-screen p-6 font-sans"
      style={{
        background:
          "radial-gradient(ellipse at 0% 0%, rgba(60,30,100,0.6), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(20,80,140,0.5), transparent 50%), #0a0815",
      }}
    >
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60 font-bold">
          Holo — iridescent glass / future card
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
