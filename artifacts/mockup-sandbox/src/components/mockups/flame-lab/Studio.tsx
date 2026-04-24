import "./_lab.css";
import { useId } from "react";

/* StudioFlame
 * ───────────
 * Hand-painted SVG flame with multiple internal contours (deep red envelope,
 * orange body, yellow shoulders, white-hot wick, blue base) all wrapped in
 * an animated turbulence-displacement filter so the silhouette breathes.
 * Above the tip: rising smoke wisps. Aiming for a "studio reference photo
 * of a torch flame" aesthetic. */

interface FlameLayer {
  d: string;
  fill: string;
  opacity?: number;
  blur?: number;
}

function StudioSvg({
  width,
  height,
  intensity,
}: {
  width: number;
  height: number;
  intensity: number;
}) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fId = `studio-fil-${rid}`;
  const gOuter = `studio-g-out-${rid}`;
  const gMid = `studio-g-mid-${rid}`;
  const gCore = `studio-g-core-${rid}`;
  const gWick = `studio-g-wick-${rid}`;

  // Layered concentric flame contours, painted from outside in, each slightly
  // smaller and hotter than the previous.
  const layers: FlameLayer[] = [
    {
      // Outer envelope — deepest red, most translucent.
      d: "M64 152 C 22 144, 12 110, 28 72 C 34 80, 46 76, 46 64 C 46 48, 38 28, 56 8 C 64 24, 84 32, 86 56 C 96 84, 100 144, 64 152 Z",
      fill: `url(#${gOuter})`,
      opacity: 0.85,
      blur: 1.2,
    },
    {
      // Orange body.
      d: "M64 148 C 30 140, 24 108, 36 76 C 40 82, 50 80, 50 70 C 50 56, 44 38, 60 18 C 66 32, 80 38, 82 60 C 90 86, 92 138, 64 148 Z",
      fill: `url(#${gMid})`,
      opacity: 0.95,
      blur: 0.6,
    },
    {
      // Yellow shoulders + white core wash.
      d: "M64 142 C 40 134, 36 108, 44 82 C 48 86, 56 84, 56 76 C 56 64, 52 48, 62 30 C 68 42, 76 48, 78 66 C 84 88, 84 132, 64 142 Z",
      fill: `url(#${gCore})`,
      opacity: 0.9,
      blur: 0.3,
    },
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 160"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <filter id={fId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.05"
            numOctaves="2"
            seed="3"
            result="n"
          >
            {/* Smoothly drift baseFrequency (avoids the seed-step "popping").
                values list ping-pongs around the base, giving fluid convection. */}
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.022 0.05; 0.026 0.058; 0.020 0.046; 0.024 0.052; 0.022 0.05"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={5 + intensity * 6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <radialGradient id={gOuter} cx="50%" cy="80%" r="65%">
          <stop offset="0%" stopColor={`hsl(28, 100%, ${55 + intensity * 8}%)`} stopOpacity="0.95" />
          <stop offset="35%" stopColor={`hsl(18, 100%, ${48 + intensity * 6}%)`} stopOpacity="0.9" />
          <stop offset="65%" stopColor={`hsl(8, 95%, ${36 + intensity * 6}%)`} stopOpacity="0.85" />
          <stop offset="100%" stopColor={`hsl(0, 90%, ${18 + intensity * 4}%)`} stopOpacity="0.5" />
        </radialGradient>

        <radialGradient id={gMid} cx="50%" cy="78%" r="62%">
          <stop offset="0%" stopColor={`hsl(50, 100%, ${78 + intensity * 10}%)`} stopOpacity="1" />
          <stop offset="35%" stopColor={`hsl(38, 100%, ${62 + intensity * 8}%)`} stopOpacity="0.97" />
          <stop offset="70%" stopColor={`hsl(24, 100%, ${50 + intensity * 6}%)`} stopOpacity="0.85" />
          <stop offset="100%" stopColor={`hsl(14, 95%, ${36 + intensity * 4}%)`} stopOpacity="0.5" />
        </radialGradient>

        <radialGradient id={gCore} cx="50%" cy="74%" r="58%">
          <stop offset="0%" stopColor={`hsl(58, 100%, ${94 + intensity * 6}%)`} stopOpacity="1" />
          <stop offset="30%" stopColor={`hsl(54, 100%, ${85 + intensity * 8}%)`} stopOpacity="1" />
          <stop offset="60%" stopColor={`hsl(46, 100%, ${72 + intensity * 8}%)`} stopOpacity="0.9" />
          <stop offset="100%" stopColor={`hsl(36, 100%, ${56 + intensity * 6}%)`} stopOpacity="0.4" />
        </radialGradient>

        <radialGradient id={gWick} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="40%" stopColor="rgba(255,235,150,0.95)" />
          <stop offset="100%" stopColor="rgba(255,160,40,0)" />
        </radialGradient>
      </defs>

      {/* Halo glow behind everything. */}
      <ellipse
        cx="64"
        cy="100"
        rx="56"
        ry="74"
        fill={`url(#${gOuter})`}
        opacity={0.18 + intensity * 0.18}
        style={{ filter: "blur(18px)" }}
      />

      {/* Main flame layers — wrapped in displacement filter. */}
      <g filter={`url(#${fId})`}>
        {layers.map((l, i) => (
          <path
            key={i}
            d={l.d}
            fill={l.fill}
            opacity={l.opacity}
            style={l.blur ? { filter: `blur(${l.blur}px)` } : undefined}
          />
        ))}

        {/* Pre-combustion fuel pocket — the dim zone above the wick. */}
        <ellipse
          cx="64"
          cy="124"
          rx="5"
          ry="9"
          fill="black"
          opacity={0.12 + intensity * 0.06}
          style={{ filter: "blur(2px)" }}
        />

        {/* Hot wick column — narrow vertical white-hot streak (not a blob). */}
        <path
          d="M62 110 Q 64 70 64 50 Q 64 70 66 110 Z"
          fill="white"
          opacity={0.55 + intensity * 0.3}
          style={{ filter: "blur(1.5px)" }}
        />
      </g>

      {/* Bright wick below — anchored, not displaced. */}
      <ellipse
        cx="64"
        cy="150"
        rx="18"
        ry="6"
        fill={`url(#${gWick})`}
        opacity={0.7 + intensity * 0.25}
        style={{ filter: "blur(2px)" }}
      />

      {/* Cool-blue base — fuel/oxygen interface. */}
      <ellipse
        cx="64"
        cy="148"
        rx="9"
        ry="2.5"
        fill={`hsl(200, 95%, ${68 + intensity * 10}%)`}
        opacity={0.55 + intensity * 0.25}
        style={{ filter: "blur(1px)" }}
      />
    </svg>
  );
}

