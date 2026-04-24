import { useEffect, useRef, useState } from "react";
import { Flame, Clock, MapPin, Gauge, Footprints } from "lucide-react";
import { AnimatedFlame } from "./shared";

/* InfernoCard
 * ───────────
 * Wide dark card matching the user's reference video:
 *   shoe + Title + subtitle | three stat tiles | pace at bottom
 *   3D photoreal flame breathing out of the top-right corner
 *   radial sparks shooting outward
 * The flame size + spark count + halo strength all scale with calories.
 *
 * `caloriesNum` is the live, observable number — drive it with state and
 * everything visual reacts in real-time.
 */

interface SparkBurstProps {
  width: number;
  height: number;
  /** 0..1 — drives spark count, speed, lifetime, brightness. */
  intensity: number;
  /** Origin in pixel coords inside the canvas (the flame's hot heart). */
  cx: number;
  cy: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const MAX_SPARKS = 260;

function SparkBurst({ width, height, intensity, cx, cy }: SparkBurstProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // Live refs so the effect can read the LATEST values without restarting
  // (which would wipe the spark array every frame when intensity animates).
  const intensityRef = useRef(intensity);
  const cxRef = useRef(cx);
  const cyRef = useRef(cy);
  intensityRef.current = intensity;
  cxRef.current = cx;
  cyRef.current = cy;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const sparks: Spark[] = [];
    let raf = 0;

    const spawn = () => {
      const intensity = intensityRef.current;
      const cx = cxRef.current;
      const cy = cyRef.current;
      // Spawn rate scales hard with intensity. At intensity=1 we spawn ~14/frame.
      const target = Math.floor(3 + intensity * 11);
      for (let i = 0; i < target; i++) {
        if (sparks.length >= MAX_SPARKS) break;
        // Bias spawn angle UPWARD with WIDE sideways spread — real fire
        // throws embers in a fan including sideways/horizontally outward.
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
        const speed = 1.8 + Math.random() * 3.0 + intensity * 2.6;
        const maxLife = 55 + Math.random() * 90 + intensity * 60;
        sparks.push({
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife,
          // Bigger sparks → much more visible against bright flame backdrop.
          size: 1.4 + Math.random() * 2.2 + intensity * 1.8,
          // Yellow-white at birth, drifting toward orange over life.
          hue: 36 + Math.random() * 18,
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
          continue;
        }
        // Physics: gentle gravity pulling sparks downward, slight upward
        // buoyancy at start, drag to slow over time.
        s.vy += 0.045;          // gravity
        s.vy -= 0.012;          // residual buoyancy
        s.vx *= 0.985;
        s.vy *= 0.992;
        s.x += s.vx;
        s.y += s.vy;

        const t = s.life / s.maxLife;
        // Fade in fast, hold, fade out slow.
        const alpha =
          t < 0.1 ? t / 0.1 : 1 - Math.pow((t - 0.1) / 0.9, 1.4);
        // Color shifts white → yellow → orange → dim red as it cools.
        const lightness = 95 - t * 55;
        const hueDrift = s.hue + t * 12;
        const radius = s.size * (1 - t * 0.4);

        // Soft outer halo — gives the spark a glowy ember feel.
        const halo = ctx.createRadialGradient(
          s.x, s.y, 0,
          s.x, s.y, radius * 4,
        );
        halo.addColorStop(0, `hsla(${hueDrift}, 100%, ${lightness}%, ${alpha * 0.9})`);
        halo.addColorStop(0.4, `hsla(${hueDrift + 6}, 100%, ${lightness - 10}%, ${alpha * 0.45})`);
        halo.addColorStop(1, `hsla(${hueDrift + 12}, 100%, ${Math.max(30, lightness - 30)}%, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright body.
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hueDrift}, 100%, ${lightness}%, ${alpha})`;
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // White-hot core dot for the youngest sparks → makes them really pop.
        if (t < 0.4) {
          ctx.beginPath();
          ctx.fillStyle = `hsla(60, 100%, 100%, ${alpha})`;
          ctx.arc(s.x, s.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      spawn();
      if (!prefersReduced) raf = requestAnimationFrame(tick);
    };

    if (prefersReduced) {
      // Single static frame: spawn one round of sparks at fixed positions.
      for (let i = 0; i < 30; i++) spawn();
      tick();
    } else {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
    // Intensity / cx / cy are read via refs so the effect stays mounted
    // for the lifetime of the component — important, since the demo
    // animates intensity continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}

interface InfernoCardProps {
  /** Title of the workout, e.g. "Running". */
  title?: string;
  /** Subtitle, e.g. "WORKOUT COMPLETED". */
  subtitle?: string;
  caloriesNum: number;
  /** Top calories used to scale the flame. */
  topCalories?: number;
  duration?: string;
  distance?: string;
  pace?: string;
}

function StatTile({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
      data-testid={testId}
    >
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-white/55">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="text-white text-[22px] font-semibold leading-tight mt-1 tracking-tight">
        {value}
      </div>
    </div>
  );
}

export function InfernoCard({
  title = "Running",
  subtitle = "WORKOUT COMPLETED",
  caloriesNum,
  topCalories = 1500,
  duration = "1h 45m",
  distance = "12.5 km",
  pace = "7.1 km/h",
}: InfernoCardProps) {
  // 0..1 intensity — non-linear curve so small workouts still show *some*
  // flame and high workouts feel really hot.
  const raw = Math.max(0, Math.min(1, caloriesNum / topCalories));
  const intensity = Math.pow(raw, 0.85);

  // Flame visual size scales 110px → 240px with calories.
  const flameSize = Math.round(110 + intensity * 130);
  // Halo glow radius/strength — kept subtle so sparks read as distinct dots
  // against the dark backdrop instead of dissolving into a wash.
  const haloR = 70 + intensity * 70;
  const haloAlpha = 0.1 + intensity * 0.18;

  // Sparks canvas needs to be LARGE enough to contain sparks that fly far
  // from the flame origin. Origin is positioned over the flame's hot heart.
  const sparkW = 480;
  const sparkH = 460;
  const flameH = Math.round(flameSize * 1.15);

  return (
    <div
      className="relative rounded-[28px]"
      style={{
        background:
          "linear-gradient(165deg, #2a2426 0%, #1a1618 55%, #0f0d0e 100%)",
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
      data-testid="card-inferno"
    >
      {/* Inner clip layer — clips background gradient & content to rounded
          corners, but the flame/sparks live OUTSIDE this layer so they can
          burst above the card top like in the reference. */}
      <div
        className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* Flame "hot zone" backdrop — large radial that warms the whole right
            side of the card, scaling with calories. */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "-30%",
            right: "-10%",
            width: `${haloR * 2.4}px`,
            height: `${haloR * 2.4}px`,
            background: `radial-gradient(circle, rgba(255,140,40,${haloAlpha}) 0%, rgba(255,80,30,${haloAlpha * 0.6}) 30%, rgba(180,30,10,${haloAlpha * 0.3}) 55%, transparent 75%)`,
            filter: "blur(6px)",
          }}
        />
      </div>

      {/* Sparks — bursting from the flame heart, allowed to fly above the
          card's top edge for that "real fire spitting embers" look.
          Origin (cx,cy) is computed to land RIGHT ON the flame's hot heart
          so embers visually emerge from the fire, not from empty space. */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -sparkH * 0.55,
          right: -40,
          width: sparkW,
          height: sparkH,
          zIndex: 4,
        }}
      >
        <SparkBurst
          width={sparkW}
          height={sparkH}
          intensity={intensity}
          // Flame center horizontally is at: card_right - 36 - flameSize/2.
          // Canvas left edge is at: card_right - sparkW + 40.
          // So cx (in canvas coords) = sparkW - 40 - 36 - flameSize/2.
          cx={sparkW - 76 - flameSize / 2}
          // Flame top is at: card_top + (-flameH * 0.65). Canvas top is at:
          // card_top + (-sparkH * 0.55). The flame's HOT HEART sits ~70%
          // down the flame body. So in canvas coords:
          //   cy = (-flameH * 0.65 + flameH * 0.7) - (-sparkH * 0.55)
          cy={sparkH * 0.55 + flameH * 0.05}
        />
      </div>

      {/* The flame itself — anchored top-right, overflowing UP above the
          card boundary. Higher z-index than content tiles so it reads on top. */}
      <div
        aria-hidden
        className="absolute"
        style={{
          top: -flameH * 0.65,
          right: 36,
          width: flameSize,
          height: flameH,
          zIndex: 5,
        }}
      >
        <AnimatedFlame
          size={flameSize}
          intensity={intensity}
          showSparks={false}
          showRing={intensity > 0.6}
          showEmbers={false}
        />
      </div>

      {/* Card content */}
      <div className="relative z-10 px-7 pt-6 pb-5">
        {/* Top row: shoe + title block */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #3a2825 0%, #1a1416 100%)",
              border: "1px solid rgba(255,140,80,0.18)",
              boxShadow: "0 8px 20px -8px rgba(255,90,40,0.45)",
            }}
            data-testid="img-shoe"
          >
            <Footprints
              className="w-7 h-7"
              style={{ color: "#ff8a4d" }}
            />
          </div>
          <div className="min-w-0">
            <div
              className="text-white text-[28px] font-bold leading-none tracking-tight"
              data-testid="text-title"
            >
              {title}
            </div>
            <div
              className="text-white/55 text-[11px] tracking-[0.2em] uppercase mt-1.5 font-medium"
              data-testid="text-subtitle"
            >
              {subtitle}
            </div>
          </div>
        </div>

        {/* Stat tiles row — the calories tile gets a glowing border that
            intensifies with calories so it visually links to the flame. */}
        <div className="mt-5 flex gap-3">
          <div
            className="flex-1 rounded-2xl px-4 py-3 relative"
            style={{
              background: `linear-gradient(180deg, rgba(255,120,40,${0.06 + intensity * 0.08}) 0%, rgba(255,255,255,0.03) 100%)`,
              border: `1px solid rgba(255,140,60,${0.25 + intensity * 0.4})`,
              boxShadow: `0 0 ${10 + intensity * 26}px rgba(255,120,40,${0.15 + intensity * 0.35}), inset 0 0 0 1px rgba(255,140,60,${0.05 + intensity * 0.1})`,
            }}
            data-testid="stat-calories"
          >
            <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-white/60">
              <Flame className="w-3 h-3" style={{ color: "#ff8a4d" }} />
              <span>Calories</span>
            </div>
            <div className="text-white text-[22px] font-semibold leading-tight mt-1 tracking-tight">
              <span data-testid="text-calories-value">{caloriesNum}</span>
              <span className="text-white/55 text-[14px] font-normal ml-1">
                cal
              </span>
            </div>
          </div>

          <StatTile
            icon={Clock}
            label="Time"
            value={duration}
            testId="stat-time"
          />
          <StatTile
            icon={MapPin}
            label="Distance"
            value={distance}
            testId="stat-distance"
          />
        </div>
      </div>

      {/* Bottom pace strip */}
      <div
        className="relative z-10 px-7 py-4 flex flex-col items-center justify-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Gauge className="w-4 h-4 text-white/55 mb-1" />
        <div
          className="text-white text-[20px] font-semibold tracking-tight leading-none"
          data-testid="text-pace-value"
        >
          {pace}
        </div>
        <div className="text-white/45 text-[10px] tracking-[0.25em] uppercase mt-1.5">
          Pace
        </div>
      </div>
    </div>
  );
}

/* ─── Demo wrapper ───────────────────────────────────────────────────────
 * Animates calories from 200 → 1450 → 200 in a loop so you can see the
 * flame and sparks growing/shrinking with the number. */
export default function Inferno() {
  const [cals, setCals] = useState(1250);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let raf = 0;
    let dir = 1;
    let v = 1250;
    const step = () => {
      v += dir * 4;
      if (v > 1450) {
        v = 1450;
        dir = -1;
      } else if (v < 250) {
        v = 250;
        dir = 1;
      }
      setCals(Math.round(v));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="min-h-screen w-full p-8 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, #1a1418 0%, #050306 70%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720 }}>
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-5 text-center">
          Inferno — flame & sparks scale with calories
        </div>
        <InfernoCard
          title="Running"
          subtitle="Workout Completed"
          caloriesNum={cals}
          topCalories={1500}
          duration="1h 45m"
          distance="12.5 km"
          pace="7.1 km/h"
        />
        <div className="text-center text-white/40 text-[11px] tracking-[0.2em] uppercase mt-4">
          live demo · {cals} cal
        </div>
      </div>
    </div>
  );
}
