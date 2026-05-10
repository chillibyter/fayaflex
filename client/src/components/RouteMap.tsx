import { useMemo } from "react";
import { decodePolyline, fuzzEndpoints, type LatLng, type RoutePrivacy } from "@shared/polyline";

interface RouteMapProps {
  polyline: string;
  privacy?: RoutePrivacy;
  accent: string;
  className?: string;
}

const VIEW_W = 320;
const VIEW_H = 120;
const PAD = 8;

export function RouteMap({ polyline, privacy = "fuzzed", accent, className }: RouteMapProps) {
  const points = useMemo<LatLng[]>(() => {
    if (privacy === "hidden") return [];
    try {
      const raw = decodePolyline(polyline);
      if (raw.length < 2) return [];
      return privacy === "fuzzed" ? fuzzEndpoints(raw, 200) : raw;
    } catch {
      return [];
    }
  }, [polyline, privacy]);

  if (privacy === "hidden" || points.length < 2) return null;

  // Project to SVG viewbox. Web Mercator is overkill for ~hour-long routes —
  // a flat equirectangular projection looks identical at this scale.
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = Math.max(maxLat - minLat, 1e-6);
  const dLng = Math.max(maxLng - minLng, 1e-6);
  // Preserve aspect ratio: the route shouldn't get squashed if it's mostly N-S.
  const meanLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lngM = dLng * Math.cos(meanLatRad);
  const aspect = lngM / dLat; // wider than tall when > 1
  const innerW = VIEW_W - PAD * 2;
  const innerH = VIEW_H - PAD * 2;
  const boxAspect = innerW / innerH;
  let scaleX: number;
  let scaleY: number;
  if (aspect > boxAspect) {
    // Route is wider than the box → fit to width
    scaleX = innerW / lngM;
    scaleY = scaleX;
  } else {
    scaleY = innerH / dLat;
    scaleX = scaleY;
  }
  const usedW = lngM * scaleX;
  const usedH = dLat * scaleY;
  const offsetX = PAD + (innerW - usedW) / 2;
  const offsetY = PAD + (innerH - usedH) / 2;

  const path = points
    .map((p, i) => {
      const x = offsetX + (p.lng - minLng) * Math.cos(meanLatRad) * scaleX;
      // SVG y grows downward — flip lat
      const y = offsetY + (maxLat - p.lat) * scaleY;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border bg-white/60 dark:bg-white/5 ${className || ""}`}
      style={{ borderColor: "var(--wpc-border)" }}
      data-testid="workout-route-map"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-24"
        preserveAspectRatio="none"
        aria-label="Workout route preview"
      >
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      </svg>
      {privacy === "fuzzed" && (
        <span
          className="absolute bottom-1 right-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground bg-background/70 backdrop-blur-sm rounded px-1"
          data-testid="badge-route-privacy"
        >
          Privacy on
        </span>
      )}
    </div>
  );
}
