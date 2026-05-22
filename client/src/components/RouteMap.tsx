import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Share2, X } from "lucide-react";
import { decodePolyline, fuzzEndpoints, type LatLng, type RoutePrivacy } from "@shared/polyline";

interface RouteMapProps {
  polyline: string;
  privacy?: RoutePrivacy;
  /** Accent hex for the route stroke. */
  accent: string;
  /** Optional distance for the fullscreen header (e.g. "5.30 KM"). */
  distance?: string;
  /** Optional workout title for the fullscreen header (e.g. "Outdoor Run"). */
  title?: string;
  className?: string;
}

type Style = "streets" | "satellite";

const TILES: Record<Style, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap, © CARTO",
    maxZoom: 19,
  },
  satellite: {
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
    maxZoom: 19,
  },
};

function renderRoute(
  map: L.Map,
  points: LatLng[],
  accent: string,
  fitOnFirstRender: boolean,
) {
  const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

  // Soft outer halo for legibility on both light & satellite tiles.
  const halo = L.polyline(latlngs, {
    color: "#000000",
    opacity: 0.35,
    weight: 8,
    lineCap: "round",
    lineJoin: "round",
    interactive: false,
  }).addTo(map);

  const line = L.polyline(latlngs, {
    color: accent,
    weight: 4,
    opacity: 1,
    lineCap: "round",
    lineJoin: "round",
    interactive: false,
  }).addTo(map);

  const startIcon = L.divIcon({
    className: "wpc-route-pin",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#22c55e;border:2px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.35),0 2px 4px rgba(0,0,0,0.4)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const endIcon = L.divIcon({
    className: "wpc-route-pin",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#ef4444;border:2px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.35),0 2px 4px rgba(0,0,0,0.4)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const startMarker = L.marker(latlngs[0], { icon: startIcon, interactive: false }).addTo(map);
  const endMarker = L.marker(latlngs[latlngs.length - 1], { icon: endIcon, interactive: false }).addTo(map);

  if (fitOnFirstRender) {
    map.fitBounds(line.getBounds(), { padding: [24, 24] });
  }

  return () => {
    halo.remove();
    line.remove();
    startMarker.remove();
    endMarker.remove();
  };
}

// Shared map renderer — used by both the inline preview and the fullscreen
// modal. `interactive=false` locks panning/zoom for the preview thumbnail.
function LeafletMap({
  points,
  accent,
  style,
  interactive,
  heightClass,
  showAttribution = true,
}: {
  points: LatLng[];
  accent: string;
  style: Style;
  interactive: boolean;
  heightClass: string;
  showAttribution?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const cleanupRouteRef = useRef<(() => void) | null>(null);
  const lastStyleRef = useRef<Style>(style);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: showAttribution,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      tap: interactive,
    });
    mapRef.current = map;
    tileRef.current = L.tileLayer(TILES[style].url, {
      attribution: TILES[style].attribution,
      maxZoom: TILES[style].maxZoom,
      detectRetina: true,
    }).addTo(map);
    lastStyleRef.current = style;
    cleanupRouteRef.current = renderRoute(map, points, accent, true);

    // Invalidate after mount so the size is correct (especially inside flex).
    const t = setTimeout(() => map.invalidateSize(), 50);

    return () => {
      clearTimeout(t);
      cleanupRouteRef.current?.();
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer only when style actually changes (avoid the redundant
  // remove/add that would otherwise fire on mount).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lastStyleRef.current === style) return;
    if (tileRef.current) tileRef.current.remove();
    tileRef.current = L.tileLayer(TILES[style].url, {
      attribution: TILES[style].attribution,
      maxZoom: TILES[style].maxZoom,
      detectRetina: true,
    }).addTo(map);
    lastStyleRef.current = style;
  }, [style]);

  // Re-render route when accent / points change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    cleanupRouteRef.current?.();
    cleanupRouteRef.current = renderRoute(map, points, accent, false);
  }, [accent, points]);

  return <div ref={containerRef} className={`w-full ${heightClass}`} data-testid="route-leaflet" />;
}

export function RouteMap({
  polyline,
  privacy = "fuzzed",
  accent,
  distance,
  title,
  className,
}: RouteMapProps) {
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

  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<Style>("streets");

  // Lock body scroll while the fullscreen map is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lazy-mount the inline map: don't spin up a full Leaflet instance + tile
  // requests for every WorkoutPostCard in the feed. Wait until the preview is
  // close to (or inside) the viewport. Cards far down the feed render a
  // lightweight placeholder until the user scrolls near them.
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const el = previewRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  if (privacy === "hidden" || points.length < 2) return null;

  const headerTitle = [distance, title].filter(Boolean).join(" ").trim() || "Workout route";

  // Inline preview uses a div with role="button" rather than a real <button>
  // because Leaflet's tile container hosts interactive descendants (attribution
  // links etc.), which would be invalid nested inside a <button>.
  const handlePreviewKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <div
        ref={previewRef}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handlePreviewKey}
        className={`relative block w-full overflow-hidden rounded-lg border bg-white/60 dark:bg-white/5 hover-elevate active-elevate-2 cursor-pointer ${className || ""}`}
        style={{ borderColor: "var(--wpc-border)" }}
        data-testid="workout-route-map"
        aria-label={`Open full route map. ${headerTitle}`}
      >
        {visible ? (
          <LeafletMap
            points={points}
            accent={accent}
            style="streets"
            interactive={false}
            heightClass="h-32"
            showAttribution={false}
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-muted/40 to-muted/10" aria-hidden />
        )}
        {privacy === "fuzzed" && (
          <span
            className="absolute bottom-1 right-1.5 text-[9px] font-medium uppercase tracking-wider text-foreground bg-background/80 backdrop-blur-sm rounded px-1 z-[400]"
            data-testid="badge-route-privacy"
          >
            Privacy on
          </span>
        )}
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={headerTitle}
            data-testid="route-fullscreen"
          >
            <div className="absolute inset-0">
              <LeafletMap
                points={points}
                accent={accent}
                style={style}
                interactive={true}
                heightClass="h-full"
              />
            </div>

            {/* Top header — close · title · share */}
            <div className="absolute top-0 left-0 right-0 z-[1100] flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-gradient-to-b from-black/70 to-transparent text-white">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center hover-elevate active-elevate-2"
                aria-label="Close map"
                data-testid="button-route-close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1 text-center text-[15px] font-semibold tracking-tight truncate">
                {headerTitle}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: headerTitle, text: `Check out my route: ${headerTitle}` });
                    }
                  } catch {
                    /* user cancelled */
                  }
                }}
                className="h-9 w-9 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center hover-elevate active-elevate-2"
                aria-label="Share route"
                data-testid="button-route-share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Map style toggle (right side) */}
            <button
              type="button"
              onClick={() => setStyle((s) => (s === "streets" ? "satellite" : "streets"))}
              className="absolute right-4 top-[calc(max(env(safe-area-inset-top),12px)+56px)] z-[1100] h-10 w-10 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center hover-elevate active-elevate-2"
              aria-label={style === "streets" ? "Switch to satellite view" : "Switch to streets view"}
              data-testid="button-route-style"
            >
              <Layers className="h-5 w-5" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
