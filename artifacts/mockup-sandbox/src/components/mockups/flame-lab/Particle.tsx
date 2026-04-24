import "./_lab.css";
import { useEffect, useRef } from "react";

/* ParticleFlame
 * ─────────────
 * A real Canvas 2D particle simulation. Hundreds of small embers spawn at
 * the wick, accelerate upward, drift laterally with curl-noise-style sway,
 * fade through white→yellow→orange→deep-red→smoke as their lifespan elapses,
 * then die. Drawn with `globalCompositeOperation = 'lighter'` so colours
 * physically add — that's the trick that makes additive fire glow read as a
 * real photograph instead of vector art. */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  /** lateral wobble phase */
  phase: number;
}

function ParticleCanvas({
  width,
  height,
  intensity,
}: {
  width: number;
  height: number;
  intensity: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    // Cap DPR — high-density screens otherwise multiply fill cost.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = width * dpr;
    cvs.height = height * dpr;
    cvs.style.width = `${width}px`;
    cvs.style.height = `${height}px`;
    const ctx = cvs.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Honour user's motion preference — render a single static frame.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const particles: Particle[] = [];
    // Spawn rate scales with intensity. ~5+ particles/frame at full burn.
    const spawnPerFrame = 2.5 + intensity * 4;
    let spawnAccum = 0;
    // Hard cap so a paused/backgrounded tab can't accumulate forever.
    const MAX_PARTICLES = 220;

    // Fixed wick anchor at horizontal centre, near bottom.
    const baseX = width / 2;
    const baseY = height * 0.92;

    const ageColor = (t: number): [number, number, number, number] => {
      // t in [0..1]. Returns RGBA additive.
      // 0.0 → white-yellow,  0.3 → bright yellow,  0.55 → orange,  0.8 → deep red,  1.0 → smoke
      if (t < 0.18) {
        // White-hot core
        const k = t / 0.18;
        return [255, 250 - k * 30, 220 - k * 100, 1];
      } else if (t < 0.45) {
        // Yellow → orange
        const k = (t - 0.18) / 0.27;
        return [255, 220 - k * 80, 90 - k * 70, 0.95];
      } else if (t < 0.75) {
        // Orange → deep red
        const k = (t - 0.45) / 0.3;
        return [255 - k * 60, 130 - k * 90, 30 - k * 20, 0.85 - k * 0.35];
      } else {
        // Smoke fade
        const k = (t - 0.75) / 0.25;
        return [80 - k * 20, 70 - k * 30, 80 - k * 30, 0.4 - k * 0.4];
      }
    };

    let raf = 0;
    let lastTs = performance.now();

    // For reduced motion: pre-seed a static fire snapshot and skip the RAF.
    if (prefersReduced) {
      // Spawn a quick burst then advance several frames to settle.
      for (let s = 0; s < MAX_PARTICLES; s++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        const speed = 1.6 + Math.random() * 1.4 + intensity * 1.2;
        particles.push({
          x: baseX + (Math.random() - 0.5) * width * 0.1,
          y: baseY + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 4,
          life: Math.random() * 60,
          max: 80 + Math.random() * 70 + intensity * 50,
          size: 14 + Math.random() * 10 + intensity * 8,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    const tick = (ts: number) => {
      const dt = Math.min(50, ts - lastTs) / 16.67; // normalize to ~60fps frames
      lastTs = ts;

      // ── Spawn new particles at the wick ─────────────────────────────
      spawnAccum += spawnPerFrame * dt;
      while (spawnAccum >= 1 && particles.length < MAX_PARTICLES) {
        spawnAccum -= 1;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        const speed = 1.6 + Math.random() * 1.4 + intensity * 1.2;
        particles.push({
          x: baseX + (Math.random() - 0.5) * width * 0.1,
          y: baseY + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 80 + Math.random() * 70 + intensity * 50,
          size: 14 + Math.random() * 10 + intensity * 8,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // ── Clear fully — particle alpha handles the trail/fade ─────────
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      // ── Update + draw ───────────────────────────────────────────────
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        // Buoyancy: keep accelerating up so flames rise faster as they go.
        p.vy -= 0.08 * dt;
        // Lateral curl-noise-ish wobble.
        p.vx += Math.sin(p.life * 0.12 + p.phase) * 0.08 * dt;
        // Air resistance.
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const t = p.life / p.max;
        const [r, g, b, a] = ageColor(t);
        // Particle size shrinks slightly as it ages then fades.
        const radius = p.size * (1 - t * 0.35);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${a * 0.45})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Draw a glowing wick base under everything ───────────────────
      ctx.globalCompositeOperation = "lighter";
      const baseGrad = ctx.createRadialGradient(
        baseX,
        baseY + 4,
        0,
        baseX,
        baseY + 4,
        width * 0.32
      );
      baseGrad.addColorStop(0, `rgba(255,240,180,${0.6 + intensity * 0.3})`);
      baseGrad.addColorStop(0.4, `rgba(255,140,40,${0.4 + intensity * 0.3})`);
      baseGrad.addColorStop(1, "rgba(220,40,0,0)");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(baseX, baseY + 4, width * 0.32, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReduced) raf = requestAnimationFrame(tick);
    };

    if (prefersReduced) {
      // Single static frame — no RAF loop.
      tick(performance.now());
    } else {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [width, height, intensity]);

  return <canvas ref={ref} style={{ display: "block" }} />;
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
  // Bigger canvas for the leader for visual hierarchy.
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
      <ParticleCanvas width={w} height={h} intensity={intensity} />
      <div className="text-white text-3xl font-bold tracking-tight mt-2 z-10">
        {cals}
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/55 z-10">
        cal · burned
      </div>
    </div>
  );
}

export default function Particle() {
  return (
    <div className="min-h-screen w-full p-6" style={{ background: "#050308" }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-6 text-center">
        Particle — Canvas 2D Fire Simulation
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Stage label="Run" cals={412} intensity={0.6} />
        <Stage label="HIIT" cals={687} intensity={1.0} isLeader />
        <Stage label="Cycle" cals={295} intensity={0.43} />
      </div>
    </div>
  );
}
