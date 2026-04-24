import "./_group.css";
import { Flame } from "lucide-react";

export interface ParsedWorkout {
  title: string;
  type: string;
  duration?: string;
  distance?: string;
  calories?: string;
  caloriesNum?: number;
  avgHr?: string;
  elevation?: string;
  steps?: string;
  speed?: string;
  notes?: string;
}

export interface PBFlags {
  calories?: boolean;
  distance?: boolean;
  duration?: boolean;
  steps?: boolean;
  elevation?: boolean;
  speed?: boolean;
}

export interface WorkoutCardProps {
  workout: ParsedWorkout;
  personalBests?: PBFlags;
  /** Calories burned today by the leader on the user's team / feed.
   *  Used to compute flame intensity (workout cal / topCaloriesOfDay). */
  topCaloriesOfDay: number;
  /** Optional: force-mark this card as the day's calorie leader (also bumps intensity to 1). */
  isCalorieLeader?: boolean;
}

export function clampIntensity(workoutCals: number, top: number, leader?: boolean) {
  if (leader) return 1;
  if (!top || !workoutCals) return 0.25;
  const r = workoutCals / top;
  return Math.max(0.2, Math.min(1, r));
}

/* ===== Realistic flame =====
 *  Three independently-flickering SVG flame tongues + a pulsing ember bed,
 *  a soft glow halo, and a continuous spark stream. Each layer has its own
 *  color, shape and timing so the whole thing reads as actual fire. */

/** A single flame-tongue path. The shapes are tuned to feel organic — wider
 *  ember-base, narrowing tip, with a small kink/lick on one shoulder. */
function FlameTongue({
  variant,
  intensity,
}: {
  variant: "outer" | "mid" | "core";
  intensity: number;
}) {
  // Color stops by layer (hot core gets nearly white; outer is deep red).
  const palettes = {
    outer: {
      gradId: `ff-g-out-${intensity.toFixed(2)}`,
      stops: [
        { o: 0,   c: `hsl(${28 + intensity * 8}, 100%, ${55 + intensity * 8}%)` },
        { o: 0.55,c: `hsl(${18 + intensity * 5}, 95%,  ${48 + intensity * 6}%)` },
        { o: 1,   c: `hsl(${5  + intensity * 5}, 95%,  ${30 + intensity * 5}%)` },
      ],
      // Big, full envelope.
      d: "M32 78 C 14 72, 8 54, 16 36 C 20 42, 26 40, 26 32 C 26 22, 22 12, 30 4 C 34 14, 42 16, 44 30 C 50 50, 48 72, 32 78 Z",
    },
    mid: {
      gradId: `ff-g-mid-${intensity.toFixed(2)}`,
      stops: [
        { o: 0,   c: `hsl(${48 + intensity * 8}, 100%, ${72 + intensity * 12}%)` },
        { o: 0.55,c: `hsl(${36 + intensity * 8}, 100%, ${58 + intensity * 8}%)` },
        { o: 1,   c: `hsl(${22 + intensity * 6}, 100%, ${48 + intensity * 5}%)` },
      ],
      // Slightly narrower with a leftward lick.
      d: "M32 76 C 18 70, 14 54, 22 38 C 24 44, 28 42, 28 34 C 28 24, 26 14, 32 8 C 36 16, 40 20, 41 32 C 46 50, 44 70, 32 76 Z",
    },
    core: {
      gradId: `ff-g-core-${intensity.toFixed(2)}`,
      stops: [
        { o: 0,   c: `hsl(56, 100%, ${88 + intensity * 8}%)` },
        { o: 0.5, c: `hsl(${50 + intensity * 6}, 100%, ${75 + intensity * 12}%)` },
        { o: 1,   c: `hsl(${36 + intensity * 8}, 100%, ${60 + intensity * 8}%)` },
      ],
      // Small, narrow, taller tongue.
      d: "M32 70 C 24 64, 22 52, 28 40 C 30 44, 32 42, 32 36 C 32 28, 30 20, 33 14 C 36 22, 38 26, 38 36 C 40 50, 38 66, 32 70 Z",
    },
  };
  const p = palettes[variant];
  return (
    <svg width="100%" height="100%" viewBox="0 0 64 80" fill="none" preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id={p.gradId} cx="50%" cy="78%" r="65%">
          {p.stops.map((s, i) => (
            <stop key={i} offset={`${s.o * 100}%`} stopColor={s.c} />
          ))}
        </radialGradient>
      </defs>
      <path d={p.d} fill={`url(#${p.gradId})`} />
    </svg>
  );
}

/** Realistic, intensity-aware flame.
 *  Wraps a tall (5:4 height ratio) box that contains: outer halo glow,
 *  ember bed, three flickering flame layers, and a continuous spark/ember
 *  stream above the tip. */
