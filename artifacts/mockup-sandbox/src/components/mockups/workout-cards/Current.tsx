import "./_group.css";
import { Clock, Flame, Heart, Mountain, MapPin, Footprints, Gauge, Sparkles } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, heroBgForType, clampIntensity, type WorkoutCardProps, type PBFlags } from "./shared";

interface MetricSpec {
  key: keyof PBFlags | "avgHr";
  icon: any;
  label: string;
  value: string;
}

function PrimaryStat({ stat, isPB }: { stat: MetricSpec; isPB: boolean }) {
  return (
    <div className="relative flex flex-col items-start gap-1 rounded-md bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/10 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/70 font-medium">
        <stat.icon className="h-3 w-3" />
        <span>{stat.label}</span>
      </div>
      <span className="block w-full text-lg sm:text-xl font-extrabold leading-tight text-white tracking-tight tabular-nums whitespace-nowrap overflow-hidden">
        {stat.value}
      </span>
      {isPB && (
        <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-md ring-1 ring-amber-200/60">
          <Sparkles className="h-2.5 w-2.5" /> PB
        </div>
      )}
    </div>
  );
}

function SecondaryTile({ stat, isPB }: { stat: MetricSpec; isPB: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-md bg-muted/40 px-2 py-2.5 min-w-0">
      <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
      <span className="text-sm font-bold leading-tight truncate max-w-full">{stat.value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</span>
      {isPB && (
        <div className="absolute -top-1 -right-1 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1 py-0.5 text-[8px] font-extrabold text-orange-950 shadow-sm">PB</div>
      )}
    </div>
  );
}

function Card({ workout, personalBests, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const pb = personalBests || {};
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);

  const primary: MetricSpec[] = [];
  const secondary: MetricSpec[] = [];
  if (workout.calories) primary.push({ key: "calories", icon: Flame, label: "Calories", value: workout.calories });
  if (workout.duration) primary.push({ key: "duration", icon: Clock, label: "Time", value: workout.duration });
  if (workout.distance) primary.push({ key: "distance", icon: MapPin, label: "Distance", value: workout.distance });
  if (workout.avgHr) secondary.push({ key: "avgHr", icon: Heart, label: "Avg HR", value: workout.avgHr });
  if (workout.steps) secondary.push({ key: "steps", icon: Footprints, label: "Steps", value: workout.steps });
  if (workout.elevation) secondary.push({ key: "elevation", icon: Mountain, label: "Elevation", value: workout.elevation });
  if (workout.speed) secondary.push({ key: "speed", icon: Gauge, label: "Pace", value: workout.speed });

  const typeLabel = workout.type.replace(/\b\w/g, (c) => c.toUpperCase());
  const heroBg = heroBgForType(workout.type);

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden rounded-lg ${heroBg} text-white p-4 ring-1 ring-white/5`}>
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight tracking-tight truncate">{typeLabel}</p>
            <p className="text-xs text-white/75 font-medium uppercase tracking-wider">Workout completed</p>
          </div>
          <div className="ml-auto flex items-center">
            <AnimatedFlame size={36} intensity={intensity} />
          </div>
        </div>
        {primary.length > 0 && (
          <div className={`relative grid gap-2 ${primary.length === 1 ? "grid-cols-1" : primary.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {primary.map((s) => <PrimaryStat key={s.label} stat={s} isPB={!!pb[s.key as keyof PBFlags]} />)}
          </div>
        )}
      </div>
      {secondary.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {secondary.map((s) => <SecondaryTile key={s.label} stat={s} isPB={!!pb[s.key as keyof PBFlags]} />)}
        </div>
      )}
    </div>
  );
}

export function Current() {
  return (
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Current — Today's feed
        </div>
        {SAMPLE_FEED.map((s, i) => (
          <div key={i} className="rounded-lg bg-card border border-card-border p-3 shadow-sm">
            <Card
              workout={s.workout}
              personalBests={s.pb}
              topCaloriesOfDay={TOP_CAL_OF_DAY}
              isCalorieLeader={s.isLeader}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
