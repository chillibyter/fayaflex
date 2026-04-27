import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Burst {
  id: number;
  particles: { dx: number; dy: number; size: number; delay: number }[];
}

const KEYFRAMES = `
@keyframes hfb-fly {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
  60%  { opacity: 1; transform:
           translate(calc(-50% + (var(--dx) * 0.7)),
                     calc(-50% + (var(--dy) * 0.7))) scale(1); }
  100% { opacity: 0; transform:
           translate(calc(-50% + var(--dx)),
                     calc(-50% + var(--dy))) scale(0.45); }
}
@keyframes hfb-pop {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.35); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .hfb-particle, .hfb-icon { animation: none !important; }
}
`;

function buildBurst(): Burst["particles"] {
  const out: Burst["particles"] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 1.6 - Math.PI * 0.8;
    const dist = 22 + Math.random() * 14;
    out.push({
      dx: Math.cos(angle) * dist + (Math.random() - 0.5) * 6,
      dy: Math.sin(angle) * dist - 6 - Math.random() * 8,
      size: 10 + Math.random() * 6,
      delay: i * 18,
    });
  }
  return out;
}

export function HighFiveButton({
  liked,
  count,
  onClick,
  disabled,
  testId,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [pop, setPop] = useState(0);

  useEffect(() => {
    if (bursts.length === 0) return;
    const t = setTimeout(() => {
      setBursts((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(t);
  }, [bursts]);

  const handleClick = () => {
    // Only celebrate when transitioning from un-liked → liked.
    if (!liked) {
      setBursts((prev) => [...prev, { id: Date.now() + Math.random(), particles: buildBurst() }]);
      setPop((n) => n + 1);
    }
    onClick();
  };

  return (
    <div className="relative inline-flex items-center">
      <style>{KEYFRAMES}</style>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        data-testid={testId}
        className="flex items-center gap-1.5 px-2"
        aria-label={liked ? "Remove high-five" : "Send a high-five"}
        aria-pressed={liked}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Flame
            key={pop}
            className={`hfb-icon h-5 w-5 transition-colors ${
              liked ? "fill-orange-500 text-orange-500" : "text-muted-foreground"
            }`}
            style={{
              filter: liked
                ? "drop-shadow(0 0 6px rgba(255,106,0,0.55))"
                : undefined,
              animation: pop > 0 ? "hfb-pop 380ms ease-out" : undefined,
            }}
            aria-hidden="true"
          />
          {/* Floating-flame burst layer (positioned around the icon) */}
          {bursts.map((b) => (
            <span
              key={b.id}
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              {b.particles.map((p, i) => (
                <Flame
                  key={i}
                  className="hfb-particle absolute top-1/2 left-1/2 fill-orange-500 text-orange-500"
                  style={{
                    width: p.size,
                    height: p.size,
                    ["--dx" as any]: `${p.dx}px`,
                    ["--dy" as any]: `${p.dy}px`,
                    animation: `hfb-fly 1100ms ease-out ${p.delay}ms forwards`,
                    filter: "drop-shadow(0 0 4px rgba(255,140,0,0.65))",
                  }}
                />
              ))}
            </span>
          ))}
        </span>
        <span
          className={`text-sm tabular-nums ${liked ? "font-semibold text-orange-500" : "text-muted-foreground"}`}
          data-testid={testId ? `${testId}-count` : undefined}
        >
          {count}
        </span>
      </Button>
    </div>
  );
}