export function AnimatedFlame({
  size = 48,
  intensity = 0.5,
  showSparks = true,
  showRing = true,
  showEmbers = true,
}: {
  size?: number;
  intensity?: number;
  showSparks?: boolean;
  showRing?: boolean;
  showEmbers?: boolean;
}) {
  const styleVars = { ["--ff-intensity" as any]: String(intensity) } as React.CSSProperties;
  // Render at a 4:5 aspect so the flame has natural vertical proportion.
  const w = size;
  const h = Math.round(size * 1.15);

  // Spawn 6 sparks + 4 embers with varied lateral drift and delay so the
  // stream feels random rather than periodic.
  const sparks = [
    { x: -8, d: 0 },
    { x: 6,  d: 0.25 },
    { x: -3, d: 0.5 },
    { x: 9,  d: 0.8 },
    { x: -10, d: 1.1 },
    { x: 4,  d: 1.4 },
  ];
  const embers = [
    { x: -14, d: 0.2,  l: "38%" },
    { x: 12,  d: 0.7,  l: "58%" },
    { x: -4,  d: 1.3,  l: "48%" },
    { x: 8,   d: 1.9,  l: "55%" },
  ];

  return (
    <span
      className="ff-flame-wrap"
      style={{ ...styleVars, width: w, height: h }}
      aria-label="flame"
    >
      <span className="ff-flame-glow" />
      {showRing && intensity > 0.55 && <span className="ff-flame-ring" />}

      <span className="ff-ember-base" />

      <span className="ff-flame-layer ff-flame-outer">
        <FlameTongue variant="outer" intensity={intensity} />
      </span>
      <span className="ff-flame-layer ff-flame-mid">
        <FlameTongue variant="mid" intensity={intensity} />
      </span>
      <span className="ff-flame-layer ff-flame-core">
        <FlameTongue variant="core" intensity={intensity} />
      </span>

      {showSparks && intensity > 0.35 && sparks.map((s, i) => (
        <span
          key={`s${i}`}
          className="ff-spark"
          style={{
            ["--ff-spark-x" as any]: `${s.x}px`,
            animationDelay: `${s.d}s`,
          } as React.CSSProperties}
        />
      ))}

      {showEmbers && intensity > 0.5 && embers.map((e, i) => (
        <span
          key={`e${i}`}
          className="ff-ember"
          style={{
            ["--ff-ember-x" as any]: `${e.x}px`,
            animationDelay: `${e.d}s`,
            left: e.l,
          } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/** Back-compat re-export so other files that still call FlameSvg directly
 *  keep working — renders the mid tongue as a static SVG. */
export function FlameSvg({
  size = 48,
  intensity = 0.5,
}: {
  size?: number;
  intensity?: number;
  variant?: "front" | "back";
}) {
  return (
    <span style={{ display: "inline-block", width: size, height: size }}>
      <FlameTongue variant="mid" intensity={intensity} />
    </span>
  );
}

export function heroBgForType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) {
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.32),_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(244,63,94,0.18),_transparent_55%),_linear-gradient(135deg,_#0b0b0b_0%,_#1c1410_100%)]";
  }
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride")) {
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.28),_transparent_60%),_linear-gradient(135deg,_#0a0a0c_0%,_#1a1518_100%)]";
  }
  if (t.includes("hik") || t.includes("climb") || t.includes("mountain") || t.includes("trail")) {
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(132,204,22,0.22),_transparent_55%),_radial-gradient(ellipse_at_bottom_left,_rgba(217,119,6,0.18),_transparent_55%),_linear-gradient(135deg,_#0a0e0a_0%,_#15201a_100%)]";
  }
  return "bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.30),_transparent_55%),_radial-gradient(ellipse_at_bottom_left,_rgba(220,38,38,0.18),_transparent_55%),_linear-gradient(135deg,_#0a0a0a_0%,_#1a1414_100%)]";
}

/** Small brand "lucide flame" icon used for inline labels. */
export function StaticFlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Flame {...props} />;
}

/** Sample feed: 3 workouts with the middle one being the day's max calories. */
export const SAMPLE_FEED: { workout: ParsedWorkout; pb?: PBFlags; isLeader?: boolean }[] = [
  {
    workout: {
      title: "Completed a Run workout",
      type: "Run",
      duration: "32 min",
      distance: "5.2 km",
      calories: "412 cal",
      caloriesNum: 412,
      avgHr: "152 bpm",
      speed: "9.8 km/h",
    },
  },
  {
    workout: {
      title: "Completed a HIIT workout",
      type: "HIIT",
      duration: "48 min",
      calories: "687 cal",
      caloriesNum: 687,
      avgHr: "168 bpm",
      steps: "3,820 steps",
    },
    pb: { calories: true },
    isLeader: true,
  },
  {
    workout: {
      title: "Completed a Cycle workout",
      type: "Cycle",
      duration: "56 min",
      distance: "18.4 km",
      calories: "295 cal",
      caloriesNum: 295,
      avgHr: "138 bpm",
      elevation: "120 m",
    },
  },
];

export const TOP_CAL_OF_DAY = Math.max(...SAMPLE_FEED.map((s) => s.workout.caloriesNum || 0));
