import {
  Activity,
  Bike,
  Clock,
  Flame,
  Footprints,
  Gauge,
  Heart,
  MapPin,
  Mountain,
  Sparkles,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

interface PBFlags {
  calories?: boolean;
  distance?: boolean;
  duration?: boolean;
  steps?: boolean;
  elevation?: boolean;
  speed?: boolean;
}

function workoutIcon(type: string): LucideIcon {
  const t = type.toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) return Footprints;
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride")) return Bike;
  if (t.includes("swim") || t.includes("pool")) return Waves;
  if (t.includes("hik") || t.includes("climb") || t.includes("trail") || t.includes("mountain")) return Mountain;
  return Activity;
}

const KEYFRAMES = `
@keyframes wpc-flicker {
  0%   { transform: scale(1)    rotate(-2deg); filter: drop-shadow(0 0 10px rgba(255,100,0,0.85)); }
  50%  { transform: scale(1.08) rotate(1deg);  filter: drop-shadow(0 0 18px rgba(255,140,0,1));    }
  100% { transform: scale(1.04) rotate(-1deg); filter: drop-shadow(0 0 14px rgba(255,80,0,0.9));   }
}
@keyframes wpc-spark {
  0%   { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); }
}
.wpc-flame { animation: wpc-flicker 1.2s ease-in-out infinite alternate; display:inline-block; }
.wpc-spark {
  position: absolute;
  width: 5px; height: 5px;
  border-radius: 9999px;
  background: #ff8a3d;
  box-shadow: 0 0 6px rgba(255,140,40,0.9);
  animation: wpc-spark 1s ease-out infinite;
  pointer-events: none;
}
`;

function Sparks({ count = 8 }: { count?: number }) {
  const sparks = Array.from({ length: count }, (_, i) => ({
    id: i,
    tx: `${Math.round(20 + i * 10)}px`,
    ty: `-${Math.round(30 + (i % 3) * 18)}px`,
    delay: `${(i * 0.13).toFixed(2)}s`,
    top: `${30 + (i % 4) * 6}px`,
    left: `${28 + (i % 5) * 5}px`,
  }));
  return (
    <>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="wpc-spark"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            ["--tx" as any]: s.tx,
            ["--ty" as any]: s.ty,
          }}
        />
      ))}
    </>
  );
}

