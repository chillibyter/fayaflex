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

const KEYFRAMES = `
@keyframes wpc-pulseGlow {
  0%, 100% { box-shadow: 0 0 60px rgba(255,90,0,0.18), 0 12px 48px rgba(0,0,0,0.7); }
  50%      { box-shadow: 0 0 100px rgba(255,90,0,0.32), 0 12px 48px rgba(0,0,0,0.7); }
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
  type: "flame" | "spark";
  gravity?: number; r?: number; g?: number; b?: number;
};

function FireCanvas({ burst, width = 200, height = 200 }: { burst: number; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ particles: Particle[]; animId: number | null }>({ particles: [], animId: null });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
    const W = width, H = height;
    const cx = W * 0.55, cy = H * 0.62;
    const s = stateRef.current;

    const makeFlame = (): Particle => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 0.6 + Math.random() * 1.1;
      return {
        x: cx + (Math.random() - 0.5) * 18, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.012 + Math.random() * 0.014,
        size: 14 + Math.random() * 22, type: "flame",
      };
    };
    const makeSpark = (big: boolean): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 20 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1, decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05, type: "spark",
        r: 255, g: Math.floor(200 + Math.random() * 55), b: Math.floor(Math.random() * 60),
      };
    };
    const triggerBurst = () => {
      for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
      for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
    };
    const drawFlame = (p: Particle) => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      const a = p.life;
      grad.addColorStop(0, `rgba(255,255,200,${(a * 0.95).toFixed(2)})`);
      grad.addColorStop(0.2, `rgba(255,200,50,${(a * 0.85).toFixed(2)})`);
      grad.addColorStop(0.5, `rgba(255,100,10,${(a * 0.6).toFixed(2)})`);
      grad.addColorStop(0.8, `rgba(200,30,0,${(a * 0.3).toFixed(2)})`);
      grad.addColorStop(1, `rgba(100,0,0,0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
    };
    const drawSpark = (p: Particle) => {
      const heat = p.life;
      const r = Math.floor(p.r ?? 255);
      const g = Math.floor((p.g ?? 220) * heat);
      const b = Math.floor(p.b ?? 0);
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grd.addColorStop(0, `rgba(${r},${g},${b},${heat.toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${Math.floor(g * 0.5)},0,${(heat * 0.7).toFixed(2)})`);
      grd.addColorStop(1, `rgba(100,0,0,0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${(heat * 0.9).toFixed(2)})`; ctx.fill();
    };
    const drawGlow = () => {
      const grd = ctx.createRadialGradient(cx, cy - 30, 0, cx, cy - 30, 110);
      grd.addColorStop(0, "rgba(255,120,0,0.22)");
      grd.addColorStop(0.5, "rgba(255,60,0,0.10)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy - 30, 110, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
    };

    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      if (frame % 2 === 0) for (let i = 0; i < 5; i++) s.particles.push(makeFlame());
      drawGlow();
      s.particles = s.particles.filter((p) => p.life > 0).slice(-650);
      for (const p of s.particles) {
        if (p.type === "flame") {
          p.x += p.vx + Math.sin(frame * 0.08 + p.size) * 0.4;
          p.y += p.vy; p.vy -= 0.02; p.life -= p.decay; p.size *= 0.992;
          drawFlame(p);
        } else {
          p.x += p.vx; p.y += p.vy; p.vy += p.gravity ?? 0.08;
          p.vx *= 0.985; p.life -= p.decay;
          drawSpark(p);
        }
      }
      frame++; s.animId = requestAnimationFrame(loop);
    };
    loop();
    const autoTimer = setTimeout(triggerBurst, 600);
    return () => {
      if (s.animId) cancelAnimationFrame(s.animId);
      clearTimeout(autoTimer); s.particles = [];
    };
  }, [width, height]);

  useEffect(() => {
    if (!burst) return;
    const W = width, H = height; const cx = W * 0.55, cy = H * 0.62;
    const s = stateRef.current;
    const makeSpark = (big: boolean): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24, y: cy - 20,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1, decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05, type: "spark",
        r: 255, g: Math.floor(200 + Math.random() * 55), b: Math.floor(Math.random() * 60),
      };
    };
    for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
    for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
  }, [burst, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: -30, right: -20, width, height, pointerEvents: "none", zIndex: 10 }}
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
      className="relative flex-1 rounded-2xl px-3 py-4 text-center border border-white/[0.07]"
      style={{
        background: "linear-gradient(145deg,#2e2e2e,#252525)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${emphasized ? "text-orange-400" : "text-zinc-400"}`} aria-hidden="true" />
      <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-zinc-500 mb-2">{label}</div>
      <div className="flex items-baseline justify-center gap-[3px]">
        <span className="text-[24px] font-extrabold leading-none text-white tabular-nums">{value}</span>
        {unit && <span className="text-xs font-medium text-zinc-500">{unit}</span>}
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
  const typeLabel = parsed.type.replace(/\b\w/g, (c) => c.toUpperCase());

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
        className="relative rounded-3xl p-7 text-white border border-white/[0.08]"
        style={{
          background: "linear-gradient(160deg, #2b2b2b 0%, #1e1e1e 100%)",
          animation: cardVisible ? "wpc-pulseGlow 3s ease-in-out infinite" : "none",
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
          transition: "opacity 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1)",
          overflow: "visible",
        }}
      >
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
            className="flex items-center justify-center rounded-2xl border border-white/[0.08] flex-shrink-0"
            style={{
              width: 88, height: 88,
              background: "linear-gradient(135deg,#2a2a2a,#1a1a1a)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 600ms ease 200ms, transform 600ms ease 200ms",
            }}
          >
            <TypeIcon className="h-12 w-12 text-orange-400" aria-hidden="true" />
          </div>

          <div
            className="flex-1 px-4 min-w-0"
            style={{
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 600ms ease 300ms, transform 600ms ease 300ms",
            }}
          >
            <div className="text-[26px] font-black leading-tight tracking-[0.5px] text-white truncate">
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
            className="relative z-[1] rounded-2xl border border-orange-500/20 px-4 py-4 text-center"
            style={{
              background: "linear-gradient(145deg,#2e2e2e,#252525)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,80,0,0.08)",
              animation: cardVisible ? "wpc-paceSlide 600ms ease 1000ms both" : "none",
            }}
          >
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
