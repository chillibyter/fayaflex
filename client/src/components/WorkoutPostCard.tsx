import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bike,
  CheckCircle2,
  Dumbbell,
  Flame,
  Footprints,
  Mountain,
  Sparkles,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import sneakerImg from "@/assets/icons-3d/sneaker.webp";
import dumbbellImg from "@/assets/icons-3d/dumbbell.webp";
import boxingImg from "@/assets/icons-3d/boxing.webp";
import bicycleImg from "@/assets/icons-3d/bicycle.webp";
import mountainImg from "@/assets/icons-3d/mountain.webp";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface PBFlags {
  calories?: boolean;
  distance?: boolean;
  duration?: boolean;
  steps?: boolean;
  elevation?: boolean;
  speed?: boolean;
}

type WorkoutCategory =
  | "running"
  | "cycling"
  | "swimming"
  | "strength"
  | "yoga"
  | "hiit"
  | "hiking"
  | "other";

// Theme returned by getWorkoutTheme. Signature is preserved for back-compat
// (still includes accent + accentRgb) but extended with the tinted-dashboard
// palette so the component can render light/dark surfaces consistently.
type WorkoutTheme = {
  accent: string;        // hex used for ring, bar gradient end, badge bg
  accentRgb: string;     // "r,g,b" for rgba() interpolation (e.g. glows)
  category: WorkoutCategory;
  label: string;         // "Running", "Cycling", etc — human-friendly
  tint: string;          // light-mode card tint (hex)
  border: string;        // light-mode border (hex)
  darkTint: string;      // dark-mode card surface (hex)
  darkBorder: string;    // dark-mode border (hex)
  gradStart: string;     // avatar/ring gradient start
  gradEnd: string;       // avatar/ring gradient end
  barFrom: string;       // bar gradient start
  barTo: string;         // bar gradient end
  Icon: LucideIcon;      // icon for the type badge
};

// ── Parsing ───────────────────────────────────────────────────────────────────

const WORKOUT_RE = /^Completed an?\s+(.+?)\s+workout$/i;

export function isAutoWorkoutPost(content: string | null | undefined): boolean {
  if (!content) return false;
  const firstLine = content.split("\n")[0] ?? "";
  return WORKOUT_RE.test(firstLine.trim());
}

export function getWorkoutSummary(content: string | null | undefined): string {
  if (!content) return "";
  const lines = content.split("\n");
  const head = lines[0]?.trim() ?? "";
  const metrics = lines[1]?.trim() ?? "";
  return [head, metrics].filter(Boolean).join(" — ");
}

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
  const pace = metrics.match(/(\d+:\d{2})\s*min\/km/);
  if (pace) out.speed = `${pace[1]} min/km`;

  const blankIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "");
  if (blankIdx > -1) {
    const rest = lines.slice(blankIdx + 1).join("\n").trim();
    if (rest) out.notes = rest;
  }

  return out;
}

// ── Theme catalogue ───────────────────────────────────────────────────────────

function classifyWorkout(type: string): WorkoutCategory {
  const t = (type || "").toLowerCase();
  if (t.includes("hiit") || t.includes("tabata") || t.includes("interval") || t.includes("circuit")) return "hiit";
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride") || t.includes("spin")) return "cycling";
  if (t.includes("swim") || t.includes("pool") || t.includes("water")) return "swimming";
  if (t.includes("yoga") || t.includes("stretch") || t.includes("pilates") || t.includes("mobility") || t.includes("meditat")) return "yoga";
  if (t.includes("hik") || t.includes("trail") || t.includes("mountain")) return "hiking";
  if (
    t.includes("strength") || t.includes("weight") || t.includes("lift") ||
    t.includes("dumb") || t.includes("gym") || t.includes("crossfit") || t.includes("resist") ||
    t.includes("box") || t.includes("kickbox") || t.includes("mma") || t.includes("fight")
  ) return "strength";
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) return "running";
  return "other";
}