function MetricPanel({
  icon: Icon,
  label,
  value,
  unit,
  emphasized,
  isPB,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  emphasized?: boolean;
  isPB?: boolean;
  testId: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl bg-zinc-800/80 px-3 py-3 border border-white/5 ${
        emphasized ? "ring-1 ring-orange-500/40" : ""
      }`}
      data-testid={testId}
    >
      <Icon className={`h-4 w-4 mb-1.5 ${emphasized ? "text-orange-400" : "text-zinc-400"}`} />
      <div className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-1">
        {label}
      </div>
      <div className="flex items-baseline">
        <span className="text-xl font-extrabold text-white tabular-nums">{value}</span>
        {unit && <span className="ml-1 text-xs font-medium text-zinc-400">{unit}</span>}
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

function splitValueUnit(raw: string): { value: string; unit?: string } {
  // Durations like "1h 45m" or "30 min" already contain unit letters — keep whole.
  if (/\d+\s*h\s*\d+\s*m/i.test(raw) || /\bmin\b/i.test(raw)) {
    return { value: raw };
  }
  const m = raw.match(/^([\d.,]+)\s*([a-zA-Z/]+)?$/);
  if (!m) return { value: raw };
  return { value: m[1].trim(), unit: m[2]?.trim() };
}

export function WorkoutPostCard({
  content,
  personalBests,
}: {
  content: string;
  personalBests?: PBFlags;
}) {
  const parsed = parseWorkoutPost(content);
  if (!parsed) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const pb: PBFlags = personalBests || {};
  const TypeIcon = workoutIcon(parsed.type);
  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());

  const calories = parsed.calories ? splitValueUnit(parsed.calories) : null;
  const duration = parsed.duration ? splitValueUnit(parsed.duration) : null;
  const distance = parsed.distance ? splitValueUnit(parsed.distance) : null;
  const speed = parsed.speed ? splitValueUnit(parsed.speed) : null;

  const extras: Array<{ icon: LucideIcon; label: string; raw: string; pbKey: keyof PBFlags }> = [];
  if (parsed.avgHr) extras.push({ icon: Heart, label: "Avg HR", raw: parsed.avgHr, pbKey: "duration" });
  if (parsed.steps) extras.push({ icon: Footprints, label: "Steps", raw: parsed.steps, pbKey: "steps" });
  if (parsed.elevation) extras.push({ icon: Mountain, label: "Elev", raw: parsed.elevation, pbKey: "elevation" });

  return (
    <div className="space-y-3" data-testid="workout-post-card">
      <style>{KEYFRAMES}</style>

      <div
        className="relative overflow-hidden rounded-3xl text-white p-5 sm:p-6"
        style={{
          background: "#2a2a2a",
          boxShadow:
            "0 0 60px rgba(255,100,0,0.22), 0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Orange corner glow */}
        <div
          className="pointer-events-none absolute top-0 right-0"
          style={{
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle at top right, rgba(255,100,0,0.40) 0%, transparent 70%)",
          }}
        />

        {/* Top row: workout icon | title | animated flame */}
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div
            className="flex items-center justify-center rounded-2xl bg-zinc-800/80 border border-white/5"
            style={{ width: 72, height: 72 }}
            data-testid="workout-type-badge"
          >
            <TypeIcon className="h-9 w-9 text-orange-400" />
          </div>

          <div className="flex-1 text-center px-2 min-w-0">
            <p
              className="text-xl font-extrabold tracking-wide text-white truncate"
              data-testid="text-workout-title"
            >
              {typeLabel}
            </p>
            <p className="text-[11px] font-semibold tracking-[2px] text-orange-500 uppercase mt-1">
              Workout Completed
            </p>
          </div>

          <div
            className="relative flex items-center justify-center"
            style={{ width: 72, height: 72 }}
            aria-hidden="true"
          >
            <Flame
              className="wpc-flame text-orange-500"
              style={{ width: 48, height: 48 }}
              fill="currentColor"
            />
            <Sparks count={8} />
          </div>
        </div>

        {/* Three metric panels */}
        <div className="relative grid grid-cols-3 gap-3 mb-3">
          {calories ? (
            <MetricPanel
              icon={Flame}
              label="Calories"
              value={calories.value}
              unit={calories.unit ?? "cal"}
              emphasized
              isPB={!!pb.calories}
              testId="metric-calories"
            />
          ) : (
            <div />
          )}
          {duration ? (
            <MetricPanel
              icon={Clock}
              label="Time"
              value={duration.value}
              unit={duration.unit}
              isPB={!!pb.duration}
              testId="metric-time"
            />
          ) : (
            <div />
          )}
          {distance ? (
            <MetricPanel
              icon={MapPin}
              label="Distance"
              value={distance.value}
              unit={distance.unit ?? "km"}
              isPB={!!pb.distance}
              testId="metric-distance"
            />
          ) : (
            <div />
          )}
        </div>

        {/* Bottom pace strip */}
        {speed && (
          <div
            className="relative rounded-2xl bg-zinc-800/80 border border-white/5 px-4 py-4 flex flex-col items-center"
            data-testid="metric-pace"
          >
            <Gauge className="h-5 w-5 text-zinc-400 mb-1" />
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-orange-500 tabular-nums">
                {speed.value}
              </span>
              <span className="ml-1 text-sm font-medium text-zinc-400">
                {speed.unit ?? "km/h"}
              </span>
            </div>
            <div className="text-[10px] font-semibold tracking-[2px] text-zinc-400 uppercase mt-1">
              Pace
            </div>
            {pb.speed && (
              <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-md ring-1 ring-amber-200/60">
                <Sparkles className="h-2.5 w-2.5" />
                PB
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional secondary metrics (HR / Steps / Elevation) — only when present */}
      {extras.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {extras.map((e) => {
            const sv = splitValueUnit(e.raw);
            return (
              <div
                key={e.label}
                className="flex flex-col items-center justify-center rounded-md bg-muted/40 px-2 py-2.5"
                data-testid={`metric-extra-${e.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <e.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-sm font-bold leading-tight">
                  {sv.value}
                  {sv.unit && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {sv.unit}
                    </span>
                  )}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {e.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {parsed.notes && (
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
          data-testid="text-workout-notes"
        >
          {parsed.notes}
        </p>
      )}
    </div>
  );
}
