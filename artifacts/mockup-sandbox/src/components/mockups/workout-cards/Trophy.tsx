import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain, Trophy as TrophyIcon } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** Trophy — light, premium, achievement-led card. The flame sits inside a
 *  circular "heat badge" whose ring color & glow scale with intensity.
 *  The day's calorie leader gets an embossed gold trophy ribbon. */
function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);
  const isLeader = !!isCalorieLeader;
  const flameSize = 38 + intensity * 26; // 38..64

  // Heat ring color shifts ember -> gold as intensity rises
  const ringColor = `hsl(${30 - intensity * 12}, 95%, ${55 + intensity * 8}%)`;

  const stats = [
    workout.duration && { icon: Clock, label: "Duration", value: workout.duration },
    workout.distance && { icon: MapPin, label: "Distance", value: workout.distance },
    workout.avgHr && { icon: Heart, label: "Avg HR", value: workout.avgHr },
    workout.steps && { icon: Footprints, label: "Steps", value: workout.steps },
    workout.elevation && { icon: Mountain, label: "Elevation", value: workout.elevation },
    workout.speed && { icon: Gauge, label: "Pace", value: workout.speed },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div
      className="relative rounded-xl bg-card border border-card-border overflow-hidden"
      style={{
        boxShadow: isLeader
          ? "0 1px 2px rgba(0,0,0,0.04), 0 20px 40px -16px rgba(255,140,30,0.35), 0 0 0 1px rgba(255,180,80,0.4)"
          : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px -4px rgba(0,0,0,0.05)",
      }}
    >
      {isLeader && (
        <div
          className="absolute -top-px left-4 right-4 h-1"
          style={{ background: "linear-gradient(90deg, #f59e0b 0%, #fde68a 50%, #f59e0b 100%)" }}
        />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Heat badge */}
          <div className="relative shrink-0">
            <div
              className="relative grid place-items-center rounded-full"
              style={{
                width: 88,
                height: 88,
                background: `radial-gradient(circle at 50% 65%, hsl(${30 - intensity * 8}, 100%, 96%) 0%, hsl(${30 - intensity * 5}, 100%, 92%) 60%, hsl(${30 - intensity * 5}, 60%, 88%) 100%)`,
                boxShadow: `0 0 0 2px ${ringColor}, 0 0 ${8 + intensity * 24}px ${ringColor}`,
              }}
            >
              <AnimatedFlame size={flameSize} intensity={intensity} />
            </div>
            {isLeader && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-md ring-1 ring-amber-300">
                <TrophyIcon className="h-2.5 w-2.5" />
                Top burn
              </div>
            )}
          </div>

          {/* Title + calorie hero */}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
              {workout.type.toUpperCase()}
            </div>
            <div className="mt-0.5 text-base font-bold text-foreground leading-tight">
              Workout completed
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span
                className="text-4xl font-extrabold tabular-nums leading-none"
                style={{ color: `hsl(${22 - intensity * 6}, 90%, ${42 - intensity * 6}%)` }}
              >
                {workout.caloriesNum?.toLocaleString() ?? "0"}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                cal
              </span>
            </div>
            {/* Heat bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(intensity * 100)}%`,
                  background: `linear-gradient(90deg, hsl(35,95%,55%) 0%, ${ringColor} 100%)`,
                  boxShadow: `0 0 ${4 + intensity * 12}px ${ringColor}`,
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <span>Heat vs. team max</span>
              <span className="tabular-nums text-foreground">
                {Math.round(intensity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.slice(0, 3).map((s) => (
            <div key={s.label} className="rounded-md border border-card-border bg-background/50 px-2 py-2.5 text-center">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
              <div className="text-sm font-bold tabular-nums text-foreground">{s.value}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Trophy() {
  return (
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Trophy — premium light card with heat badge
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
