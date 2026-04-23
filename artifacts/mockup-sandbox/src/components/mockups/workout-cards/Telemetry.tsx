import "./_group.css";
import { Clock, MapPin, Heart, Footprints, Gauge, Mountain } from "lucide-react";
import { SAMPLE_FEED, TOP_CAL_OF_DAY, AnimatedFlame, clampIntensity, type WorkoutCardProps } from "./shared";

/** Telemetry — data-dense, gauge-led layout.
 *  Calories sit inside an SVG ring whose fill = workout / day-max.
 *  The flame inside the ring brightens with intensity. */
function Ring({ intensity, size = 140, children }: { intensity: number; size?: number; children: React.ReactNode }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * intensity;
  const ringColor = `hsl(${30 - intensity * 10}, 95%, ${55 + intensity * 8}%)`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{
            filter: `drop-shadow(0 0 ${4 + intensity * 14}px ${ringColor})`,
            transition: "stroke-dasharray .6s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Card({ workout, topCaloriesOfDay, isCalorieLeader }: WorkoutCardProps) {
  const intensity = clampIntensity(workout.caloriesNum || 0, topCaloriesOfDay, isCalorieLeader);

  const tele = [
    { icon: Clock, label: "Duration", value: workout.duration ?? "—" },
    { icon: MapPin, label: "Distance", value: workout.distance ?? "—" },
    { icon: Heart, label: "Avg HR", value: workout.avgHr ?? "—" },
    { icon: Footprints, label: "Steps", value: workout.steps ?? "—" },
    { icon: Mountain, label: "Elev", value: workout.elevation ?? "—" },
    { icon: Gauge, label: "Pace", value: workout.speed ?? "—" },
  ];

  return (
    <div
      className="relative rounded-xl border overflow-hidden font-mono"
      style={{
        background: "linear-gradient(180deg, #0e1116 0%, #090b0f 100%)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isCalorieLeader ? "bg-amber-400" : "bg-emerald-500"}`} style={{ boxShadow: `0 0 8px currentColor` }} />
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-bold">
            {workout.type.toUpperCase()} · LOG
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          {isCalorieLeader ? "TOP / DAY" : `${Math.round(intensity * 100)}%`}
        </span>
      </div>

      {/* Ring + readout */}
      <div className="grid grid-cols-[auto_1fr] gap-5 p-5 items-center">
        <Ring intensity={intensity}>
          <div className="flex flex-col items-center">
            <AnimatedFlame size={42 + intensity * 18} intensity={intensity} showSparks={false} />
          </div>
        </Ring>

        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">CALORIES</div>
          <div
            className="text-5xl font-extrabold tabular-nums leading-none mt-1"
            style={{
              color: `hsl(${30 - intensity * 8}, 100%, ${75 + intensity * 8}%)`,
              textShadow: `0 0 ${6 + intensity * 18}px hsl(${30 - intensity * 8}, 100%, 60% / ${0.4 + intensity * 0.4})`,
            }}
          >
            {workout.caloriesNum?.toLocaleString() ?? "0"}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">
            of {topCaloriesOfDay.toLocaleString()} top burn today
          </div>
          <div className="mt-3 h-px bg-white/10" />
          <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50">
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/70">INT</span>
            <span className="tabular-nums text-white/80">{intensity.toFixed(2)}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/70 ml-2">FLAME</span>
            <span className="tabular-nums text-amber-300">{Math.round(intensity * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Telemetry grid */}
      <div className="grid grid-cols-3 border-t border-white/5">
        {tele.map((t, i) => (
          <div
            key={t.label}
            className={`px-3 py-2.5 ${i % 3 !== 2 ? "border-r border-white/5" : ""} ${i < 3 ? "" : "border-t border-white/5"}`}
          >
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/40">
              <t.icon className="h-3 w-3" /> {t.label}
            </div>
            <div className="text-sm font-bold tabular-nums text-white/90 mt-0.5">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Telemetry() {
  return (
    <div className="min-h-screen p-6 font-sans" style={{ background: "#070809" }}>
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold">
          Telemetry — gauge-led data console
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
