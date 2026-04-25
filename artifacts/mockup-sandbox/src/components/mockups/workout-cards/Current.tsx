import "./_group.css";
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
import sneakerImg from "../../../../../../client/src/assets/icons-3d/sneaker.webp";
import dumbbellImg from "../../../../../../client/src/assets/icons-3d/dumbbell.webp";
import boxingImg from "../../../../../../client/src/assets/icons-3d/boxing.webp";
import bicycleImg from "../../../../../../client/src/assets/icons-3d/bicycle.webp";
import mountainImg from "../../../../../../client/src/assets/icons-3d/mountain.webp";

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
  if (hMatch) out.duration = `${hMatch[1]}h ${hMatch[2]}m`;
  const km = metrics.match(/([\d.]+)\s*km/);
  if (km) out.distance = `${km[1]} km`;
  const cal = metrics.match(/(\d+)\s*cal/);
  if (cal) out.calories = `${cal[1]} cal`;
  const hr = metrics.match(/(\d+)\s*bpm\s*avg/);
  if (hr) out.avgHr = `${hr[1]} bpm`;
  const elev = metrics.match(/(\d+)\s*m\s*elevation/);
  if (elev) out.elevation = `${elev[1]} m`;
  const speed = metrics.match(/([\d.]+)\s*km\/h/);
  if (speed) out.speed = `${speed[1]} km/h`;
  return out;
}

interface PBFlags {
  calories?: boolean; distance?: boolean; duration?: boolean; speed?: boolean;
}

function workoutIcon(type: string): LucideIcon {
  const t = type.toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) return Footprints;
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride")) return Bike;
  if (t.includes("swim") || t.includes("pool")) return Waves;
  if (t.includes("hik") || t.includes("trail") || t.includes("mountain")) return Mountain;
  return Activity;
}

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
`;

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  type: "flame" | "core" | "spark";
  gravity?: number; r?: number; g?: number; b?: number;
  twinkle?: number;
};

function FireCanvas({ burst, width = 220, height = 240 }: { burst: number; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ particles: Particle[]; animId: number | null; running: boolean }>({ particles: [], animId: null, running: true });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
    const W = width, H = height;
    const cx = W * 0.55, cy = H * 0.78;
    const s = stateRef.current;

    const makeFlame = (): Particle => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.32;
      const speed = 1.6 + Math.random() * 1.4;
      return {
        x: cx + (Math.random() - 0.5) * 14, y: cy + Math.random() * 4,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.018 + Math.random() * 0.012,
        size: 11 + Math.random() * 9, type: "flame",
      };
    };
    const makeCore = (): Particle => ({
      x: cx + (Math.random() - 0.5) * 10, y: cy + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random() * 0.9,
      life: 1, decay: 0.05 + Math.random() * 0.03,
      size: 7 + Math.random() * 5, type: "core",
    });
    const makeSpark = (intense: boolean): Particle => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = intense ? 2.8 + Math.random() * 4.5 : 1.0 + Math.random() * 2.4;
      return {
        x: cx + (Math.random() - 0.5) * 10,
        y: cy - 6 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 1, decay: intense ? 0.012 + Math.random() * 0.014 : 0.018 + Math.random() * 0.02,
        size: intense ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
        gravity: 0.05 + Math.random() * 0.05, type: "spark",
        r: 255, g: Math.floor(180 + Math.random() * 70), b: Math.floor(Math.random() * 50),
        twinkle: Math.random() * Math.PI * 2,
      };
    };
    const triggerBurst = () => {
      for (let i = 0; i < 220; i++) s.particles.push(makeSpark(true));
      for (let i = 0; i < 140; i++) s.particles.push(makeSpark(false));
    };
    const drawFlame = (p: Particle) => {
      const a = p.life; const stretch = 1.7; const rad = p.size;
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, stretch);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      grad.addColorStop(0,    `rgba(255,240,180,${(a * 0.55).toFixed(2)})`);
      grad.addColorStop(0.25, `rgba(255,180,40,${(a * 0.5).toFixed(2)})`);
      grad.addColorStop(0.55, `rgba(255,90,0,${(a * 0.35).toFixed(2)})`);
      grad.addColorStop(0.85, `rgba(180,30,0,${(a * 0.18).toFixed(2)})`);
      grad.addColorStop(1,    `rgba(80,0,0,0)`);
      ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.restore();
    };
    const drawCore = (p: Particle) => {
      const a = p.life;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0,   `rgba(255,255,235,${(a * 0.95).toFixed(2)})`);
      grad.addColorStop(0.4, `rgba(255,220,140,${(a * 0.7).toFixed(2)})`);
      grad.addColorStop(1,   `rgba(255,140,0,0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
    };
    const drawSpark = (p: Particle, frame: number) => {
      const heat = p.life;
      const r = Math.floor(p.r ?? 255);
      const g = Math.floor((p.g ?? 220) * Math.max(0.5, heat));
      const b = Math.floor(p.b ?? 0);
      const tw = 0.85 + 0.15 * Math.sin(frame * 0.35 + (p.twinkle ?? 0));
      const haloR = p.size * 2.2;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      grd.addColorStop(0,   `rgba(${r},${g},${Math.min(180, b + 60)},${(heat * tw).toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${Math.floor(g * 0.5)},0,${(heat * 0.5 * tw).toFixed(2)})`);
      grd.addColorStop(1,   `rgba(120,0,0,0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,250,220,${(heat * tw * 0.95).toFixed(2)})`; ctx.fill();
    };
    const drawGlow = () => {
      const grd = ctx.createRadialGradient(cx, cy - 25, 0, cx, cy - 25, 95);
      grd.addColorStop(0,    "rgba(255,140,30,0.28)");
      grd.addColorStop(0.45, "rgba(255,80,0,0.13)");
      grd.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy - 25, 95, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
    };

    let frame = 0;
    const loop = () => {
      if (!s.running) { s.animId = requestAnimationFrame(loop); return; }
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) s.particles.push(makeFlame());
      if (frame % 2 === 0) for (let i = 0; i < 3; i++) s.particles.push(makeCore());
      for (let i = 0; i < 5; i++) s.particles.push(makeSpark(Math.random() < 0.4));
      drawGlow();
      ctx.globalCompositeOperation = "lighter";
      s.particles = s.particles.filter((p) => p.life > 0).slice(-900);
      for (const p of s.particles) {
        if (p.type === "flame") {
          p.x += p.vx + Math.sin(frame * 0.09 + p.size) * 0.45;
          p.y += p.vy; p.vy -= 0.025; p.life -= p.decay; p.size *= 0.988;
          drawFlame(p);
        } else if (p.type === "core") {
          p.x += p.vx; p.y += p.vy; p.life -= p.decay; p.size *= 0.96;
          drawCore(p);
        } else {
          p.x += p.vx; p.y += p.vy; p.vy += p.gravity ?? 0.08;
          p.vx *= 0.988; p.life -= p.decay;
          drawSpark(p, frame);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      frame++; s.animId = requestAnimationFrame(loop);
    };
    loop();
    const autoTimer = setTimeout(triggerBurst, 500);

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
      clearTimeout(autoTimer); observer?.disconnect(); s.particles = [];
    };
  }, [width, height]);

  useEffect(() => {
    if (!burst) return;
    const W = width, H = height; const cx = W * 0.55, cy = H * 0.78;
    const s = stateRef.current;
    const makeSpark = (intense: boolean): Particle => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = intense ? 2.8 + Math.random() * 4.5 : 1.0 + Math.random() * 2.4;
      return {
        x: cx + (Math.random() - 0.5) * 10, y: cy - 6,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6,
        life: 1, decay: intense ? 0.012 + Math.random() * 0.014 : 0.018 + Math.random() * 0.02,
        size: intense ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
        gravity: 0.05 + Math.random() * 0.05, type: "spark",
        r: 255, g: Math.floor(180 + Math.random() * 70), b: Math.floor(Math.random() * 50),
        twinkle: Math.random() * Math.PI * 2,
      };
    };
    for (let i = 0; i < 240; i++) s.particles.push(makeSpark(true));
    for (let i = 0; i < 140; i++) s.particles.push(makeSpark(false));
  }, [burst, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: -90, right: -40, width, height, pointerEvents: "none", zIndex: 10 }}
      aria-hidden="true"
    />
  );
}

