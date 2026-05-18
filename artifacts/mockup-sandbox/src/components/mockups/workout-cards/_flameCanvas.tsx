import { useEffect, useRef } from "react";

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  type: "flame" | "core" | "spark";
  gravity?: number; r?: number; g?: number; b?: number;
  twinkle?: number;
};

export interface FlameCanvasProps {
  intensity: number;
  width?: number;
  height?: number;
  anchorX?: number;
  anchorY?: number;
}

export function FlameCanvas({
  intensity,
  width = 220,
  height = 240,
  anchorX = 0.5,
  anchorY = 0.92,
}: FlameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ particles: Particle[]; animId: number | null; running: boolean; intensity: number }>(
    { particles: [], animId: null, running: true, intensity }
  );

  useEffect(() => { stateRef.current.intensity = intensity; }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
    const W = width, H = height;
    const cx = W * anchorX, cy = H * anchorY;
    const s = stateRef.current;

    const scale = () => 0.5 + s.intensity * 1.4;
    const flameCount = () => Math.max(2, Math.round(3 + s.intensity * 8));
    const coreCount = () => Math.max(1, Math.round(1 + s.intensity * 3));
    const sparkCount = () => Math.max(1, Math.round(1 + s.intensity * 7));
    const upthrust = () => 1.0 + s.intensity * 1.6;

    const makeFlame = (): Particle => {
      const sc = scale();
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.32;
      const speed = (1.2 + Math.random() * 1.1) * upthrust();
      return {
        x: cx + (Math.random() - 0.5) * 14 * sc,
        y: cy + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, decay: 0.016 + Math.random() * 0.010,
        size: (8 + Math.random() * 9) * sc,
        type: "flame",
      };
    };
    const makeCore = (): Particle => {
      const sc = scale();
      return {
        x: cx + (Math.random() - 0.5) * 10 * sc, y: cy + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.4, vy: (-0.5 - Math.random() * 0.9) * upthrust(),
        life: 1, decay: 0.05 + Math.random() * 0.03,
        size: (5 + Math.random() * 5) * sc, type: "core",
      };
    };
    const makeSpark = (intense: boolean): Particle => {
      const sc = scale();
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = (intense ? 2.4 + Math.random() * 4 : 0.8 + Math.random() * 2) * upthrust();
      return {
        x: cx + (Math.random() - 0.5) * 10 * sc,
        y: cy - 6 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 1, decay: intense ? 0.012 + Math.random() * 0.014 : 0.02 + Math.random() * 0.02,
        size: (intense ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.0) * Math.max(0.7, sc * 0.8),
        gravity: 0.05 + Math.random() * 0.05, type: "spark",
        r: 255, g: Math.floor(180 + Math.random() * 70), b: Math.floor(Math.random() * 50),
        twinkle: Math.random() * Math.PI * 2,
      };
    };

    const drawFlame = (p: Particle) => {
      const a = p.life; const rad = p.size;
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 1.7);
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
      const r = 60 + s.intensity * 80;
      const grd = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, r);
      grd.addColorStop(0,    `rgba(255,140,30,${0.18 + s.intensity * 0.18})`);
      grd.addColorStop(0.45, `rgba(255,80,0,${0.06 + s.intensity * 0.12})`);
      grd.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy - 20, r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
    };

    let frame = 0;
    const loop = () => {
      if (!s.running) { s.animId = requestAnimationFrame(loop); return; }
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < flameCount(); i++) s.particles.push(makeFlame());
      if (frame % 2 === 0) for (let i = 0; i < coreCount(); i++) s.particles.push(makeCore());
      for (let i = 0; i < sparkCount(); i++) s.particles.push(makeSpark(Math.random() < 0.35));
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
      observer?.disconnect(); s.particles = [];
    };
  }, [width, height, anchorX, anchorY]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width, height, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}

export function calorieIntensity(calories: number): number {
  const min = 100, max = 1500;
  const c = Math.max(min, Math.min(max, calories));
  return (c - min) / (max - min);
}
