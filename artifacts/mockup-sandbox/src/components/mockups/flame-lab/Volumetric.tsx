import "./_lab.css";

/* VolumetricFlame
 * ───────────────
 * CSS-only photoreal flame built from a stack of heavily-blurred radial
 * gradients composited with `mix-blend-mode: lighten` (so layers physically
 * add together like additive light). Each layer animates on its own timing
 * to give the flame a continuous breathing/dancing motion. Reads like a
 * long-exposure photograph of a real torch. Zero JavaScript, very GPU-cheap. */

function VolFlame({
  width,
  height,
  intensity,
}: {
  width: number;
  height: number;
  intensity: number;
}) {
  // Slightly desaturate every layer if intensity is low (cooler, dimmer fire).
  const opacityScale = 0.55 + intensity * 0.45;
  return (
    <div
      className="vol-flame"
      style={{
        width,
        height,
        opacity: opacityScale,
        filter: `saturate(${0.85 + intensity * 0.3})`,
      }}
    >
      <div className="vol-halo" />
      <div className="vol-layer vol-l1" />
      <div className="vol-layer vol-l2" />
      <div className="vol-layer vol-l3" />
      <div className="vol-layer vol-core" />
      <div className="vol-base" />
      <div className="vol-blue-base" />
    </div>
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
      <VolFlame width={w} height={h} intensity={intensity} />
      <div className="text-white text-3xl font-bold tracking-tight mt-2 z-10">
        {cals}
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/55 z-10">
        cal · burned
      </div>
    </div>
  );
}

export default function Volumetric() {
  return (
    <div className="min-h-screen w-full p-6" style={{ background: "#050308" }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-6 text-center">
        Volumetric — Stacked Blurred Gradients (Photo Glow)
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Stage label="Run" cals={412} intensity={0.6} />
        <Stage label="HIIT" cals={687} intensity={1.0} isLeader />
        <Stage label="Cycle" cals={295} intensity={0.43} />
      </div>
    </div>
  );
}
