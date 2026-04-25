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
import sneakerImg from "@/assets/icons-3d/sneaker.png";
import dumbbellImg from "@/assets/icons-3d/dumbbell.png";
import boxingImg from "@/assets/icons-3d/boxing.png";
import bicycleImg from "@/assets/icons-3d/bicycle.png";
import mountainImg from "@/assets/icons-3d/mountain.png";

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
type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  type: "flame" | "spark";
  gravity?: number; r?: number; g?: number; b?: number;
};

function FireCanvas({ burst, width = 200, height = 200 }: { burst: number; width?: number; height?: number }) {
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
    const cx = W * 0.55;
    const cy = H * 0.62;
    const s = stateRef.current;

    function makeFlame(): Particle {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 0.6 + Math.random() * 1.1;
      return {
        x: cx + (Math.random() - 0.5) * 18,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.014,
        size: 14 + Math.random() * 22,
        type: "flame",
      };
    }

    function makeSpark(big: boolean): Particle {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 20 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1,
        decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05,
        type: "spark",
        r: 255,
        g: Math.floor(200 + Math.random() * 55),
        b: Math.floor(Math.random() * 60),
      };
    }

    function triggerBurst() {
      for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
      for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
    }

    function drawFlame(p: Particle) {
      const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      const a = p.life;
      grad.addColorStop(0,   `rgba(255,255,200,${(a * 0.95).toFixed(2)})`);
      grad.addColorStop(0.2, `rgba(255,200,50,${(a * 0.85).toFixed(2)})`);
      grad.addColorStop(0.5, `rgba(255,100,10,${(a * 0.6).toFixed(2)})`);
      grad.addColorStop(0.8, `rgba(200,30,0,${(a * 0.3).toFixed(2)})`);
      grad.addColorStop(1,   `rgba(100,0,0,0)`);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    function drawSpark(p: Particle) {
      const heat = p.life;
      const r = Math.floor(p.r ?? 255);
      const g = Math.floor((p.g ?? 220) * heat);
      const b = Math.floor(p.b ?? 0);
      const grd = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${heat.toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${Math.floor(g * 0.5)},0,${(heat * 0.7).toFixed(2)})`);
      grd.addColorStop(1,   `rgba(100,0,0,0)`);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx!.fillStyle = grd;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,220,${(heat * 0.9).toFixed(2)})`;
      ctx!.fill();
    }

    function drawGlow() {
      const grd = ctx!.createRadialGradient(cx, cy - 30, 0, cx, cy - 30, 110);
      grd.addColorStop(0,   "rgba(255,120,0,0.22)");
      grd.addColorStop(0.5, "rgba(255,60,0,0.10)");
      grd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.beginPath();
      ctx!.arc(cx, cy - 30, 110, 0, Math.PI * 2);
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

      if (frame % 2 === 0) {
        for (let i = 0; i < 5; i++) s.particles.push(makeFlame());
      }
      drawGlow();

      s.particles = s.particles.filter((p) => p.life > 0).slice(-650);
      for (const p of s.particles) {
        if (p.type === "flame") {
          p.x += p.vx + Math.sin(frame * 0.08 + p.size) * 0.4;
          p.y += p.vy;
          p.vy -= 0.02;
          p.life -= p.decay;
          p.size *= 0.992;
          drawFlame(p);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity ?? 0.08;
          p.vx *= 0.985;
          p.life -= p.decay;
          drawSpark(p);
        }
      }
      frame++;
      s.animId = requestAnimationFrame(loop);
    }

    loop();

    let autoTimer: ReturnType<typeof setTimeout> | null = null;
    if (!reduced.current) {
      autoTimer = setTimeout(triggerBurst, 600);
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
    const cy = H * 0.62;
    const s = stateRef.current;
    function makeSpark(big: boolean): Particle {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1,
        decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05,
        type: "spark",
        r: 255,
        g: Math.floor(200 + Math.random() * 55),
        b: Math.floor(Math.random() * 60),
      };
    }
    for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
    for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
  }, [burst, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: -30,
        right: -20,
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
}: {
  content: string;
  personalBests?: PBFlags;
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
            title="Tap to celebrate"
            aria-label="Celebrate with sparks"
            onClick={() => setBurstCount((n) => n + 1)}
            data-testid="button-celebrate"
          >
            <FireCanvas burst={burstCount} />
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
