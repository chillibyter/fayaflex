import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bike,
  CheckCircle2,
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
import sneakerImg from "@/assets/icons-3d/sneaker.webp";
import dumbbellImg from "@/assets/icons-3d/dumbbell.webp";
import boxingImg from "@/assets/icons-3d/boxing.webp";
import bicycleImg from "@/assets/icons-3d/bicycle.webp";
import mountainImg from "@/assets/icons-3d/mountain.webp";

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

// 3D photoreal product images for the icon tile.
// When a match exists the image fills the tile; otherwise we fall back to the Lucide icon above.
function workoutImage(type: string): string | null {
  const t = type.toLowerCase();
  if (t.includes("box") || t.includes("kickbox") || t.includes("spar") || t.includes("mma") || t.includes("fight")) return boxingImg;
  if (
    t.includes("strength") || t.includes("weight") || t.includes("lift") ||
    t.includes("dumb") || t.includes("gym") || t.includes("crossfit") || t.includes("resist")
  ) return dumbbellImg;
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride") || t.includes("spin")) return bicycleImg;
  if (t.includes("hik") || t.includes("climb") || t.includes("trail") || t.includes("mountain")) return mountainImg;
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) return sneakerImg;
  return null;
}

const KEYFRAMES = `
@keyframes wpc-pulseGlow {
  0%, 100% {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.10),
      inset 0 -1px 0 rgba(0,0,0,0.6),
      0 0 60px rgba(255,90,0,0.20),
      0 18px 48px rgba(0,0,0,0.75),
      0 30px 80px rgba(0,0,0,0.55);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.12),
      inset 0 -1px 0 rgba(0,0,0,0.6),
      0 0 110px rgba(255,90,0,0.36),
      0 18px 48px rgba(0,0,0,0.75),
      0 30px 80px rgba(0,0,0,0.55);
  }
}
@keyframes wpc-badgePop {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes wpc-paceSlide {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes wpc-dividerGrow {
  from { width: 0; }
  to   { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .wpc-card, .wpc-divider, .wpc-pace, .wpc-badge { animation: none !important; }
}
`;

// ── Procedural canvas fire engine ─────────────────────────────────────────────
// Torch-style tall tapered flame with continuous bright ember spray.
type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  type: "flame" | "core" | "spark";
  gravity?: number; r?: number; g?: number; b?: number;
  twinkle?: number;
};

