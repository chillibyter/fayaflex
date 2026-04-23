import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain, Activity } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** NeonHUD — cyberpunk gauge HUD.
 *  Grid background, scanline sweep, neon-edged corners, animated SVG ring,
 *  monospace data readouts. The flame sits in a hexagonal HUD reticle. */
function CornerBracket({
  pos,
  color,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const map: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    tr: { top: 8, right: 8, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    bl: { bottom: 8, left: 8, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    br: { bottom: 8, right: 8, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
  };
  return (
    <span
      className="pointer-events-none absolute"
      style={{ width: 12, height: 12, ...map[pos], boxShadow: `0 0 8px ${color}` }}
    />
  );
}

function HexGauge({ intensity, leader }: { intensity: number; leader: boolean }) {
  const accent = leader ? "#ffce4d" : "#7df0ff";
  const size = 150;
  const stroke = 3;
  const cx = size / 2;
  const cy = size / 2;
  // Hexagon path
  const hex = (r: number) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return `M${pts.join(" L")} Z`;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="hex-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Inner scaffold rings */}
        <path d={hex(58)} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={1} />
        <path d={hex(48)} fill="none" stroke={accent} strokeOpacity={0.1} strokeWidth={1} />
        {/* Outer hex */}
        <path
          d={hex(68)}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeOpacity={0.85}
          filter="url(#hex-glow)"
          style={{ transition: "stroke .3s" }}
        />
        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
          const r1 = 70;
          const r2 = i % 6 === 0 ? 78 : 74;
          const x1 = cx + r1 * Math.cos(a);
          const y1 = cy + r1 * Math.sin(a);
          const x2 = cx + r2 * Math.cos(a);
          const y2 = cy + r2 * Math.sin(a);
          const active = i / 24 < intensity;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? accent : "rgba(255,255,255,0.15)"}
              strokeWidth={i % 6 === 0 ? 2 : 1}
              style={active ? { filter: `drop-shadow(0 0 4px ${accent})` } : undefined}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <AnimatedFlame size={56 + intensity * 24} intensity={intensity} showSparks={false} />
      </div>
    </div>
  );
}

function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);
  const isLeader = !!isCalorieLeader;
  const accent = isLeader ? "#ffce4d" : "#7df0ff";

  const tele = [
    { icon: Clock, label: "T_DUR", value: workout.duration ?? "—" },
    { icon: MapPin, label: "D_KM", value: workout.distance ?? "—" },
    { icon: Heart, label: "BPM", value: workout.avgHr ?? "—" },
    { icon: Footprints, label: "STP", value: workout.steps ?? "—" },
    { icon: Mountain, label: "ELEV", value: workout.elevation ?? "—" },
    { icon: Gauge, label: "PACE", value: workout.speed ?? "—" },
  ];

  return (
    <div
      className="relative rounded-xl overflow-hidden ff-grid-bg font-mono"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,15,22,0.95) 0%, rgba(6,8,12,0.98) 100%)",
        border: `1px solid ${isLeader ? "rgba(255,206,77,0.45)" : "rgba(125,240,255,0.2)"}`,
        boxShadow: isLeader
          ? "0 0 40px rgba(255,206,77,0.25), 0 20px 60px -20px rgba(0,0,0,0.6)"
          : "0 0 24px rgba(125,240,255,0.12), 0 20px 60px -20px rgba(0,0,0,0.6)",
      }}
    >
      <CornerBracket pos="tl" color={accent} />
      <CornerBracket pos="tr" color={accent} />
      <CornerBracket pos="bl" color={accent} />
      <CornerBracket pos="br" color={accent} />

      {/* Scanline */}
      <div className="ff-scanline-overlay" />

      {/* Header bar */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3" style={{ color: accent, filter: `drop-shadow(0 0 4px ${accent})` }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-bold"
            style={{ color: accent, textShadow: `0 0 6px ${accent}` }}
          >
            SYS · {workout.type.toUpperCase()}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.25em] text-white/40">
          {isLeader ? "STATUS · APEX" : `LOAD · ${Math.round(intensity * 100)}%`}
        </span>
      </div>

      {/* Hex gauge + readout */}
      <div className="relative grid grid-cols-[auto_1fr] gap-4 px-5 py-4 items-center">
        <HexGauge intensity={intensity} leader={isLeader} />
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">
            ENERGY · KCAL
          </div>
          <div
            className="text-5xl font-black tabular-nums leading-none mt-1"
            style={{
              color: accent,
              textShadow: `0 0 ${10 + intensity * 22}px ${accent}, 0 0 4px ${accent}`,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {workout.caloriesNum?.toLocaleString() ?? "0"}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/45">
            <span className="px-1.5 py-0.5 rounded-sm" style={{ background: "rgba(125,240,255,0.08)", border: `1px solid ${accent}40`, color: accent }}>FLAME</span>
            <span className="tabular-nums" style={{ color: accent }}>{Math.round(intensity * 100)}%</span>
            <span className="ml-2 px-1.5 py-0.5 rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>MAX</span>
            <span className="tabular-nums text-white/70">{topCaloriesOfDay.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Telemetry grid */}
      <div className="relative grid grid-cols-3 mx-3 mb-3 rounded-md overflow-hidden" style={{ border: "1px solid rgba(125,240,255,0.12)" }}>
        {tele.map((t, i) => (
          <div
            key={t.label}
            className={`px-2.5 py-2.5 ${i % 3 !== 2 ? "border-r border-cyan-200/10" : ""} ${i >= 3 ? "border-t border-cyan-200/10" : ""}`}
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em]" style={{ color: `${accent}b0` }}>
              <t.icon className="h-3 w-3" /> {t.label}
            </div>
            <div className="text-sm font-bold tabular-nums text-white/95 mt-0.5">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NeonHUD() {
  return (
    <div className="min-h-screen p-6 font-sans" style={{ background: "#050709" }}>
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: "#7df0ff" }}>
          Neon HUD — combat-cockpit telemetry
        </div>
        {SAMPLE_FEED.map((s, i) => (
          <Card
            key={i}
            workout={s.workout}
            personalBests={s.pb}
            topCaloriesOfDay={TOP_CAL_OF_DAY}
            isCalorieLeader={s.isLeader}
          />
        ))}
      </div>
    </div>
  );
}
