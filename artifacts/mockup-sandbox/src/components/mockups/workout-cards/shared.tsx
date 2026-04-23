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

/** Animated, intensity-aware flame.
 *  Renders a stylized SVG flame so it can be scaled, glow-haloed, and flickered via CSS. */
export function AnimatedFlame({
  size = 48,
  intensity = 0.5,
  showSparks = true,
}: {
  size?: number;
  intensity?: number;
  showSparks?: boolean;
}) {
  const styleVars = { ["--ff-intensity" as any]: String(intensity) } as React.CSSProperties;
  return (
    <span
      className="ff-flame"
      style={{ ...styleVars, width: size, height: size }}
      aria-label="flame"
    >
      <span className="ff-flame-glow" />
      <FlameSvg size={size} intensity={intensity} />
      {showSparks && intensity > 0.6 && (
        <>
          <span className="ff-spark" style={{ ["--ff-spark-x" as any]: "-6px", animationDelay: "0s" } as React.CSSProperties} />
          <span className="ff-spark" style={{ ["--ff-spark-x" as any]: "8px",  animationDelay: ".4s" } as React.CSSProperties} />
          <span className="ff-spark" style={{ ["--ff-spark-x" as any]: "0px",  animationDelay: ".9s" } as React.CSSProperties} />
        </>
      )}
    </span>
  );
}

/** SVG flame whose inner-flame brightness scales with intensity. */
export function FlameSvg({ size = 48, intensity = 0.5 }: { size?: number; intensity?: number }) {
  // Outer color shifts toward yellow-white as intensity rises
  const outer = `hsl(${20 - intensity * 8}, 95%, ${50 + intensity * 8}%)`;
  const mid   = `hsl(${30 + intensity * 10}, 100%, ${55 + intensity * 10}%)`;
  const core  = `hsl(${50 + intensity * 10}, 100%, ${75 + intensity * 15}%)`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ position: "relative", zIndex: 1 }}
    >
      <defs>
        <radialGradient id={`ff-grad-${intensity.toFixed(2)}`} cx="50%" cy="70%" r="60%">
          <stop offset="0%"   stopColor={core} />
          <stop offset="45%"  stopColor={mid} />
          <stop offset="100%" stopColor={outer} />
        </radialGradient>
      </defs>
      {/* Outer flame */}
      <path
        d="M32 60c-11 0-19-7-19-18 0-7 4-13 8-17 1 4 4 6 6 6 1-7-1-12-4-17C30 16 36 9 35 2c8 5 17 16 17 28 0 4-1 7-3 10 1-3 0-7-3-9 1 8-4 14-9 16 5 0 9-2 11-6 1 12-7 19-16 19z"
        fill={`url(#ff-grad-${intensity.toFixed(2)})`}
      />
      {/* Inner core gets brighter */}
      <path
        d="M32 52c-5 0-9-3-9-9 0-4 3-8 5-10 1 5 5 6 6 4 0-3-1-6-2-9 4 3 9 9 9 15 0 5-4 9-9 9z"
        fill={core}
        opacity={0.5 + intensity * 0.5}
      />
    </svg>
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
