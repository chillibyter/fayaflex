import { Clock, Flame, Heart, Mountain, MapPin, Footprints, Gauge, Sparkles } from "lucide-react";
import { Icon3D, workoutTypeToIcon3D, type Icon3DName } from "@/components/Icon3D";

interface ParsedWorkout {
  title: string;
  type: string;
  duration?: string;
  distance?: string;
  calories?: string;
  avgHr?: string;
  elevation?: string;
  steps?: string;
  speed?: string;
  notes?: string;
}

const WORKOUT_RE = /^Completed an?\s+(.+?)\s+workout$/i;

function parseWorkoutPost(content: string): ParsedWorkout | null {
  if (!content) return null;
  const lines = content.split("\n");
  const titleMatch = lines[0]?.match(WORKOUT_RE);
  if (!titleMatch) return null;
  const type = titleMatch[1];
  const metrics = lines[1] || "";
  const out: ParsedWorkout = { title: lines[0], type };

  const hMatch = metrics.match(/(\d+)h\s+(\d+)m/);
  const mMatch = metrics.match(/(\d+)\s*min(?!\w)/);
  if (hMatch) out.duration = `${hMatch[1]}h ${hMatch[2]}m`;
  else if (mMatch) out.duration = `${mMatch[1]} min`;

  const km = metrics.match(/([\d.]+)\s*km/);
  if (km) out.distance = `${km[1]} km`;

  const cal = metrics.match(/(\d+)\s*cal/);
  if (cal) out.calories = `${cal[1]} cal`;

  const hr = metrics.match(/(\d+)\s*bpm\s*avg/);
  if (hr) out.avgHr = `${hr[1]} bpm`;

  const elev = metrics.match(/(\d+)\s*m\s*elevation/);
  if (elev) out.elevation = `${elev[1]} m`;

  const steps = metrics.match(/([\d,]+)\s*steps/);
  if (steps) out.steps = `${steps[1]} steps`;

  const speed = metrics.match(/([\d.]+)\s*km\/h/);
  if (speed) out.speed = `${speed[1]} km/h`;

  const blankIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "");
  if (blankIdx > -1) {
    const rest = lines.slice(blankIdx + 1).join("\n").trim();
    if (rest) out.notes = rest;
  }

  return out;
}

// Cinematic, photo-style hero backgrounds per workout family.
// Uses deep darks with type-specific warm/cool accent washes (no brand palette).
function heroBgForType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) {
    // Sunset run — deep charcoal with warm amber rim.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.32),_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(244,63,94,0.18),_transparent_55%),_linear-gradient(135deg,_#0b0b0b_0%,_#1c1410_100%)]";
  }
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride")) {
    // Twilight ride — slate with crimson accent.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.28),_transparent_60%),_linear-gradient(135deg,_#0a0a0c_0%,_#1a1518_100%)]";
  }
  if (t.includes("hik") || t.includes("climb") || t.includes("mountain") || t.includes("trail")) {
    // Alpine — earthy moss + warm rim light.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(132,204,22,0.22),_transparent_55%),_radial-gradient(ellipse_at_bottom_left,_rgba(217,119,6,0.18),_transparent_55%),_linear-gradient(135deg,_#0a0e0a_0%,_#15201a_100%)]";
  }
  if (t.includes("swim") || t.includes("pool")) {
    // Underwater — moody teal.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.30),_transparent_60%),_linear-gradient(135deg,_#08110f_0%,_#0f201d_100%)]";
  }
  if (t.includes("yoga") || t.includes("stretch") || t.includes("pilates")) {
    // Studio — soft rose / mauve glow.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(244,114,182,0.25),_transparent_60%),_linear-gradient(135deg,_#0e0a10_0%,_#1c1620_100%)]";
  }
  // Default: strength / HIIT — pure dark with hot orange spark.
  return "bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.30),_transparent_55%),_radial-gradient(ellipse_at_bottom_left,_rgba(220,38,38,0.18),_transparent_55%),_linear-gradient(135deg,_#0a0a0a_0%,_#1a1414_100%)]";
}

interface PBFlags {
  calories?: boolean;
  distance?: boolean;
  duration?: boolean;
  steps?: boolean;
  elevation?: boolean;
  speed?: boolean;
}

interface MetricSpec {
  key: keyof PBFlags | "avgHr";
  icon: any;
  icon3D?: Icon3DName;
  label: string;
  value: string;
  emphasize?: boolean;
}

