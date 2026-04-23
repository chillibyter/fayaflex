import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain, Sparkles } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** Plasma — cosmic / aurora background, oversized hero flame.
 *  The leader card erupts with a giant flame, animated aurora, and a spectral
 *  calorie typography that bleeds light. */
function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);
  const isLeader = !!isCalorieLeader;
  const flameSize = 80 + intensity * 110;

  const stats = [
    workout.duration && { icon: Clock, label: "Duration", value: workout.duration },
    workout.distance && { icon: MapPin, label: "Distance", value: workout.distance },
    workout.avgHr && { icon: Heart, label: "Avg HR", value: workout.avgHr },
    workout.steps && { icon: Footprints, label: "Steps", value: workout.steps },
    workout.elevation && { icon: Mountain, label: "Elev", value: workout.elevation },
    workout.speed && { icon: Gauge, label: "Pace", value: workout.speed },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div
      className="relative rounded-[28px] overflow-hidden ff-aurora"
      style={{
        boxShadow: isLeader
          ? "0 0 0 1px rgba(255,180,80,0.4), 0 40px 100px -20px rgba(255,100,40,0.55)"
          : "0 30px 80px -20px rgba(20,10,60,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Star dust */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 90% 20%, rgba(255,200,255,0.6), transparent), radial-gradient(2px 2px at 40% 70%, rgba(180,220,255,0.5), transparent)",
        }}
      />

      <div className="relative px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#ff6fa8", boxShadow: "0 0 10px #ff6fa8" }}
          />
          <span className="text-[10px] uppercase tracking-[0.3em] text-pink-200/80 font-bold">
            {workout.type} · LIVE
          </span>
        </div>
        {isLeader && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,220,100,0.95), rgba(255,120,180,0.95))",
              color: "#1a0820",
              boxShadow: "0 0 20px rgba(255,160,100,0.6)",
            }}
          >
            <Sparkles className="h-3 w-3" /> Cosmic Burn
          </div>
        )}
      </div>

      {/* Hero flame */}
      <div
        className="relative flex items-end justify-center pt-4"
        style={{ minHeight: 230 }}
      >
        <AnimatedFlame size={flameSize} intensity={intensity} />
      </div>

      {/* Spectral calorie display */}
      <div className="relative text-center px-5 pt-2 pb-5">
        <div
          className="font-black tabular-nums leading-none tracking-tight"
          style={{
            fontSize: 72 + intensity * 28,
            background: isLeader
              ? "linear-gradient(180deg, #fff8d6 0%, #ffb240 50%, #ff5090 100%)"
              : "linear-gradient(180deg, #ffe9b8 0%, #ff8a50 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: `drop-shadow(0 0 ${12 + intensity * 30}px rgba(255,150,60,${0.5 + intensity * 0.4}))`,
          }}
        >
          {workout.caloriesNum?.toLocaleString() ?? "0"}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-pink-100/70 font-bold">
          calories · burned
        </div>

        {/* Glow rule */}
        <div
          className="mx-auto mt-4 h-px w-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,180,80,0.8), transparent)",
            boxShadow: "0 0 8px rgba(255,180,80,0.6)",
          }}
        />
      </div>

      {/* Frosted stat strip */}
      <div
        className="relative grid grid-cols-3 mx-3 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10, 5, 25, 0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {stats.slice(0, 3).map((s, i) => (
          <div
            key={s.label}
            className={`px-3 py-3 text-center ${i < 2 ? "border-r border-white/10" : ""}`}
          >
            <s.icon className="h-3.5 w-3.5 text-pink-200/70 mx-auto mb-1" />
            <div className="text-sm font-bold tabular-nums text-white">{s.value}</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Plasma() {
  return (
    <div className="min-h-screen p-6 font-sans" style={{ background: "#050308" }}>
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-pink-200/60 font-bold">
          Plasma — cosmic flame, aurora field
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