function FireCanvas({
  burst,
  width = 220,
  height = 240,
  intensity = 1,
  top = -90,
  right = -40,
}: {
  burst: number;
  width?: number;
  height?: number;
  intensity?: number;
  top?: number;
  right?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ particles: Particle[]; animId: number | null; running: boolean }>({
    particles: [], animId: null, running: true,
  });
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const W = width;
    const H = height;
    // Anchor flame near bottom-center so it has room to rise tall
    const cx = W * 0.55;
    const cy = H * 0.78;
    const s = stateRef.current;

    // Tall flame body — strong upward velocity, narrow horizontal spread
    function makeFlame(): Particle {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.32;
      const speed = (1.6 + Math.random() * 1.4) * intensity;
      return {
        x: cx + (Math.random() - 0.5) * 14 * intensity,
        y: cy + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
        size: (11 + Math.random() * 9) * intensity,
        type: "flame",
      };
    }

    // Hot white-yellow core at the base — short-lived bright blobs
    function makeCore(): Particle {
      return {
        x: cx + (Math.random() - 0.5) * 10 * intensity,
        y: cy + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.4 * intensity,
        vy: (-0.6 - Math.random() * 0.9) * intensity,
        life: 1,
        decay: 0.05 + Math.random() * 0.03,
        size: (7 + Math.random() * 5) * intensity,
        type: "core",
      };
    }

    // Bright crisp ember — small dot of light shooting outward
    function makeSpark(intense: boolean): Particle {
      // Bias upward and outward (hemispherical, weighted up)
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = intense ? 2.8 + Math.random() * 4.5 : 1.0 + Math.random() * 2.4;
      return {
        x: cx + (Math.random() - 0.5) * 10,
        y: cy - 6 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 1,
        decay: intense ? 0.012 + Math.random() * 0.014 : 0.018 + Math.random() * 0.02,
        size: intense ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
        gravity: 0.05 + Math.random() * 0.05,
        type: "spark",
        r: 255,
        g: Math.floor(180 + Math.random() * 70),
        b: Math.floor(Math.random() * 50),
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    function triggerBurst() {
      for (let i = 0; i < 220; i++) s.particles.push(makeSpark(true));
      for (let i = 0; i < 140; i++) s.particles.push(makeSpark(false));
    }

    // Tall vertically-stretched flame ellipse for that tapered torch shape
    function drawFlame(p: Particle) {
      const a = p.life;
      const stretch = 1.7; // vertical elongation
      const rad = p.size;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.scale(1, stretch);
      const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, rad);
      grad.addColorStop(0,    `rgba(255,240,180,${(a * 0.55).toFixed(2)})`);
      grad.addColorStop(0.25, `rgba(255,180,40,${(a * 0.5).toFixed(2)})`);
      grad.addColorStop(0.55, `rgba(255,90,0,${(a * 0.35).toFixed(2)})`);
      grad.addColorStop(0.85, `rgba(180,30,0,${(a * 0.18).toFixed(2)})`);
      grad.addColorStop(1,    `rgba(80,0,0,0)`);
      ctx!.beginPath();
      ctx!.arc(0, 0, rad, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
      ctx!.restore();
    }

    function drawCore(p: Particle) {
      const a = p.life;
      const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0,   `rgba(255,255,235,${(a * 0.95).toFixed(2)})`);
      grad.addColorStop(0.4, `rgba(255,220,140,${(a * 0.7).toFixed(2)})`);
      grad.addColorStop(1,   `rgba(255,140,0,0)`);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    function drawSpark(p: Particle, frame: number) {
      const heat = p.life;
      const r = Math.floor(p.r ?? 255);
      const g = Math.floor((p.g ?? 220) * Math.max(0.5, heat));
      const b = Math.floor(p.b ?? 0);
      // Twinkle: subtle brightness modulation per particle
      const tw = 0.85 + 0.15 * Math.sin(frame * 0.35 + (p.twinkle ?? 0));
      const haloR = p.size * 2.2;
      const grd = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      grd.addColorStop(0,   `rgba(${r},${g},${Math.min(180, b + 60)},${(heat * tw).toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${Math.floor(g * 0.5)},0,${(heat * 0.5 * tw).toFixed(2)})`);
      grd.addColorStop(1,   `rgba(120,0,0,0)`);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx!.fillStyle = grd;
      ctx!.fill();

      // Bright pinpoint center
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,250,220,${(heat * tw * 0.95).toFixed(2)})`;
      ctx!.fill();
    }

    function drawGlow() {
      // Warm halo behind flame for dramatic torch look
      const haloR = 95 * intensity;
      const haloY = cy - 25 * intensity;
      const grd = ctx!.createRadialGradient(cx, haloY, 0, cx, haloY, haloR);
      grd.addColorStop(0,    "rgba(255,140,30,0.28)");
      grd.addColorStop(0.45, "rgba(255,80,0,0.13)");
      grd.addColorStop(1,    "rgba(0,0,0,0)");
      ctx!.beginPath();
      ctx!.arc(cx, haloY, haloR, 0, Math.PI * 2);
      ctx!.fillStyle = grd;
      ctx!.fill();
    }

    let frame = 0;
    function loop() {
      if (!s.running) {
        s.animId = requestAnimationFrame(loop);
        return;
      }
      ctx!.clearRect(0, 0, W, H);

      // Continuously spawn dense flame body, hot core, and ember rain
      // Spawn counts scale with intensity so a "top burner" gets a bigger, denser flame
      const flameCount = Math.round(6 * intensity);
      const coreCount = Math.round(3 * intensity);
      const sparkCount = Math.round(5 * intensity);
      for (let i = 0; i < flameCount; i++) s.particles.push(makeFlame());
      if (frame % 2 === 0) {
        for (let i = 0; i < coreCount; i++) s.particles.push(makeCore());
      }
      // Continuous ember spray (matches the video's persistent sparkle)
      for (let i = 0; i < sparkCount; i++) s.particles.push(makeSpark(Math.random() < 0.4));

      // Glow first (under everything)
      drawGlow();

      // Use additive blending for that magical glowing fire look
      ctx!.globalCompositeOperation = "lighter";

      s.particles = s.particles.filter((p) => p.life > 0).slice(-Math.floor(900 * intensity));
      for (const p of s.particles) {
        if (p.type === "flame") {
          p.x += p.vx + Math.sin(frame * 0.09 + p.size) * 0.45;
          p.y += p.vy;
          p.vy -= 0.025;
          p.life -= p.decay;
          p.size *= 0.988;
          drawFlame(p);
        } else if (p.type === "core") {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          p.size *= 0.96;
          drawCore(p);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity ?? 0.08;
          p.vx *= 0.988;
          p.life -= p.decay;
          drawSpark(p, frame);
        }
      }

      ctx!.globalCompositeOperation = "source-over";

      frame++;
      s.animId = requestAnimationFrame(loop);
    }

    loop();

    let autoTimer: ReturnType<typeof setTimeout> | null = null;
    if (!reduced.current) {
      autoTimer = setTimeout(triggerBurst, 500);
    }

    // Pause RAF when card scrolls offscreen (saves battery in feed)
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            s.running = e.isIntersecting;
            if (!e.isIntersecting) s.particles = [];
          }
        },
        { threshold: 0 }
      );
      observer.observe(canvas);
    }

    return () => {
      if (s.animId) cancelAnimationFrame(s.animId);
      if (autoTimer) clearTimeout(autoTimer);
      observer?.disconnect();
      s.particles = [];
    };
    // We intentionally re-init only on size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // External burst trigger (e.g. tap to celebrate)
  useEffect(() => {
    if (!burst || reduced.current) return;
    const W = width;
    const H = height;
    const cx = W * 0.55;
    const cy = H * 0.78;
    const s = stateRef.current;
    function makeSpark(intense: boolean): Particle {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = intense ? 2.8 + Math.random() * 4.5 : 1.0 + Math.random() * 2.4;
      return {
        x: cx + (Math.random() - 0.5) * 10,
        y: cy - 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 1,
        decay: intense ? 0.012 + Math.random() * 0.014 : 0.018 + Math.random() * 0.02,
        size: intense ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
        gravity: 0.05 + Math.random() * 0.05,
        type: "spark",
        r: 255,
        g: Math.floor(180 + Math.random() * 70),
        b: Math.floor(Math.random() * 50),
        twinkle: Math.random() * Math.PI * 2,
      };
    }
    for (let i = 0; i < 240; i++) s.particles.push(makeSpark(true));
    for (let i = 0; i < 140; i++) s.particles.push(makeSpark(false));
  }, [burst, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top,
        right,
        width,
        height,
        pointerEvents: "none",
        zIndex: 10,
      }}
      aria-hidden="true"
    />
  );
}

function MetricPanel({
  icon: Icon,
  label,
  value,
  unit,
  delay,
  emphasized,
  isPB,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  delay: number;
  emphasized?: boolean;
  isPB?: boolean;
  testId: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="relative flex-1 rounded-2xl px-3 py-4 text-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg,#343434 0%,#272727 45%,#1c1c1c 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04), 0 6px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
      data-testid={testId}
    >
      {/* Glossy top sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0))",
        }}
      />
      <Icon
        className={`relative mx-auto mb-1.5 h-5 w-5 ${emphasized ? "text-orange-400" : "text-zinc-300"}`}
        style={{
          filter: emphasized
            ? "drop-shadow(0 1px 4px rgba(255,106,0,0.6))"
            : "drop-shadow(0 1px 0 rgba(0,0,0,0.5))",
        }}
        aria-hidden="true"
      />
      <div className="relative text-[10px] font-bold tracking-[1.8px] uppercase text-zinc-400 mb-2">
        {label}
      </div>
      <div className="relative flex items-baseline justify-center gap-[3px]">
        <span
          className="text-[24px] font-extrabold leading-none text-white tabular-nums"
          style={{ textShadow: "0 1px 0 rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)" }}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-zinc-400">{unit}</span>}
      </div>
      {isPB && (
        <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-md ring-1 ring-amber-200/60">
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
          PB
        </div>
      )}
    </div>
  );
}

function splitValueUnit(raw: string): { value: string; unit?: string } {
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
  isTopBurner,
}: {
  content: string;
  personalBests?: PBFlags;
  /** When true, renders a dramatically larger flame to celebrate the top calorie-burner in the feed. */
  isTopBurner?: boolean;
}) {
  const [cardVisible, setCardVisible] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const parsed = parseWorkoutPost(content);
  if (!parsed) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const pb: PBFlags = personalBests || {};
  const TypeIcon = workoutIcon(parsed.type);
  const typeImg = workoutImage(parsed.type);
  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());
  // Auto-fit title: shrink font as label grows so it never truncates
  const titleLen = typeLabel.length;
  const titleSize =
    titleLen <= 8 ? "26px" :
    titleLen <= 12 ? "22px" :
    titleLen <= 18 ? "18px" :
    "16px";
  const titleLeading = titleLen <= 12 ? 1.1 : 1.15;

  const calories = parsed.calories ? splitValueUnit(parsed.calories) : null;
  const duration = parsed.duration ? splitValueUnit(parsed.duration) : null;
  const distance = parsed.distance ? splitValueUnit(parsed.distance) : null;
  const speed = parsed.speed ? splitValueUnit(parsed.speed) : null;

  const extras: Array<{ icon: LucideIcon; label: string; raw: string }> = [];
  if (parsed.avgHr) extras.push({ icon: Heart, label: "Avg HR", raw: parsed.avgHr });
  if (parsed.steps) extras.push({ icon: Footprints, label: "Steps", raw: parsed.steps });
  if (parsed.elevation) extras.push({ icon: Mountain, label: "Elev", raw: parsed.elevation });

  return (
    <div className="space-y-3" data-testid="workout-post-card">
      <style>{KEYFRAMES}</style>

      <div
        className="wpc-card relative rounded-3xl p-6 sm:p-7 text-white"
        style={{
          background:
            "linear-gradient(165deg, #353535 0%, #262626 35%, #1a1a1a 100%)",
          animation: cardVisible ? "wpc-pulseGlow 3s ease-in-out infinite" : "none",
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
          transition:
            "opacity 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1)",
          overflow: "visible",
        }}
      >
        {/* Top edge highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            zIndex: 2,
          }}
        />
        {/* Subtle grain noise for photoreal texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: "160px 160px",
            zIndex: 0,
          }}
        />
        {/* Right-side orange glow bleed */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: -20,
            right: -20,
            width: 260,
            height: 260,
            background:
              "radial-gradient(circle, rgba(255,100,0,0.28) 0%, rgba(255,60,0,0.10) 50%, transparent 75%)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />

        {/* TOP SECTION */}
        <div className="relative z-[1] flex items-center justify-between gap-3 mb-6">
          {/* Workout-type icon tile — beveled 3D look (3D photo when type matches, else Lucide glyph) */}
          <div
            className="relative flex items-center justify-center rounded-2xl flex-shrink-0 overflow-hidden"
            style={{
              width: 88,
              height: 88,
              background:
                "radial-gradient(circle at 30% 22%, #3a3a3a 0%, #232323 55%, #141414 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04), 0 8px 22px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)",
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 600ms ease 200ms, transform 600ms ease 200ms",
            }}
            data-testid="workout-type-badge"
          >
            {typeImg ? (
              <img
                src={typeImg}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  filter:
                    "brightness(1.18) contrast(1.12) saturate(1.08) drop-shadow(0 4px 10px rgba(0,0,0,0.7))",
                }}
              />
            ) : null}
            {/* Specular highlight (sits above image to keep glossy 3D feel) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 40% at 30% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
              }}
            />
            {/* Bottom shadow ridge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))",
              }}
            />
            {/* Subtle warm rim glow when using a 3D image */}
            {typeImg ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,106,0,0.18), inset 0 0 24px rgba(255,90,0,0.10)",
                }}
              />
            ) : (
              <TypeIcon
                className="relative h-12 w-12 text-orange-400"
                style={{
                  filter:
                    "drop-shadow(0 2px 6px rgba(255,106,0,0.55)) drop-shadow(0 1px 0 rgba(0,0,0,0.6))",
                }}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Title block */}
          <div
            className="flex-1 px-4 min-w-0"
            style={{
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 600ms ease 300ms, transform 600ms ease 300ms",
            }}
          >
            <div
              className="font-black tracking-[0.3px] text-white"
              style={{
                fontSize: titleSize,
                lineHeight: titleLeading,
                wordBreak: "break-word",
                textShadow: "0 1px 0 rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.45)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
              data-testid="text-workout-title"
            >
              {typeLabel}
            </div>
            <div
              className="wpc-badge mt-1.5 inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-[3px] text-[10px] font-bold tracking-[2px] uppercase text-orange-500"
              style={{
                animation: cardVisible ? "wpc-badgePop 500ms ease 800ms both" : "none",
              }}
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Workout Completed
            </div>
          </div>

          {/* Fire canvas tile */}
          <button
            type="button"
            className="relative flex-shrink-0 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/50"
            style={{ width: 88, height: 88 }}
            title={isTopBurner ? "Top calorie burner — tap to celebrate" : "Tap to celebrate"}
            aria-label={isTopBurner ? "Top burner — celebrate with sparks" : "Celebrate with sparks"}
            onClick={() => setBurstCount((n) => n + 1)}
            data-testid="button-celebrate"
          >
            <FireCanvas
              burst={burstCount}
              width={isTopBurner ? 280 : 220}
              height={isTopBurner ? 320 : 240}
              intensity={isTopBurner ? 1.5 : 1}
              top={isTopBurner ? -130 : -90}
              right={isTopBurner ? -65 : -40}
            />
            {isTopBurner && (
              <div
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-2 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-lg ring-1 ring-amber-200/70"
                style={{ animation: cardVisible ? "wpc-badgePop 500ms ease 600ms both" : "none" }}
                data-testid="badge-top-burner"
              >
                <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                TOP BURNER
              </div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div
          className="wpc-divider relative z-[1] mx-auto mb-5 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,106,0,0.4), transparent)",
            animation: cardVisible ? "wpc-dividerGrow 800ms ease 600ms both" : "none",
          }}
        />

        {/* METRICS ROW */}
        <div className="relative z-[1] flex gap-2.5 mb-3.5">
          {calories ? (
            <MetricPanel
              icon={Flame}
              label="Calories"
              value={calories.value}
              unit={calories.unit ?? "cal"}
              delay={500}
              emphasized
              isPB={!!pb.calories}
              testId="metric-calories"
            />
          ) : (
            <div className="flex-1" />
          )}
          {duration ? (
            <MetricPanel
              icon={Clock}
              label="Time"
              value={duration.value}
              unit={duration.unit}
              delay={650}
              isPB={!!pb.duration}
              testId="metric-time"
            />
          ) : (
            <div className="flex-1" />
          )}
          {distance ? (
            <MetricPanel
              icon={MapPin}
              label="Distance"
              value={distance.value}
              unit={distance.unit ?? "km"}
              delay={800}
              isPB={!!pb.distance}
              testId="metric-distance"
            />
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* PACE PANEL */}
        {speed && (
          <div
            className="wpc-pace relative z-[1] rounded-2xl px-4 py-4 text-center overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg,#383838 0%,#262626 45%,#1a1a1a 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,106,0,0.25), 0 8px 18px rgba(0,0,0,0.55), 0 0 28px rgba(255,80,0,0.12)",
              animation: cardVisible ? "wpc-paceSlide 600ms ease 1000ms both" : "none",
            }}
            data-testid="metric-pace"
          >
            {/* Top sheen */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.07), rgba(255,255,255,0))",
              }}
            />
            {/* Orange floor glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-0 h-8"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(255,106,0,0.35), rgba(255,106,0,0) 70%)",
              }}
            />
            <Gauge className="mx-auto mb-1.5 h-5 w-5 text-zinc-400" aria-hidden="true" />
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="text-[36px] font-black leading-none tabular-nums"
                style={{
                  color: "#ff6a00",
                  textShadow: "0 0 20px rgba(255,106,0,0.5)",
                }}
              >
                {speed.value}
              </span>
              <span className="text-base font-semibold text-zinc-400">
                {speed.unit ?? "km/h"}
              </span>
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[2.5px] uppercase text-zinc-500">
              Pace
            </div>
            {pb.speed && (
              <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-950 shadow-md ring-1 ring-amber-200/60">
                <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                PB
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional secondary metrics */}
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
                <e.icon className="h-4 w-4 text-muted-foreground mb-1" aria-hidden="true" />
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