function PrimaryStat({ stat, isPB }: { stat: MetricSpec; isPB: boolean }) {
  return (
    <div
      className="relative flex flex-col items-start gap-1 rounded-md bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/10 min-w-0"
      data-testid={`workout-primary-${stat.label.toLowerCase()}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/70 font-medium">
        <stat.icon className="h-3 w-3" />
        <span>{stat.label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 w-full">
        <span className="text-2xl sm:text-3xl font-extrabold leading-none text-white tracking-tight truncate">
          {stat.value}
        </span>
      </div>
      {isPB && (
        <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-md ring-1 ring-amber-200/60">
          <Sparkles className="h-2.5 w-2.5" />
          PB
        </div>
      )}
    </div>
  );
}

function SecondaryTile({ stat, isPB }: { stat: MetricSpec; isPB: boolean }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-md bg-muted/40 px-2 py-2.5 min-w-0"
      data-testid={`workout-metric-${stat.label.toLowerCase()}`}
    >
      <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
      <span className="text-sm font-bold leading-tight truncate max-w-full">
        {stat.value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</span>
      {isPB && (
        <div className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1 py-0.5 text-[8px] font-extrabold text-orange-950 shadow-sm">
          <Sparkles className="h-2 w-2" />
          PB
        </div>
      )}
    </div>
  );
}

export function WorkoutPostCard({ content, personalBests }: { content: string; personalBests?: PBFlags }) {
  const parsed = parseWorkoutPost(content);
  if (!parsed) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const pb: PBFlags = personalBests || {};

  // Choose primary stats (most "hero") for the gradient hero, secondary for tiles below.
  const primary: MetricSpec[] = [];
  const secondary: MetricSpec[] = [];

  if (parsed.calories) {
    primary.push({ key: "calories", icon: Flame, label: "Calories", value: parsed.calories, emphasize: true });
  }
  if (parsed.duration) {
    primary.push({ key: "duration", icon: Clock, label: "Time", value: parsed.duration });
  }
  if (parsed.distance) {
    if (primary.length < 3) {
      primary.push({ key: "distance", icon: MapPin, label: "Distance", value: parsed.distance });
    } else {
      secondary.push({ key: "distance", icon: MapPin, label: "Distance", value: parsed.distance });
    }
  }

  if (parsed.avgHr) secondary.push({ key: "avgHr", icon: Heart, label: "Avg HR", value: parsed.avgHr });
  if (parsed.steps) secondary.push({ key: "steps", icon: Footprints, label: "Steps", value: parsed.steps });
  if (parsed.elevation) secondary.push({ key: "elevation", icon: Mountain, label: "Elevation", value: parsed.elevation });
  if (parsed.speed) secondary.push({ key: "speed", icon: Gauge, label: "Pace", value: parsed.speed });

  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());
  const heroBg = heroBgForType(parsed.type);
  const hasCaloriePB = !!pb.calories && !!parsed.calories;

  return (
    <div className="space-y-3" data-testid="workout-post-card">
      {/* HERO */}
      <div
        className={`relative overflow-hidden rounded-lg ${heroBg} text-white p-4 sm:p-5 ring-1 ring-white/5`}
      >
        {/* Subtle film-grain / haze for photo feel */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3 mb-4">
          <div className="relative">
            <Icon3D name={workoutTypeToIcon3D(parsed.type)} size={56} />
            {hasCaloriePB && (
              <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-amber-300 ring-2 ring-amber-100/40 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight truncate">
              {typeLabel}
            </p>
            <p className="text-xs text-white/75 font-medium uppercase tracking-wider">
              Workout completed
            </p>
          </div>
          {parsed.calories && (
            <div className="ml-auto flex items-center gap-1.5">
              <Icon3D name="flame" size={36} alt="Calories" />
            </div>
          )}
        </div>

        {primary.length > 0 && (
          <div className={`relative grid gap-2 ${primary.length === 1 ? "grid-cols-1" : primary.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {primary.map((s) => (
              <PrimaryStat key={s.label} stat={s} isPB={!!pb[s.key as keyof PBFlags]} />
            ))}
          </div>
        )}
      </div>

      {/* SECONDARY METRICS */}
      {secondary.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {secondary.map((s) => (
            <SecondaryTile key={s.label} stat={s} isPB={!!pb[s.key as keyof PBFlags]} />
          ))}
        </div>
      )}

      {parsed.notes && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground" data-testid="text-workout-notes">
          {parsed.notes}
        </p>
      )}
    </div>
  );
}