const CATEGORY_THEMES: Record<WorkoutCategory, Omit<WorkoutTheme, "category" | "label">> = {
  running: {
    accent: "#16a34a", accentRgb: "22,163,74",
    tint: "#f0fdf4", border: "#dcfce7",
    darkTint: "#0a1f12", darkBorder: "#14532d",
    gradStart: "#22c55e", gradEnd: "#15803d",
    barFrom: "#15803d", barTo: "#4ade80",
    Icon: Footprints,
  },
  hiking: {
    accent: "#0d9488", accentRgb: "13,148,136",
    tint: "#f0fdfa", border: "#ccfbf1",
    darkTint: "#062925", darkBorder: "#115e59",
    gradStart: "#14b8a6", gradEnd: "#0f766e",
    barFrom: "#0f766e", barTo: "#5eead4",
    Icon: Mountain,
  },
  cycling: {
    accent: "#2563eb", accentRgb: "37,99,235",
    tint: "#eff6ff", border: "#bfdbfe",
    darkTint: "#0a1733", darkBorder: "#1e40af",
    gradStart: "#3b82f6", gradEnd: "#1d4ed8",
    barFrom: "#1d4ed8", barTo: "#60a5fa",
    Icon: Bike,
  },
  swimming: {
    accent: "#0891b2", accentRgb: "8,145,178",
    tint: "#ecfeff", border: "#a5f3fc",
    darkTint: "#062b34", darkBorder: "#155e75",
    gradStart: "#06b6d4", gradEnd: "#0e7490",
    barFrom: "#0e7490", barTo: "#67e8f9",
    Icon: Waves,
  },
  strength: {
    accent: "#dc2626", accentRgb: "220,38,38",
    tint: "#fef2f2", border: "#fecaca",
    darkTint: "#2a0d0d", darkBorder: "#991b1b",
    gradStart: "#ef4444", gradEnd: "#b91c1c",
    barFrom: "#b91c1c", barTo: "#f87171",
    Icon: Dumbbell,
  },
  yoga: {
    accent: "#9333ea", accentRgb: "147,51,234",
    tint: "#faf5ff", border: "#e9d5ff",
    darkTint: "#1c0d2e", darkBorder: "#6b21a8",
    gradStart: "#a855f7", gradEnd: "#7c3aed",
    barFrom: "#7c3aed", barTo: "#c084fc",
    Icon: Wind,
  },
  hiit: {
    accent: "#ea580c", accentRgb: "234,88,12",
    tint: "#fff7ed", border: "#fed7aa",
    darkTint: "#2a1305", darkBorder: "#9a3412",
    gradStart: "#f97316", gradEnd: "#c2410c",
    barFrom: "#c2410c", barTo: "#fb923c",
    Icon: Zap,
  },
  other: {
    accent: "#475569", accentRgb: "71,85,105",
    tint: "#f8fafc", border: "#e2e8f0",
    darkTint: "#101826", darkBorder: "#334155",
    gradStart: "#64748b", gradEnd: "#334155",
    barFrom: "#334155", barTo: "#94a3b8",
    Icon: Activity,
  },
};

const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  running: "Running",
  hiking: "Hiking",
  cycling: "Cycling",
  swimming: "Swimming",
  strength: "Strength",
  yoga: "Yoga",
  hiit: "HIIT",
  other: "Workout",
};

const CATEGORY_TAGLINES: Record<WorkoutCategory, string> = {
  running: "Outdoor activity",
  hiking: "Trail activity",
  cycling: "Outdoor activity",
  swimming: "Pool session",
  strength: "Strength session",
  yoga: "Mind & body session",
  hiit: "High-intensity session",
  other: "Workout completed",
};

