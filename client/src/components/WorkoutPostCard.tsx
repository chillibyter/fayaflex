import { Activity, Clock, Flame, Heart, Mountain, MapPin, Footprints, Gauge } from "lucide-react";
import { Icon3D, workoutTypeToIcon3D } from "@/components/Icon3D";

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

  // Notes are everything after a blank line.
  const blankIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "");
  if (blankIdx > -1) {
    const rest = lines.slice(blankIdx + 1).join("\n").trim();
    if (rest) out.notes = rest;
  }

  return out;
}

function MetricTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-muted/40 px-2 py-3 min-w-0">
      <Icon className="h-4 w-4 text-muted-foreground mb-1" />
      <span className="text-sm font-semibold leading-tight truncate max-w-full" data-testid={`workout-metric-${label.toLowerCase()}`}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function WorkoutPostCard({ content }: { content: string }) {
  const parsed = parseWorkoutPost(content);
  if (!parsed) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const tiles: Array<{ icon: any; label: string; value: string }> = [];
  if (parsed.duration) tiles.push({ icon: Clock, label: "Time", value: parsed.duration });
  if (parsed.distance) tiles.push({ icon: MapPin, label: "Distance", value: parsed.distance });
  if (parsed.calories) tiles.push({ icon: Flame, label: "Calories", value: parsed.calories });
  if (parsed.avgHr) tiles.push({ icon: Heart, label: "Avg HR", value: parsed.avgHr });
  if (parsed.elevation) tiles.push({ icon: Mountain, label: "Elevation", value: parsed.elevation });
  if (parsed.steps) tiles.push({ icon: Footprints, label: "Steps", value: parsed.steps });
  if (parsed.speed) tiles.push({ icon: Gauge, label: "Pace", value: parsed.speed });

  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-3" data-testid="workout-post-card">
      <div className="flex items-center gap-3">
        <Icon3D name={workoutTypeToIcon3D(parsed.type)} size={48} />
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight truncate">{typeLabel}</p>
          <p className="text-xs text-muted-foreground">Workout completed</p>
        </div>
      </div>

      {tiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {tiles.map((t) => (
            <MetricTile key={t.label} icon={t.icon} label={t.label} value={t.value} />
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
