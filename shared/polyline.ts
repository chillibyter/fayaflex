// Google encoded polyline algorithm v1 — used to compress GPS routes from
// HealthKit (HKWorkoutRoute) into a single string we can ship to the feed.
// See: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

export type LatLng = { lat: number; lng: number };

export function encodePolyline(points: LatLng[]): string {
  let out = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    out += encodeSigned(lat - prevLat) + encodeSigned(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return out;
}

function encodeSigned(num: number): string {
  let sgn_num = num << 1;
  if (num < 0) sgn_num = ~sgn_num;
  let out = "";
  while (sgn_num >= 0x20) {
    out += String.fromCharCode((0x20 | (sgn_num & 0x1f)) + 63);
    sgn_num >>= 5;
  }
  out += String.fromCharCode(sgn_num + 63);
  return out;
}

export function decodePolyline(str: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < str.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Approx meters-per-degree (good enough for visual privacy fuzzing).
const M_PER_DEG_LAT = 111_320;

// Trim the start and end of a polyline by `meters` of cumulative straight-line
// distance. Used to hide home/start addresses on shared workout cards. We
// don't pad with random offsets — Strava-style trimming is cleaner visually
// and harder to "undo" than a random jitter.
//
// If the route is too short to safely trim both ends and still have a
// drawable middle (≥2 points), returns an empty array. Callers MUST treat
// an empty result as "don't show a route" — falling back to the original
// polyline would defeat the entire point of fuzzing.
export function fuzzEndpoints(points: LatLng[], meters: number = 200): LatLng[] {
  if (meters <= 0) return points;
  if (points.length < 4) return [];
  const trimmedStart = trimFromStart(points, meters);
  if (trimmedStart.length < 2) return [];
  const trimmedEnd = trimFromStart(trimmedStart.slice().reverse(), meters);
  if (trimmedEnd.length < 2) return [];
  return trimmedEnd.reverse();
}

function trimFromStart(points: LatLng[], meters: number): LatLng[] {
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i]);
    acc += d;
    if (acc >= meters) {
      return points.slice(i);
    }
  }
  // Couldn't trim `meters` of route — caller will see length < 2 and bail.
  return [];
}

// Apply a privacy policy to a raw GPS polyline at write time. This is the
// authoritative server-side function: the trimmed/empty result is what gets
// stored, so the raw route never leaves the server once fuzzing is applied.
// Returns null for "hidden" (don't store anything) or for fuzzed routes that
// are too short to safely trim — the feed card just won't show a map.
export function applyRoutePrivacy(
  encodedPolyline: string,
  privacy: RoutePrivacy,
): string | null {
  if (privacy === "hidden") return null;
  if (privacy === "exact") return encodedPolyline || null;
  // fuzzed
  let points: LatLng[];
  try {
    points = decodePolyline(encodedPolyline);
  } catch {
    return null;
  }
  const trimmed = fuzzEndpoints(points, 200);
  if (trimmed.length < 2) return null;
  return encodePolyline(trimmed);
}

function haversine(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const meanLatRad = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180) * Math.cos(meanLatRad);
  const dxLat = dLat * (M_PER_DEG_LAT / (Math.PI / 180));
  const dxLng = dLng * (M_PER_DEG_LAT / (Math.PI / 180));
  return Math.sqrt(dxLat * dxLat + dxLng * dxLng);
}

export type RoutePrivacy = "exact" | "fuzzed" | "hidden";

export const ROUTE_PRIVACY_VALUES = ["exact", "fuzzed", "hidden"] as const;