function Stage({
  label,
  intensity,
  isLeader,
  cals,
}: {
  label: string;
  intensity: number;
  isLeader?: boolean;
  cals: number;
}) {
  const w = isLeader ? 220 : 150;
  const h = isLeader ? 280 : 200;

  // Smoke wisps only for leader so it reads as "really cooking".
  const smokes = isLeader
    ? [
        { x: -6, drift: 14, delay: 0 },
        { x: 4, drift: -10, delay: 1.0 },
        { x: -2, drift: 8, delay: 2.0 },
        { x: 8, drift: -6, delay: 2.7 },
      ]
    : [];

  return (
    <div className="lab-stage rounded-2xl p-6 flex flex-col items-center justify-end relative overflow-hidden border border-white/5">
      <div className="absolute top-3 left-4 text-[10px] tracking-[0.2em] uppercase text-white/55">
        {label}
      </div>
      {isLeader && (
        <div className="absolute top-3 right-4 text-[10px] tracking-[0.2em] uppercase text-amber-300/90 font-semibold">
          Leader
        </div>
      )}

      <div className="relative" style={{ width: w, height: h }}>
        <StudioSvg width={w} height={h} intensity={intensity} />
        {smokes.map((s, i) => (
          <span
            key={i}
            className="studio-smoke"
            style={
              {
                ["--smoke-x" as any]: `${s.x}px`,
                ["--smoke-drift" as any]: `${s.drift}px`,
                animationDelay: `${s.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="text-white text-3xl font-bold tracking-tight mt-2 z-10">
        {cals}
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/55 z-10">
        cal · burned
      </div>
    </div>
  );
}

export default function Studio() {
  return (
    <div className="min-h-screen w-full p-6" style={{ background: "#050308" }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-6 text-center">
        Studio — Hand-Painted SVG with Smoke
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Stage label="Run" cals={412} intensity={0.6} />
        <Stage label="HIIT" cals={687} intensity={1.0} isLeader />
        <Stage label="Cycle" cals={295} intensity={0.43} />
      </div>
    </div>
  );
}