export function getWorkoutTheme(type: string): WorkoutTheme {
  const category = classifyWorkout(type);
  return {
    ...CATEGORY_THEMES[category],
    category,
    label: CATEGORY_LABELS[category],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function workoutImage(category: WorkoutCategory): string | null {
  switch (category) {
    case "running": return sneakerImg;
    case "cycling": return bicycleImg;
    case "hiking": return mountainImg;
    case "strength": return dumbbellImg;
    case "hiit":     return boxingImg;
    default:         return null;
  }
}

function splitValueUnit(raw: string): { value: string; unit?: string } {
  const paceM = raw.match(/^(\d+:\d{2})\s*(min\/km)$/i);
  if (paceM) return { value: paceM[1], unit: paceM[2] };
  if (/\d+\s*h\s*\d+\s*m/i.test(raw) || /\bmin\b/i.test(raw)) {
    return { value: raw };
  }
  const m = raw.match(/^([\d.,]+)\s*([a-zA-Z/]+)?$/);
  if (!m) return { value: raw };
  return { value: m[1].trim(), unit: m[2]?.trim() };
}

// Convert a parsed metric string into a numeric value the bar can scale on.
function toMagnitude(raw: string | undefined, kind: MetricKind): number | null {
  if (!raw) return null;
  if (kind === "duration") {
    const h = raw.match(/(\d+)\s*h\s*(\d+)\s*m/);
    if (h) return parseInt(h[1], 10) * 60 + parseInt(h[2], 10);
    const m = raw.match(/(\d+)\s*min/);
    if (m) return parseInt(m[1], 10);
    return null;
  }
  if (kind === "pace") {
    // Lower is better; encode "5:30" → 5.5
    const p = raw.match(/(\d+):(\d{2})/);
    if (p) return parseInt(p[1], 10) + parseInt(p[2], 10) / 60;
    const km = raw.match(/([\d.]+)/);
    return km ? parseFloat(km[1]) : null;
  }
  const n = raw.match(/([\d.,]+)/);
  if (!n) return null;
  return parseFloat(n[1].replace(/,/g, ""));
}

type MetricKind = "calories" | "duration" | "distance" | "speed" | "pace" | "hr" | "elevation" | "steps";

// Visual scales — picked to look good across typical workout values, not
// claimed as absolute ceilings.
const METRIC_SCALE: Record<MetricKind, number> = {
  calories: 800,
  duration: 120,   // minutes
  distance: 30,    // km
  speed: 45,       // km/h
  pace: 7,         // min/km — inverted below
  hr: 200,
  elevation: 800,
  steps: 20000,
};

function barWidth(value: number, kind: MetricKind): number {
  const scale = METRIC_SCALE[kind];
  if (kind === "pace") {
    // Faster pace (smaller number) → fuller bar. 3:00 → 100%, 7:00 → 30%.
    const pct = 1 - (value - 3) / (scale - 3);
    return Math.max(20, Math.min(100, pct * 100));
  }
  return Math.max(15, Math.min(100, (value / scale) * 100));
}

// Stable hash so HIIT interval bars look "personalized" but consistent
// across renders for the same workout content.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressRing({
  value,
  unit,
  fillPct,
  accent,
  border,
  size = 72,
}: {
  value: string;
  unit?: string;
  fillPct: number; // 0-100
  accent: string;
  border: string;
  size?: number;
}) {
  const r = 29;
  const c = 2 * Math.PI * r;
  const offsetTarget = c - (Math.max(0, Math.min(100, fillPct)) / 100) * c;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOffset(offsetTarget), 50);
    return () => clearTimeout(t);
  }, [offsetTarget]);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 72 72"
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle cx="36" cy="36" r={r} fill="none" stroke={border} strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none tabular-nums"
          style={{ color: accent, fontSize: value.length >= 4 ? 14 : 16 }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[8px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricBarRow({
  label,
  value,
  unit,
  pct,
  accent,
  border,
  barFrom,
  barTo,
  emphasized,
  isPB,
  delay,
  testId,
}: {
  label: string;
  value: string;
  unit?: string;
  pct: number;
  accent: string;
  border: string;
  barFrom: string;
  barTo: string;
  emphasized?: boolean;
  isPB?: boolean;
  delay: number;
  testId: string;
}) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFilled(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div
      className="flex items-center gap-2 py-1.5 border-t first:border-t-0"
      style={{ borderColor: border }}
      data-testid={testId}
    >
      <div className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground w-[62px] flex-shrink-0">
        {label}
      </div>
      <div
        className="flex-1 h-[3px] rounded-full overflow-hidden min-w-[20px]"
        style={{ background: border }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${filled}%`,
            background: `linear-gradient(90deg, ${barFrom}, ${barTo})`,
            transition: "width 900ms cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <span
          className="font-mono text-[12px] font-bold tabular-nums text-right"
          style={{
            color: emphasized ? accent : undefined,
            minWidth: 48,
            display: "inline-block",
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[8px] text-muted-foreground w-[30px]">
            {unit}
          </span>
        )}
        {isPB && (
          <Sparkles
            className="h-3 w-3 ml-0.5 text-amber-500"
            aria-label="Personal best"
          />
        )}
      </div>
    </div>
  );
}

function HiitIntervals({
  seed,
  accent,
  barTo,
  count = 14,
}: {
  seed: number;
  accent: string;
  barTo: string;
  count?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);
  // Deterministic alternating tall/short pattern from the seed.
  const heights = useMemo(() => {
    const out: number[] = [];
    let s = seed || 1;
    for (let i = 0; i < count; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const isWork = i % 2 === 0;
      const base = isWork ? 28 : 12;
      const jitter = ((s % 12) - 6);
      out.push(Math.max(6, base + jitter));
    }
    return out;
  }, [seed, count]);
  return (
    <div
      className="flex items-end gap-[3px] mb-2 h-[44px]"
      role="img"
      aria-label="High-intensity interval pattern"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: animated ? h : 4,
            background: `linear-gradient(180deg, ${accent}, ${barTo})`,
            transition: `height 600ms cubic-bezier(.22,1,.36,1) ${i * 30}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface WorkoutPostCardProps {
  content: string;
  personalBests?: PBFlags;
  /** When true, marks this card as the calorie leader of the feed. */
  isTopBurner?: boolean;
}

export function WorkoutPostCard({
  content,
  personalBests,
  isTopBurner,
}: WorkoutPostCardProps) {
  // ── Hooks (must run on every render before any conditional return) ─────────
  const seed = useMemo(() => hashString(content), [content]);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);
  const [celebrate, setCelebrate] = useState(0);

  const parsed = parseWorkoutPost(content);
  if (!parsed) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const pb: PBFlags = personalBests || {};
  const theme = getWorkoutTheme(parsed.type);
  const TypeIcon = theme.Icon;
  const productImg = workoutImage(theme.category);
  const tagline = CATEGORY_TAGLINES[theme.category];

  // Pick the metric that headlines the ring.
  const ring = (() => {
    if (
      (theme.category === "running" || theme.category === "cycling" ||
        theme.category === "hiking" || theme.category === "swimming") &&
      parsed.distance
    ) {
      const sv = splitValueUnit(parsed.distance);
      const mag = toMagnitude(parsed.distance, "distance") ?? 0;
      return { value: sv.value, unit: sv.unit ?? "km", pct: barWidth(mag, "distance") };
    }
    if (parsed.duration) {
      const sv = splitValueUnit(parsed.duration);
      const mag = toMagnitude(parsed.duration, "duration") ?? 0;
      return { value: sv.value, unit: sv.unit ?? (mag >= 60 ? "h:mm" : "min"), pct: barWidth(mag, "duration") };
    }
    if (parsed.calories) {
      const sv = splitValueUnit(parsed.calories);
      const mag = toMagnitude(parsed.calories, "calories") ?? 0;
      return { value: sv.value, unit: sv.unit ?? "cal", pct: barWidth(mag, "calories") };
    }
    return { value: "—", unit: undefined, pct: 0 };
  })();

  // Build the metric bar list.
  const speedKind: MetricKind = parsed.speed?.includes("min/km") ? "pace" : "speed";
  type Row = {
    key: string;
    label: string;
    raw: string;
    kind: MetricKind;
    emphasized?: boolean;
    isPB?: boolean;
    testId: string;
    delay: number;
  };
  const rows: Row[] = [];
  let delayBase = 250;
  if (parsed.duration) rows.push({ key: "dur", label: "Duration", raw: parsed.duration, kind: "duration", isPB: !!pb.duration, testId: "metric-time", delay: delayBase += 80 });
  if (parsed.calories) rows.push({ key: "cal", label: "Calories", raw: parsed.calories, kind: "calories", emphasized: true, isPB: !!pb.calories, testId: "metric-calories", delay: delayBase += 80 });
  if (parsed.distance) rows.push({ key: "dist", label: "Distance", raw: parsed.distance, kind: "distance", isPB: !!pb.distance, testId: "metric-distance", delay: delayBase += 80 });
  if (parsed.speed)    rows.push({ key: "spd", label: speedKind === "pace" ? "Avg Pace" : "Avg Speed", raw: parsed.speed, kind: speedKind, isPB: !!pb.speed, testId: "metric-pace", delay: delayBase += 80 });
  if (parsed.avgHr)    rows.push({ key: "hr", label: "Avg HR", raw: parsed.avgHr, kind: "hr", testId: "metric-extra-avg-hr", delay: delayBase += 80 });
  if (parsed.elevation) rows.push({ key: "elev", label: "Elevation", raw: parsed.elevation, kind: "elevation", isPB: !!pb.elevation, testId: "metric-extra-elev", delay: delayBase += 80 });
  if (parsed.steps)    rows.push({ key: "steps", label: "Steps", raw: parsed.steps, kind: "steps", isPB: !!pb.steps, testId: "metric-extra-steps", delay: delayBase += 80 });

  const showHiitIntervals = theme.category === "hiit";

  return (
    <div
      className="rounded-2xl overflow-hidden border bg-[var(--wpc-tint)] dark:bg-[var(--wpc-tint-dark)] border-[var(--wpc-border)] dark:border-[var(--wpc-border-dark)] shadow-sm"
      style={{
        ["--wpc-tint" as any]: theme.tint,
        ["--wpc-border" as any]: theme.border,
        ["--wpc-tint-dark" as any]: theme.darkTint,
        ["--wpc-border-dark" as any]: theme.darkBorder,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 400ms ease, transform 400ms ease",
      }}
      data-testid="workout-post-card"
    >
      {/* HEADER STRIP */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 border-b bg-white/60 dark:bg-white/5"
        style={{ borderColor: "var(--wpc-border)" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: theme.accent }} aria-hidden="true" />
          Workout Completed
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold tracking-wider uppercase text-white"
          style={{ background: theme.accent }}
          data-testid="workout-type-badge"
        >
          <TypeIcon className="h-3 w-3" aria-hidden="true" />
          {theme.label}
        </div>
      </div>

      {/* BODY */}
      <div className="p-4">
        <div className="flex gap-3.5 items-start">
          {/* LEFT — ring + product tile */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <ProgressRing
              value={ring.value}
              unit={ring.unit}
              fillPct={ring.pct}
              accent={theme.accent}
              border={theme.border}
            />
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800/70 border"
              style={{ borderColor: theme.border }}
            >
              {productImg ? (
                <img
                  src={productImg}
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <TypeIcon className="h-5 w-5" style={{ color: theme.accent }} aria-hidden="true" />
              )}
            </div>
          </div>

          {/* RIGHT — title, subtitle, optional PB, optional intervals, metric rows */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-extrabold tracking-tight text-foreground truncate"
              data-testid="text-workout-title"
            >
              {theme.label}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">
              {tagline}
            </p>

            {Object.values(pb).some(Boolean) && (
              <div
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-950 mb-2"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                data-testid="badge-personal-best"
              >
                <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                Personal Best
              </div>
            )}

            {showHiitIntervals && (
              <HiitIntervals seed={seed} accent={theme.accent} barTo={theme.barTo} />
            )}

            <div>
              {rows.map((r) => {
                const sv = splitValueUnit(r.raw);
                const mag = toMagnitude(r.raw, r.kind) ?? 0;
                return (
                  <MetricBarRow
                    key={r.key}
                    label={r.label}
                    value={sv.value}
                    unit={sv.unit}
                    pct={barWidth(mag, r.kind)}
                    accent={theme.accent}
                    border={theme.border}
                    barFrom={theme.barFrom}
                    barTo={theme.barTo}
                    emphasized={r.emphasized}
                    isPB={r.isPB}
                    delay={r.delay}
                    testId={r.testId}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
          className="flex items-center gap-2 px-4 py-2.5 border-t bg-white/50 dark:bg-white/5"
          style={{ borderColor: "var(--wpc-border)" }}
        >
          {isTopBurner && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400"
              data-testid="badge-top-burner"
            >
              <Flame className="h-3 w-3" aria-hidden="true" />
              Top Burner
            </span>
          )}
          {parsed.notes && (
            <span
              className="flex-1 text-[11px] italic text-muted-foreground truncate min-w-0"
              data-testid="text-workout-notes"
            >
              {parsed.notes}
            </span>
          )}
          <button
            type="button"
            className="ml-auto h-7 w-7 rounded-md flex items-center justify-center text-white outline-none focus-visible:ring-2 focus-visible:ring-offset-1 hover-elevate active-elevate-2 flex-shrink-0"
            style={{ background: theme.accent }}
            onClick={() => setCelebrate((n) => n + 1)}
            aria-label={isTopBurner ? "Top burner — celebrate" : "Celebrate"}
            data-testid="button-celebrate"
          >
            <Flame
              key={celebrate}
              className="h-3.5 w-3.5"
              style={{
                animation: celebrate > 0 ? "wpc-celebrate-pop 380ms ease-out" : undefined,
              }}
              aria-hidden="true"
            />
          </button>
        </div>

      <style>{`
        @keyframes wpc-celebrate-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.45) rotate(-12deg); }
          70% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="workout-post-card"] * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
