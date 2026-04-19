import { db } from "./db";
import { feedPosts, syncedWorkouts } from "@shared/schema";
import { and, gte, like, eq } from "drizzle-orm";

const MIN_DURATION_MIN = 15;
const MIN_CALORIES = 100;
const MIN_DISTANCE_M = 1000;
const MIN_STEPS = 1500;

interface ParsedMetrics {
  durationMinutes: number | null;
  distanceMeters: number | null;
  calories: number | null;
  steps: number | null;
}

function parseMetricsLine(line: string): ParsedMetrics {
  const out: ParsedMetrics = { durationMinutes: null, distanceMeters: null, calories: null, steps: null };
  if (!line) return out;

  const hMatch = line.match(/(\d+)h\s+(\d+)m/);
  const mMatch = line.match(/(\d+)\s*min(?!\w)/);
  if (hMatch) out.durationMinutes = parseInt(hMatch[1], 10) * 60 + parseInt(hMatch[2], 10);
  else if (mMatch) out.durationMinutes = parseInt(mMatch[1], 10);

  const kmMatch = line.match(/([\d.]+)\s*km/);
  if (kmMatch) out.distanceMeters = Math.round(parseFloat(kmMatch[1]) * 1000);

  const calMatch = line.match(/(\d+)\s*cal/);
  if (calMatch) out.calories = parseInt(calMatch[1], 10);

  const stepsMatch = line.match(/([\d,]+)\s*steps/);
  if (stepsMatch) out.steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);

  return out;
}

function meetsThreshold(m: ParsedMetrics): boolean {
  return (
    (m.durationMinutes ?? 0) >= MIN_DURATION_MIN ||
    (m.calories ?? 0) >= MIN_CALORIES ||
    (m.distanceMeters ?? 0) >= MIN_DISTANCE_M ||
    (m.steps ?? 0) >= MIN_STEPS
  );
}

/**
 * Removes auto-generated workout feed posts from the last 7 days that don't
 * meet the new quality threshold. Idempotent — safe to run on every startup.
 */
export async function cleanupShortAutoPostedWorkouts(): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  try {
    const candidates = await db
      .select({ id: feedPosts.id, userId: feedPosts.userId, content: feedPosts.content })
      .from(feedPosts)
      .where(and(gte(feedPosts.createdAt, since), like(feedPosts.content, "Completed a %workout%")));

    if (candidates.length === 0) {
      console.log("[Cleanup] No recent auto-posted workouts to evaluate");
      return;
    }

    let deleted = 0;
    for (const post of candidates) {
      const lines = (post.content || "").split("\n");
      const metricsLine = lines[1] || "";
      const metrics = parseMetricsLine(metricsLine);
      if (meetsThreshold(metrics)) continue;

      await db.delete(syncedWorkouts).where(eq(syncedWorkouts.feedPostId, post.id));
      await db.delete(feedPosts).where(eq(feedPosts.id, post.id));
      deleted++;
    }
    console.log(`[Cleanup] Removed ${deleted} short auto-posted workouts (of ${candidates.length} candidates)`);
  } catch (err) {
    console.error("[Cleanup] cleanupShortAutoPostedWorkouts failed:", err);
  }
}
