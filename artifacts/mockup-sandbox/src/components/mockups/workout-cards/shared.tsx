import "./_group.css";
import { useId } from "react";
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

/* ===== Photorealistic 3D flame =====
 *  Built from three SVG flame tongues, each warped in real-time by an
 *  animated `feTurbulence` + `feDisplacementMap` filter so the silhouette
 *  organically morphs (instead of just scaling). Adds a darker
 *  pre-combustion fuel pocket near the wick, a tiny blue base where
 *  fuel meets oxygen, and a specular highlight on the molten core for a
 *  3D "wet glow" feel. */

interface TonguePalette {
  /** Multi-stop radial gradient (cy near bottom). */
  stops: { o: number; c: string; a?: number }[];
  /** SVG path. */
  d: string;
  /** Displacement amplitude — how much the edges wobble. */
  disp: number;
  /** Turbulence frequency — higher = finer noise. */
  freq: string;
  /** Animation duration of the seed sweep. */
  dur: string;
  /** Octaves of fractal noise. */
  octaves: number;
}

/** A single flame-tongue, warped by an animated turbulence filter. */
function FlameTongue({
  variant,
  intensity,
  idPrefix,
}: {
  variant: "outer" | "mid" | "core";
  intensity: number;
  idPrefix: string;
}) {
  // Photometric color stops. 5 stops give a smoother, more volumetric falloff
  // than a hard 3-stop ramp. Hot center → cooler shoulders → dim deep red base.
  const palettes: Record<"outer" | "mid" | "core", TonguePalette> = {
    outer: {
      stops: [
        { o: 0,    c: `hsl(${36 + intensity * 6}, 100%, ${62 + intensity * 8}%)`, a: 0.95 },
        { o: 0.30, c: `hsl(${24 + intensity * 6}, 100%, ${55 + intensity * 6}%)`, a: 0.95 },
        { o: 0.55, c: `hsl(${14 + intensity * 5}, 95%,  ${44 + intensity * 6}%)`, a: 0.92 },
        { o: 0.80, c: `hsl(${4  + intensity * 4}, 92%,  ${30 + intensity * 5}%)`, a: 0.85 },
        { o: 1,    c: `hsl(${0  + intensity * 4}, 90%,  ${18 + intensity * 4}%)`, a: 0.7  },
      ],
      d: "M32 78 C 14 72, 8 54, 16 36 C 20 42, 26 40, 26 32 C 26 22, 22 12, 30 4 C 34 14, 42 16, 44 30 C 50 50, 48 72, 32 78 Z",
      disp: 7 + intensity * 4,
      freq: "0.018 0.045",
      dur: "9s",
      octaves: 2,
    },
    mid: {
      stops: [
        { o: 0,    c: `hsl(${56 + intensity * 6}, 100%, ${80 + intensity * 10}%)`, a: 1 },
        { o: 0.30, c: `hsl(${46 + intensity * 6}, 100%, ${68 + intensity * 10}%)`, a: 1 },
        { o: 0.55, c: `hsl(${36 + intensity * 6}, 100%, ${56 + intensity * 8}%)`,  a: 0.95 },
        { o: 0.80, c: `hsl(${24 + intensity * 5}, 100%, ${46 + intensity * 6}%)`,  a: 0.85 },
        { o: 1,    c: `hsl(${14 + intensity * 4}, 95%,  ${36 + intensity * 4}%)`,  a: 0.6  },
      ],
      d: "M32 76 C 18 70, 14 54, 22 38 C 24 44, 28 42, 28 34 C 28 24, 26 14, 32 8 C 36 16, 40 20, 41 32 C 46 50, 44 70, 32 76 Z",
      disp: 4 + intensity * 3,
      freq: "0.028 0.07",
      dur: "5.5s",
      octaves: 2,
    },
    core: {
      stops: [
        { o: 0,    c: `hsl(58, 100%, ${94 + intensity * 6}%)`, a: 1 },
        { o: 0.25, c: `hsl(56, 100%, ${88 + intensity * 8}%)`, a: 1 },
        { o: 0.55, c: `hsl(${50 + intensity * 4}, 100%, ${76 + intensity * 10}%)`, a: 0.97 },
        { o: 0.85, c: `hsl(${40 + intensity * 6}, 100%, ${62 + intensity * 6}%)`,  a: 0.85 },
        { o: 1,    c: `hsl(${30 + intensity * 6}, 100%, ${50 + intensity * 4}%)`,  a: 0.5  },
      ],
      d: "M32 70 C 24 64, 22 52, 28 40 C 30 44, 32 42, 32 36 C 32 28, 30 20, 33 14 C 36 22, 38 26, 38 36 C 40 50, 38 66, 32 70 Z",
      disp: 2 + intensity * 2,
      freq: "0.04 0.09",
      dur: "3.5s",
      octaves: 2,
    },
  };
  const p = palettes[variant];
  const gradId   = `${idPrefix}-grad-${variant}`;
  const filterId = `${idPrefix}-fil-${variant}`;
  const seedStart = variant === "outer" ? 1 : variant === "mid" ? 7 : 13;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 64 80"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Animated turbulence + displacement → organic edge bubbling.
            The seed sweeps continuously so the noise pattern evolves
            instead of looping crisply. */}
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={p.freq}
            numOctaves={p.octaves}
            seed={seedStart}
            result="noise"
          >
            <animate
              attributeName="seed"
              from={seedStart}
              to={seedStart + 90}
              dur={p.dur}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={p.disp}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <radialGradient id={gradId} cx="50%" cy="78%" r="68%">
          {p.stops.map((s, i) => (
            <stop
              key={i}
              offset={`${s.o * 100}%`}
              stopColor={s.c}
              stopOpacity={s.a ?? 1}
            />
          ))}
        </radialGradient>
      </defs>

      <g filter={`url(#${filterId})`}>
        <path d={p.d} fill={`url(#${gradId})`} />

        {/* Specular highlight on the hot core — fakes 3D molten depth.
            Lives inside the displaced group so it warps with the flame. */}
        {variant === "core" && (
          <ellipse
            cx="30"
            cy="46"
            rx="2.6"
            ry="6"
            fill="white"
            opacity={0.45 + intensity * 0.35}
          />
        )}

        {/* Pre-combustion "fuel pocket" — slightly darker zone in the lower
            interior of the outer envelope, the way real torch flames have a
            shadow above the wick. */}
        {variant === "outer" && (
          <ellipse
            cx="32"
            cy="62"
            rx="6"
            ry="9"
            fill="black"
            opacity={0.18 + intensity * 0.1}
          />
        )}
      </g>

      {/* Tiny cool-blue accent at the very wick where fuel meets oxygen.
          Rendered OUTSIDE the displacement filter so it stays anchored. */}
      {variant === "outer" && (
        <ellipse
          cx="32"
          cy="76"
          rx="5"
          ry="1.6"
          fill={`hsl(${200 + intensity * 10}, 95%, ${65 + intensity * 10}%)`}
          opacity={0.55 + intensity * 0.25}
          style={{ filter: "blur(0.6px)" }}
        />
      )}
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
  // Stable per-instance ID prefix so each flame's filters/gradients don't
  // collide across cards on the same page.
  const rawId = useId();
  const idPrefix = `ff${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

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
        <FlameTongue variant="outer" intensity={intensity} idPrefix={idPrefix} />
      </span>
      <span className="ff-flame-layer ff-flame-mid">
        <FlameTongue variant="mid" intensity={intensity} idPrefix={idPrefix} />
      </span>
      <span className="ff-flame-layer ff-flame-core">
        <FlameTongue variant="core" intensity={intensity} idPrefix={idPrefix} />
      </span>

      {/* Heat shimmer band that floats above the flame tip — fakes the
          refractive air-distortion you see above real fire. */}
      <span className="ff-heat-shimmer" />

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
 *  keep working — renders the mid tongue as a single warped SVG. */
export function FlameSvg({
  size = 48,
  intensity = 0.5,
}: {
  size?: number;
  intensity?: number;
  variant?: "front" | "back";
}) {
  const rawId = useId();
  const idPrefix = `ff${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span style={{ display: "inline-block", width: size, height: size }}>
      <FlameTongue variant="mid" intensity={intensity} idPrefix={idPrefix} />
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