function MetricPanel({
  icon: Icon, label, value, unit, delay, emphasized, isPB,
}: {
  icon: LucideIcon; label: string; value: string; unit?: string; delay: number;
  emphasized?: boolean; isPB?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      className="relative flex-1 rounded-2xl px-3 py-4 text-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg,#343434 0%,#272727 45%,#1c1c1c 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04), 0 6px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0))" }}
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
      <div className="relative text-[10px] font-bold tracking-[1.8px] uppercase text-zinc-400 mb-2">{label}</div>
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
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> PB
        </div>
      )}
    </div>
  );
}

function splitValueUnit(raw: string): { value: string; unit?: string } {
  if (/\d+\s*h\s*\d+\s*m/i.test(raw) || /\bmin\b/i.test(raw)) return { value: raw };
  const m = raw.match(/^([\d.,]+)\s*([a-zA-Z/]+)?$/);
  if (!m) return { value: raw };
  return { value: m[1].trim(), unit: m[2]?.trim() };
}

function WorkoutPostCard({ content, personalBests }: { content: string; personalBests?: PBFlags }) {
  const [cardVisible, setCardVisible] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  useEffect(() => { const t = setTimeout(() => setCardVisible(true), 100); return () => clearTimeout(t); }, []);

  const parsed = parseWorkoutPost(content);
  if (!parsed) return null;
  const pb: PBFlags = personalBests || {};
  const TypeIcon = workoutIcon(parsed.type);
  const typeImg = workoutImage(parsed.type);
  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());
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
  if (parsed.elevation) extras.push({ icon: Mountain, label: "Elev", raw: parsed.elevation });

  return (
    <div className="space-y-3 w-full max-w-[420px]">
      <style>{KEYFRAMES}</style>
      <div
        className="relative rounded-3xl p-7 text-white"
        style={{
          background: "linear-gradient(165deg, #353535 0%, #262626 35%, #1a1a1a 100%)",
          animation: cardVisible ? "wpc-pulseGlow 3s ease-in-out infinite" : "none",
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
          transition: "opacity 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1)",
          overflow: "visible",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            zIndex: 2,
          }}
        />
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: -20, right: -20, width: 260, height: 260, borderRadius: "50%", zIndex: 0,
            background: "radial-gradient(circle, rgba(255,100,0,0.28) 0%, rgba(255,60,0,0.10) 50%, transparent 75%)",
          }}
        />

        <div className="relative z-[1] flex items-center justify-between gap-3 mb-6">
          <div
            className="relative flex items-center justify-center rounded-2xl flex-shrink-0 overflow-hidden"
            style={{
              width: 88, height: 88,
              background: "radial-gradient(circle at 30% 22%, #3a3a3a 0%, #232323 55%, #141414 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04), 0 8px 22px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)",
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 600ms ease 200ms, transform 600ms ease 200ms",
            }}
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
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 40% at 30% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))" }}
            />
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
                style={{ filter: "drop-shadow(0 2px 6px rgba(255,106,0,0.55)) drop-shadow(0 1px 0 rgba(0,0,0,0.6))" }}
                aria-hidden="true"
              />
            )}
          </div>

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
            >
              {typeLabel}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-[3px] text-[10px] font-bold tracking-[2px] uppercase text-orange-500"
              style={{ animation: cardVisible ? "wpc-badgePop 500ms ease 800ms both" : "none" }}
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Workout Completed
            </div>
          </div>

          <button
            type="button"
            className="relative flex-shrink-0 rounded-2xl outline-none"
            style={{ width: 88, height: 88 }}
            onClick={() => setBurstCount((n) => n + 1)}
            aria-label="Celebrate"
          >
            <FireCanvas burst={burstCount} />
          </button>
        </div>

        <div
          className="relative z-[1] mx-auto mb-5 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,106,0,0.4), transparent)",
            animation: cardVisible ? "wpc-dividerGrow 800ms ease 600ms both" : "none",
          }}
        />

        <div className="relative z-[1] flex gap-2.5 mb-3.5">
          {calories && <MetricPanel icon={Flame} label="Calories" value={calories.value} unit={calories.unit ?? "cal"} delay={500} emphasized isPB={!!pb.calories} />}
          {duration && <MetricPanel icon={Clock} label="Time" value={duration.value} unit={duration.unit} delay={650} isPB={!!pb.duration} />}
          {distance && <MetricPanel icon={MapPin} label="Distance" value={distance.value} unit={distance.unit ?? "km"} delay={800} isPB={!!pb.distance} />}
        </div>

        {speed && (
          <div
            className="relative z-[1] rounded-2xl px-4 py-4 text-center overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#383838 0%,#262626 45%,#1a1a1a 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,106,0,0.25), 0 8px 18px rgba(0,0,0,0.55), 0 0 28px rgba(255,80,0,0.12)",
              animation: cardVisible ? "wpc-paceSlide 600ms ease 1000ms both" : "none",
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.07), rgba(255,255,255,0))" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-0 h-8"
              style={{
                background: "radial-gradient(ellipse at 50% 100%, rgba(255,106,0,0.35), rgba(255,106,0,0) 70%)",
              }}
            />
            <Gauge className="mx-auto mb-1.5 h-5 w-5 text-zinc-400" aria-hidden="true" />
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="text-[36px] font-black leading-none tabular-nums"
                style={{ color: "#ff6a00", textShadow: "0 0 20px rgba(255,106,0,0.5)" }}
              >
                {speed.value}
              </span>
              <span className="text-base font-semibold text-zinc-400">{speed.unit ?? "km/h"}</span>
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[2.5px] uppercase text-zinc-500">Pace</div>
          </div>
        )}
      </div>

      {extras.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {extras.map((e) => {
            const sv = splitValueUnit(e.raw);
            return (
              <div key={e.label} className="flex flex-col items-center justify-center rounded-md bg-zinc-800/40 px-2 py-2.5">
                <e.icon className="h-4 w-4 text-zinc-400 mb-1" aria-hidden="true" />
                <span className="text-sm font-bold leading-tight text-white">
                  {sv.value}
                  {sv.unit && <span className="ml-1 text-xs font-normal text-zinc-400">{sv.unit}</span>}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">{e.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Current() {
  const sample =
    "Completed a Running workout\n1h 45m • 12.5 km • 1250 cal • 7.1 km/h • 145 bpm avg • 320 m elevation";
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 60% 40%, #1c1008 0%, #0d0d0d 70%)" }}
    >
      <WorkoutPostCard content={sample} personalBests={{ calories: true }} />
    </div>
  );
}
