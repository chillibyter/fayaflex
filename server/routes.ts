import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertActivitySchema, insertTeamSchema, locations, notificationPrefsSchema, DEFAULT_NOTIFICATION_PREFS, type Activity } from "@shared/schema";

function formatWorkoutFeedPost(activity: Activity): string {
  const wt = (activity.workoutType || "workout").replace(/_/g, " ");
  const title = wt.charAt(0).toUpperCase() + wt.slice(1);
  const lines: string[] = [`Completed a ${title} workout`];
  const stats: string[] = [];
  if (activity.durationMinutes && activity.durationMinutes > 0) {
    const h = Math.floor(activity.durationMinutes / 60);
    const m = activity.durationMinutes % 60;
    stats.push(h > 0 ? `${h}h ${m}m` : `${m} min`);
  }
  if (activity.distanceMeters && activity.distanceMeters > 0) {
    const km = activity.distanceMeters / 1000;
    stats.push(`${km.toFixed(km < 10 ? 2 : 1)} km`);
  }
  if (activity.calories && activity.calories > 0) {
    stats.push(`${activity.calories} cal`);
  }
  if (activity.avgHeartRate && activity.avgHeartRate > 0) {
    stats.push(`${activity.avgHeartRate} bpm avg`);
  }
  if (activity.elevationGainMeters && activity.elevationGainMeters > 0) {
    stats.push(`${activity.elevationGainMeters} m elevation`);
  }
  if (activity.steps && activity.steps > 0 && !activity.distanceMeters) {
    stats.push(`${activity.steps.toLocaleString()} steps`);
  }
  if (activity.distanceMeters && activity.durationMinutes && activity.durationMinutes > 0) {
    const speedKmh = (activity.distanceMeters / 1000) / (activity.durationMinutes / 60);
    if (speedKmh > 0 && isFinite(speedKmh)) {
      stats.push(`${speedKmh.toFixed(1)} km/h avg`);
    }
  }
  if (stats.length > 0) {
    lines.push(stats.join(" • "));
  }
  return lines.join("\n");
}
import { z } from "zod";
import {
  getVapidPublicKey,
  triggerTeamMessage,
  triggerReaction,
  triggerComment,
  triggerDirectMessage,
  triggerMonthlyWinner,
  triggerRankChange,
} from "./pushService";
import { startPushCron } from "./pushCron";
import { upload, compressAndSaveImage, compressAndSaveProfileImage, compressAndSaveFeedImage, cleanupOldEvidence } from "./imageUpload";
import express from "express";
import path from "path";
import OpenAI from "openai";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import {
  getRequestToken,
  buildAuthorizationUrl,
  getAccessToken,
  fetchDailies,
  fetchActivities,
  mergeGarminData,
} from "./garmin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to remove email from user object
  const sanitizeUserForDisplay = (user: any, currentUserId?: string) => {
    if (!user) return user;
    // Only show email to the user themselves
    if (currentUserId && user.id === currentUserId) {
      return user;
    }
    // Remove email for other users
    const { email, ...userWithoutEmail } = user;
    return userWithoutEmail;
  };

  // Auth middleware
  setupAuth(app);

  // Serve uploaded evidence images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Apple App Site Association — enables Universal Links so iOS opens the app
  // when a user taps a https://fayaflex.com/join/:code link (requires YOURTEAMID
  // to be replaced with the 10-character Apple Developer Team ID in App Store Connect)
  app.get('/.well-known/apple-app-site-association', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: 'YOURTEAMID.com.fayaflex.app',
            paths: ['/join/*'],
          },
        ],
      },
    });
  });

  // Note: /api/auth/user route is now handled in auth.ts

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body - allow firstName, lastName, avatarId, and profileImageUrl updates
      const updateUserSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        avatarId: z.string().optional(),
        profileImageUrl: z.string().optional(),
        continentId: z.string().nullable().optional(),
        countryId: z.string().nullable().optional(),
        regionId: z.string().nullable().optional(),
        townId: z.string().nullable().optional(),
        bmr: z.number().int().min(500).max(5000).nullable().optional(),
      });
      
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Check username availability (public endpoint — used during registration typing)
  app.get("/api/check-username", async (req, res) => {
    try {
      const username = (req.query.username as string || "").trim();
      if (!username || username.length < 3) {
        return res.json({ available: false, reason: "too_short" });
      }
      const existing = await storage.getUserByUsername(username);
      res.json({ available: !existing });
    } catch (error) {
      res.status(500).json({ available: false });
    }
  });

  // Delete user account
  app.delete("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Delete all user data
      await storage.deleteUser(userId);
      
      // Destroy the session
      req.logout((err: any) => {
        if (err) {
          console.error("Error logging out after account deletion:", err);
        }
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error("Error destroying session after account deletion:", sessionErr);
          }
          res.json({ message: "Account deleted successfully" });
        });
      });
    } catch (error: any) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: error.message || "Failed to delete account" });
    }
  });

  // Device connection routes
  app.get("/api/devices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get device connections for supported providers (native only)
      const providers = ['apple_health', 'android_health', 'huawei_health'];
      const connections = await Promise.all(
        providers.map(async (provider) => {
          const connection = await storage.getDeviceConnection(userId, provider);
          return connection || {
            userId,
            provider,
            isConnected: false,
            lastSyncAt: null,
          };
        })
      );
      
      res.json(connections);
    } catch (error) {
      console.error("Error fetching device connections:", error);
      res.status(500).json({ message: "Failed to fetch device connections" });
    }
  });

  app.post("/api/devices/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const toggleSchema = z.object({
        provider: z.enum(['apple_health', 'android_health', 'huawei_health']),
        isConnected: z.boolean(),
      });
      
      const validatedData = toggleSchema.parse(req.body);
      
      const connection = await storage.upsertDeviceConnection({
        userId,
        provider: validatedData.provider,
        isConnected: validatedData.isConnected,
        lastSyncAt: validatedData.isConnected ? new Date() : null,
      });
      
      res.json(connection);
    } catch (error: any) {
      console.error("Error toggling device connection:", error);
      res.status(400).json({ message: error.message || "Failed to toggle device connection" });
    }
  });

  app.post("/api/devices/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const syncSchema = z.object({
        provider: z.enum(['apple_health', 'android_health', 'huawei_health']),
        activities: z.array(z.object({
          date: z.string(), // YYYY-MM-DD format
          calories: z.number().int().min(0),
          steps: z.number().int().min(0),
          workouts: z.number().int().min(0).optional(), // Health sync sends workout count
          workoutType: z.string().optional(),
        })).max(100), // Limit to 100 activities per sync
      });
      
      const validatedData = syncSchema.parse(req.body);
      
      // Detailed logging of incoming health data
      console.log(`\n========== HEALTH SYNC DEBUG ==========`);
      console.log(`[Sync] User: ${userId} (${req.user.username})`);
      console.log(`[Sync] Provider: ${validatedData.provider}`);
      console.log(`[Sync] Activity count: ${validatedData.activities.length}`);
      console.log(`[Sync] Raw activities received:`);
      validatedData.activities.forEach((activity, index) => {
        console.log(`  [${index + 1}] Date: ${activity.date}`);
        console.log(`      Calories: ${activity.calories}`);
        console.log(`      Steps: ${activity.steps}`);
        console.log(`      Workouts: ${activity.workouts ?? 'undefined'}`);
        console.log(`      WorkoutType: ${activity.workoutType ?? 'undefined'}`);
      });
      
      // Calculate totals for summary
      const totalCalories = validatedData.activities.reduce((sum, a) => sum + a.calories, 0);
      const totalSteps = validatedData.activities.reduce((sum, a) => sum + a.steps, 0);
      const totalWorkouts = validatedData.activities.reduce((sum, a) => sum + (a.workouts ?? 0), 0);
      console.log(`[Sync] TOTALS: calories=${totalCalories}, steps=${totalSteps}, workouts=${totalWorkouts}`);
      console.log(`========================================\n`);
      
      // Server-side today string in UTC — drop any activity dated in the future
      // (happens when the user's device is ahead of UTC, e.g. NZ UTC+13 syncing
      // at midnight local time, which is still "yesterday" on the server).
      const serverTodayStr = new Date().toISOString().split('T')[0];

      // Transform activities: convert workouts count to workoutType if not already set
      const transformedActivities = validatedData.activities
        .filter(activity => {
          if (activity.date > serverTodayStr) {
            console.log(`[Sync] Dropping future-dated activity: ${activity.date} (server today = ${serverTodayStr})`);
            return false;
          }
          return true;
        })
        .map(activity => ({
          date: activity.date,
          calories: activity.calories,
          steps: activity.steps,
          workoutType: activity.workoutType || (activity.workouts && activity.workouts > 0 
            ? `Health Sync (${activity.workouts} workout${activity.workouts > 1 ? 's' : ''})` 
            : undefined),
        }));
      
      console.log(`[Sync] User ${userId} syncing ${transformedActivities.length} activities from ${validatedData.provider}`);
      
      // Sync activities from health device
      const results = await storage.syncHealthActivities(
        userId,
        validatedData.provider,
        transformedActivities
      );
      
      // Create or update device connection
      await storage.upsertDeviceConnection({
        userId,
        provider: validatedData.provider,
        isConnected: true,
        lastSyncAt: new Date(),
      });
      
      console.log(`[Sync] Results: created=${results.created}, updated=${results.updated}, skipped=${results.skipped}`);
      
      res.json({
        success: true,
        synced: results.created + results.updated,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
      });
    } catch (error: any) {
      console.error("Error syncing device:", error);
      res.status(400).json({ message: error.message || "Failed to sync device" });
    }
  });

  // ─── Garmin Connect OAuth + Sync routes ──────────────────────────────────────

  const GARMIN_KEY    = process.env.GARMIN_CONSUMER_KEY    ?? "";
  const GARMIN_SECRET = process.env.GARMIN_CONSUMER_SECRET ?? "";
  const garminEnabled = !!GARMIN_KEY && !!GARMIN_SECRET;

  // Step 1 – kick off OAuth: redirect user to Garmin authorization page
  app.get("/api/garmin/connect", isAuthenticated, async (req: any, res) => {
    if (!garminEnabled) {
      return res.status(503).json({ message: "Garmin integration is not configured on this server." });
    }
    try {
      const callbackUrl = `${process.env.SERVER_URL || "https://www.fayaflex.com"}/api/garmin/callback`;
      const { oauthToken, oauthTokenSecret } = await getRequestToken(GARMIN_KEY, GARMIN_SECRET, callbackUrl);
      // Stash the request-token secret in the session so we can use it in the callback
      (req.session as any).garminRequestTokenSecret = oauthTokenSecret;
      (req.session as any).garminUserId = req.user.id;
      await new Promise<void>((resolve, reject) =>
        req.session.save((err: any) => (err ? reject(err) : resolve()))
      );
      const authUrl = buildAuthorizationUrl(oauthToken);
      res.redirect(authUrl);
    } catch (err: any) {
      console.error("[Garmin] OAuth initiation error:", err.message);
      res.redirect("/?garmin_error=" + encodeURIComponent(err.message));
    }
  });

  // Step 2 – Garmin redirects back here with oauth_token + oauth_verifier
  app.get("/api/garmin/callback", async (req: any, res) => {
    if (!garminEnabled) {
      return res.redirect("/?garmin_error=not_configured");
    }
    try {
      const { oauth_token: requestToken, oauth_verifier: verifier } = req.query as Record<string, string>;
      const requestTokenSecret = (req.session as any).garminRequestTokenSecret;
      const userId = (req.session as any).garminUserId;

      if (!requestToken || !verifier || !requestTokenSecret || !userId) {
        throw new Error("Missing OAuth state — please try connecting again.");
      }

      const { oauthToken, oauthTokenSecret } = await getAccessToken(
        GARMIN_KEY,
        GARMIN_SECRET,
        requestToken,
        requestTokenSecret,
        verifier
      );

      // Persist the User Access Token (UAT) in device_connections
      await storage.upsertDeviceConnection({
        userId,
        provider: "garmin_connect",
        isConnected: true,
        lastSyncAt: null,
        accessToken: oauthToken,
        refreshToken: oauthTokenSecret, // OAuth 1.0a token secret (no real refresh token)
      });

      // Clean up session state
      delete (req.session as any).garminRequestTokenSecret;
      delete (req.session as any).garminUserId;

      // Trigger an initial data sync in the background
      syncGarminForUser(userId, oauthToken, oauthTokenSecret, 30).catch((e) =>
        console.error("[Garmin] Background sync after connect failed:", e.message)
      );

      res.redirect("/?garmin_connected=1");
    } catch (err: any) {
      console.error("[Garmin] OAuth callback error:", err.message);
      res.redirect("/?garmin_error=" + encodeURIComponent(err.message));
    }
  });

  // Sync Garmin data for the authenticated user
  app.post("/api/garmin/sync", isAuthenticated, async (req: any, res) => {
    if (!garminEnabled) {
      return res.status(503).json({ message: "Garmin integration is not configured." });
    }
    try {
      const userId = req.user.id;
      const conn = await storage.getDeviceConnection(userId, "garmin_connect");
      if (!conn || !conn.isConnected || !conn.accessToken) {
        return res.status(400).json({ message: "Garmin is not connected." });
      }
      const days = parseInt(req.body?.days ?? "7", 10);
      const { synced } = await syncGarminForUser(userId, conn.accessToken, conn.refreshToken!, days);
      res.json({ success: true, synced });
    } catch (err: any) {
      console.error("[Garmin] Sync error:", err.message);
      res.status(500).json({ message: err.message || "Garmin sync failed" });
    }
  });

  // Disconnect Garmin
  app.post("/api/garmin/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.upsertDeviceConnection({
        userId,
        provider: "garmin_connect",
        isConnected: false,
        lastSyncAt: null,
        accessToken: null,
        refreshToken: null,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to disconnect" });
    }
  });

  // Status check – is Garmin configured on this server?
  app.get("/api/garmin/status", async (_req, res) => {
    res.json({ enabled: garminEnabled });
  });

  /** Pull up to `daysBack` days of Garmin data and store as activities. */
  async function syncGarminForUser(
    userId: string,
    userToken: string,
    userTokenSecret: string,
    daysBack = 7
  ): Promise<{ synced: number }> {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - daysBack * 86400;

    const [dailies, activities] = await Promise.all([
      fetchDailies(GARMIN_KEY, GARMIN_SECRET, userToken, userTokenSecret, startTime, endTime),
      fetchActivities(GARMIN_KEY, GARMIN_SECRET, userToken, userTokenSecret, startTime, endTime),
    ]);

    const merged = mergeGarminData(dailies, activities);
    console.log(`[Garmin] User ${userId}: ${dailies.length} dailies, ${activities.length} activities → ${merged.length} days`);

    const results = await storage.syncHealthActivities(
      userId,
      "garmin_connect",
      merged.map((d) => ({
        date: d.date,
        calories: d.calories,
        steps: d.steps,
        workoutType: d.workouts > 0
          ? `Garmin Sync (${d.workouts} workout${d.workouts > 1 ? "s" : ""})`
          : undefined,
      }))
    );

    await storage.upsertDeviceConnection({
      userId,
      provider: "garmin_connect",
      isConnected: true,
      lastSyncAt: new Date(),
    });

    return { synced: results.created + results.updated };
  }

  // ─── End Garmin routes ────────────────────────────────────────────────────────

  // Location API routes for hierarchical geo rankings
  app.get("/api/locations", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const parentId = req.query.parentId as string | undefined;
      
      const locationsList = await storage.getLocations(type, parentId);
      res.json(locationsList);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Search cities by name using GeoNames API (must be before :id route)
  app.get("/api/locations/search/cities", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const { searchCitiesGeoNames } = await import("./geonames");
      const results = await searchCitiesGeoNames(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching cities:", error);
      res.status(500).json({ message: "Failed to search cities" });
    }
  });

  // Create location hierarchy from GeoNames data when user selects a city
  app.post("/api/locations/from-geonames", async (req, res) => {
    try {
      const schema = z.object({
        geonameId: z.number(),
        cityName: z.string(),
        regionName: z.string(),
        countryName: z.string(),
        countryCode: z.string(),
        continentCode: z.string(),
        continentName: z.string(),
      });
      
      const data = schema.parse(req.body);
      const hierarchy = await storage.createLocationHierarchyFromGeoNames(data);
      res.json(hierarchy);
    } catch (error) {
      console.error("Error creating location from GeoNames:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocationById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Get full location hierarchy for a location
  app.get("/api/locations/:id/hierarchy", async (req, res) => {
    try {
      const hierarchy = await storage.getLocationHierarchy(req.params.id);
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching location hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch location hierarchy" });
    }
  });

  // Teammate profile routes (require shared team membership)
  app.get("/api/users/:userId/profile", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      
      // Check if users share a team
      const shareTeam = await storage.doUsersShareTeam(currentUserId, targetUserId);
      if (!shareTeam && currentUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view profiles of teammates" });
      }
      
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hide email from other users
      res.json(sanitizeUserForDisplay(user, currentUserId));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:userId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      
      // Check if users share a team
      const shareTeam = await storage.doUsersShareTeam(currentUserId, targetUserId);
      if (!shareTeam && currentUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view activities of teammates" });
      }
      
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const activities = await storage.getUserActivities(targetUserId, month, year);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  // Teammate comparison stats - daily averages for comparison chart
  app.get("/api/users/:userId/comparison-stats", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Check authorization first (before expensive queries)
      const shareTeam = await storage.doUsersShareTeam(currentUserId, targetUserId);
      if (!shareTeam && currentUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view comparison stats of teammates" });
      }
      
      // Helper to aggregate activities by date (max calories/steps per day, count workouts)
      const aggregateByDate = (activities: any[]) => {
        const byDate = new Map<string, { calories: number; steps: number; workouts: number }>();
        for (const act of activities) {
          const existing = byDate.get(act.date) || { calories: 0, steps: 0, workouts: 0 };
          byDate.set(act.date, {
            calories: Math.max(existing.calories, act.calories),
            steps: Math.max(existing.steps, act.steps),
            workouts: existing.workouts + (act.workoutType ? 1 : 0),
          });
        }
        return byDate;
      };
      
      // Get days in current month up to today
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const daysToCount = (month === currentMonth && year === currentYear) 
        ? today.getDate() 
        : new Date(year, month, 0).getDate();
      
      // 1. Target user's daily data
      const targetActivities = await storage.getUserActivities(targetUserId, month, year);
      const targetByDate = aggregateByDate(targetActivities);
      
      // Calculate target user totals
      const targetTotals = { calories: 0, steps: 0, workouts: 0 };
      targetByDate.forEach(val => {
        targetTotals.calories += val.calories;
        targetTotals.steps += val.steps;
        targetTotals.workouts += val.workouts;
      });
      const targetDailyAvg = {
        calories: Math.round(targetTotals.calories / daysToCount),
        steps: Math.round(targetTotals.steps / daysToCount),
        workouts: Math.round((targetTotals.workouts / daysToCount) * 100) / 100,
      };
      
      // 2. Get all users for global stats
      const allUsers = await storage.getAllUsers();
      let globalTotals = { calories: 0, steps: 0, workouts: 0 };
      let bestUserTotals = { calories: 0, steps: 0, workouts: 0 };
      
      for (const user of allUsers) {
        const userActivities = await storage.getUserActivities(user.id, month, year);
        const userByDate = aggregateByDate(userActivities);
        
        let userTotals = { calories: 0, steps: 0, workouts: 0 };
        userByDate.forEach(val => {
          userTotals.calories += val.calories;
          userTotals.steps += val.steps;
          userTotals.workouts += val.workouts;
        });
        
        globalTotals.calories += userTotals.calories;
        globalTotals.steps += userTotals.steps;
        globalTotals.workouts += userTotals.workouts;
        
        // Track best user (highest totals for each metric - may be different users)
        if (userTotals.calories > bestUserTotals.calories) {
          bestUserTotals.calories = userTotals.calories;
        }
        if (userTotals.steps > bestUserTotals.steps) {
          bestUserTotals.steps = userTotals.steps;
        }
        if (userTotals.workouts > bestUserTotals.workouts) {
          bestUserTotals.workouts = userTotals.workouts;
        }
      }
      
      const globalDailyAvg = {
        calories: allUsers.length > 0 ? Math.round(globalTotals.calories / (allUsers.length * daysToCount)) : 0,
        steps: allUsers.length > 0 ? Math.round(globalTotals.steps / (allUsers.length * daysToCount)) : 0,
        workouts: allUsers.length > 0 ? Math.round((globalTotals.workouts / (allUsers.length * daysToCount)) * 100) / 100 : 0,
      };
      
      const bestGlobalDailyAvg = {
        calories: Math.round(bestUserTotals.calories / daysToCount),
        steps: Math.round(bestUserTotals.steps / daysToCount),
        workouts: Math.round((bestUserTotals.workouts / daysToCount) * 100) / 100,
      };
      
      // 3. Team average (get teams the target user is in)
      const userTeams = await storage.getUserTeams(targetUserId);
      let teamTotals = { calories: 0, steps: 0, workouts: 0 };
      let teamMemberCount = 0;
      const processedMembers = new Set<string>();
      
      for (const team of userTeams) {
        const members = await storage.getTeamMembers(team.id);
        for (const member of members) {
          if (processedMembers.has(member.userId)) continue;
          processedMembers.add(member.userId);
          
          const memberActivities = await storage.getUserActivities(member.userId, month, year);
          const memberByDate = aggregateByDate(memberActivities);
          
          memberByDate.forEach(val => {
            teamTotals.calories += val.calories;
            teamTotals.steps += val.steps;
            teamTotals.workouts += val.workouts;
          });
          teamMemberCount++;
        }
      }
      
      const teamDailyAvg = {
        calories: teamMemberCount > 0 ? Math.round(teamTotals.calories / (teamMemberCount * daysToCount)) : 0,
        steps: teamMemberCount > 0 ? Math.round(teamTotals.steps / (teamMemberCount * daysToCount)) : 0,
        workouts: teamMemberCount > 0 ? Math.round((teamTotals.workouts / (teamMemberCount * daysToCount)) * 100) / 100 : 0,
      };
      
      // 4. Generate daily data points for chart with all metrics
      const dailyData: { 
        date: string; 
        day: number;
        userCalories: number; 
        userSteps: number; 
        userWorkouts: number;
      }[] = [];
      
      for (let day = 1; day <= daysToCount; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const userData = targetByDate.get(dateStr) || { calories: 0, steps: 0, workouts: 0 };
        
        dailyData.push({
          date: dateStr,
          day,
          userCalories: userData.calories,
          userSteps: userData.steps,
          userWorkouts: userData.workouts,
        });
      }
      
      res.json({
        targetUser: targetDailyAvg,
        bestGlobal: bestGlobalDailyAvg,
        globalAvg: globalDailyAvg,
        teamAvg: teamDailyAvg,
        dailyData,
        daysInMonth: daysToCount,
      });
    } catch (error) {
      console.error("Error fetching comparison stats:", error);
      res.status(500).json({ message: "Failed to fetch comparison stats" });
    }
  });

  // Get stats for a specific user (for teammate profile)
  app.get("/api/users/:userId/stats", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      
      // Check if users share a team
      const shareTeam = await storage.doUsersShareTeam(currentUserId, targetUserId);
      if (!shareTeam && currentUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view stats of teammates" });
      }
      
      // Get all user activities
      const activities = await storage.getUserActivities(targetUserId);
      
      // Helper function to parse date string as local date without timezone drift
      const parseLocalDate = (dateStr: string): number => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      };
      
      // Calculate total workouts (unique days with activities)
      const uniqueDates = new Set(
        activities.map(a => parseLocalDate(a.date))
      );
      const totalWorkouts = uniqueDates.size;
      
      // Calculate current streak
      let currentStreak = 0;
      if (activities.length > 0) {
        const sortedActivities = [...activities].sort((a, b) => 
          parseLocalDate(b.date) - parseLocalDate(a.date)
        );
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if there's an activity today or yesterday
        const latestActivityDate = parseLocalDate(sortedActivities[0].date);
        
        if (latestActivityDate >= yesterday.getTime()) {
          // Start counting streak
          let streakDate = new Date(latestActivityDate);
          const activityDates = new Set(
            activities.map(a => parseLocalDate(a.date))
          );
          
          while (activityDates.has(streakDate.getTime())) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          }
        }
      }
      
      // Calculate monthly totals
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthActivities = await storage.getUserActivities(targetUserId, currentMonth, currentYear);
      
      const calByDate = new Map<string, number>();
      const stepsByDate = new Map<string, number>();
      for (const act of monthActivities) {
        calByDate.set(act.date, Math.max(calByDate.get(act.date) || 0, act.calories));
        stepsByDate.set(act.date, Math.max(stepsByDate.get(act.date) || 0, act.steps || 0));
      }
      
      let totalCalories = 0;
      let totalSteps = 0;
      calByDate.forEach(cal => { totalCalories += cal; });
      stepsByDate.forEach(steps => { totalSteps += steps; });
      
      res.json({ totalWorkouts, currentStreak, totalCalories, totalSteps });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get badges for a specific user (for teammate profile)
  app.get("/api/users/:userId/badges", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      
      // Check if users share a team
      const shareTeam = await storage.doUsersShareTeam(currentUserId, targetUserId);
      if (!shareTeam && currentUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view badges of teammates" });
      }
      
      const badges = await storage.getUserBadges(targetUserId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Profile routes
  app.get("/api/profile/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all user activities
      const activities = await storage.getUserActivities(userId);
      
      // Helper function to parse date string as local date without timezone drift
      const parseLocalDate = (dateStr: string): number => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      };
      
      // Calculate total workouts (unique days with activities)
      const uniqueDates = new Set(
        activities.map(a => parseLocalDate(a.date))
      );
      const totalWorkouts = uniqueDates.size;
      
      // Calculate current streak
      let currentStreak = 0;
      if (activities.length > 0) {
        const sortedActivities = [...activities].sort((a, b) => 
          parseLocalDate(b.date) - parseLocalDate(a.date)
        );
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if there's an activity today or yesterday
        const latestActivityDate = parseLocalDate(sortedActivities[0].date);
        
        if (latestActivityDate >= yesterday.getTime()) {
          // Start counting streak
          let streakDate = new Date(latestActivityDate);
          const activityDates = new Set(
            activities.map(a => parseLocalDate(a.date))
          );
          
          while (activityDates.has(streakDate.getTime())) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          }
        }
      }
      
      // Calculate monthly totals (sum all activities, take max per day to avoid double counting)
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthActivities = await storage.getUserActivities(userId, currentMonth, currentYear);
      
      const calByDate = new Map<string, number>();
      const stepsByDate = new Map<string, number>();
      for (const act of monthActivities) {
        // Take max per day to avoid double-counting from multiple syncs
        calByDate.set(act.date, Math.max(calByDate.get(act.date) || 0, act.calories));
        stepsByDate.set(act.date, Math.max(stepsByDate.get(act.date) || 0, act.steps || 0));
      }
      
      // Sum across all days
      let totalCalories = 0;
      let totalSteps = 0;
      calByDate.forEach(cal => { totalCalories += cal; });
      stepsByDate.forEach(steps => { totalSteps += steps; });
      
      res.json({ totalWorkouts, currentStreak, totalCalories, totalSteps });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Daily goals endpoint
  app.get("/api/goals/daily", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's activities
      const todayActivities = await storage.getUserActivitiesForDate(userId, today);
      
      // Calculate today's totals
      // For health syncs (apple_health, health_connect, etc): take max to avoid double-counting
      // For manual entries: sum them up (user explicitly added each one)
      const caloriesByHealthSource = new Map<string, number>();
      const stepsByHealthSource = new Map<string, number>();
      let manualCalories = 0;
      let manualSteps = 0;
      let todayWorkouts = 0;
      
      for (const act of todayActivities) {
        const source = act.source || 'manual';
        const isManual = source === 'manual';
        const actCalories = act.calories || 0;
        const actSteps = act.steps || 0;
        
        if (isManual) {
          // Sum manual entries
          manualCalories += actCalories;
          manualSteps += actSteps;
        } else {
          // Take max per health source to avoid double-counting from same health app
          caloriesByHealthSource.set(source, Math.max(caloriesByHealthSource.get(source) || 0, actCalories));
          stepsByHealthSource.set(source, Math.max(stepsByHealthSource.get(source) || 0, actSteps));
        }
        // Count as workout if it has any activity
        if (actCalories > 0 || act.workoutCompleted || act.workoutType || actSteps > 0) todayWorkouts = 1;
      }
      
      // Sum across all health sources + manual
      let todayCalories = manualCalories;
      let todaySteps = manualSteps;
      caloriesByHealthSource.forEach(cal => { todayCalories += cal; });
      stepsByHealthSource.forEach(steps => { todaySteps += steps; });
      
      // Default goals (TODO: allow user-customizable goals in future)
      res.json({
        calories: { current: todayCalories, goal: 2200 },
        steps: { current: todaySteps, goal: 10000 },
        workouts: { current: todayWorkouts, goal: 1 },
      });
    } catch (error) {
      console.error("Error fetching daily goals:", error);
      res.status(500).json({ message: "Failed to fetch daily goals" });
    }
  });

  // AI Coach - Workout and Nutrition Suggestions
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  app.get("/api/ai-coach/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Get recent activity data (last 7 days)
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Fetch activities for current and previous month to handle cross-month boundaries
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const prevMonth = weekAgo.getMonth() + 1;
      const prevYear = weekAgo.getFullYear();
      
      let activities = await storage.getUserActivities(userId, currentMonth, currentYear);
      
      // If week spans two months, also fetch previous month
      if (prevMonth !== currentMonth || prevYear !== currentYear) {
        const prevActivities = await storage.getUserActivities(userId, prevMonth, prevYear);
        activities = [...activities, ...prevActivities];
      }
      
      // Calculate weekly stats
      const weekStart = weekAgo.toISOString().split('T')[0];
      const recentActivities = activities.filter(a => a.date >= weekStart);
      
      const weeklyCalories = recentActivities.reduce((sum, a) => sum + (a.calories || 0), 0);
      const weeklySteps = recentActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
      const workoutDays = new Set(recentActivities.filter(a => (a.calories || 0) > 0 || (a.steps || 0) > 0).map(a => a.date)).size;
      const workoutTypes = [...new Set(recentActivities.filter(a => a.workoutType).map(a => a.workoutType))];
      
      // Get today's activity
      const todayStr = today.toISOString().split('T')[0];
      const todayActivities = activities.filter(a => a.date === todayStr);
      const todayCalories = todayActivities.reduce((sum, a) => sum + (a.calories || 0), 0);
      const todaySteps = todayActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
      
      // Build context for AI
      const userContext = {
        name: user?.firstName || user?.username || 'User',
        weeklyCalories,
        weeklySteps,
        workoutDays,
        workoutTypes: workoutTypes.length > 0 ? workoutTypes : ['general fitness'],
        todayCalories,
        todaySteps,
        dailyCalorieGoal: 2200,
        dailyStepsGoal: 10000,
      };

      const prompt = `You are FayaFlex AI Coach, a friendly and motivating fitness assistant. Based on the user's recent activity data, provide personalized suggestions.

User: ${userContext.name}
This Week's Stats:
- Total calories burned: ${userContext.weeklyCalories.toLocaleString()} kcal
- Total steps: ${userContext.weeklySteps.toLocaleString()}
- Active workout days: ${userContext.workoutDays}/7
- Workout types: ${userContext.workoutTypes.join(', ')}

Today's Progress:
- Calories: ${userContext.todayCalories.toLocaleString()} / ${userContext.dailyCalorieGoal.toLocaleString()} kcal
- Steps: ${userContext.todaySteps.toLocaleString()} / ${userContext.dailyStepsGoal.toLocaleString()}

Respond with a JSON object containing exactly these fields:
{
  "greeting": "A short personalized greeting (1 sentence)",
  "workoutSuggestion": {
    "title": "Workout name (3-5 words)",
    "description": "Brief description of the workout (2-3 sentences). Include specific exercises or activities.",
    "duration": "Workout duration between 30-45 min (e.g., '30 min', '35 min', '40 min', '45 min')",
    "intensity": "low" | "medium" | "high",
    "calorieEstimate": number (estimated calories to burn, typically 200-400 for 30-45 min),
    "workoutType": "running" | "cycling" | "strength" | "yoga" | "hiit" | "swimming" | "walking",
    "exercises": [
      {
        "key": "exercise_key from catalog below",
        "sets": number or null (for strength exercises),
        "reps": "rep range like '10-12' or null",
        "duration": "time like '30 sec' or '1 min' or null (for holds/cardio)"
      }
    ]
  },
  "nutritionTip": {
    "title": "Nutrition tip title (3-5 words)",
    "description": "Practical nutrition advice based on their activity level (2-3 sentences)",
    "focus": "hydration" | "protein" | "carbs" | "recovery" | "energy"
  },
  "motivation": "A short motivational message (1-2 sentences)"
}

EXERCISE CATALOG (use ONLY these exact keys):
Strength exercises: squat, lunge, pushup, plank, row, bicep_curl
Stretch exercises: hamstring_stretch, hip_flexor_stretch, shoulder_stretch, calf_stretch  
Yoga poses: warrior_ii, downward_dog, childs_pose, tree_pose

IMPORTANT RULES:
1. Suggest workouts between 30-45 minutes
2. For strength/hiit workouts: include 3-5 exercises from the strength catalog with sets and reps
3. For yoga workouts: include 3-4 poses from the yoga catalog with duration (e.g., "30 sec", "1 min")
4. For stretch/recovery: include 3-4 stretches from the stretch catalog with duration
5. For cardio (running/cycling/swimming/walking): exercises array can be empty or omit it
6. Choose workoutType based on user's history - vary suggestions
7. Be encouraging but realistic about their activity level`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const suggestions = JSON.parse(content);
      
      res.json({
        ...suggestions,
        stats: {
          weeklyCalories: userContext.weeklyCalories,
          weeklySteps: userContext.weeklySteps,
          workoutDays: userContext.workoutDays,
          todayCalories: userContext.todayCalories,
          todaySteps: userContext.todaySteps,
        }
      });
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      res.status(500).json({ message: "Failed to get AI suggestions" });
    }
  });

  // Team routes
  app.post("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertTeamSchema.parse({ ...req.body, ownerId: userId });
      
      const team = await storage.createTeam(validatedData);
      
      // Automatically add owner as a team member
      await storage.addTeamMember({
        teamId: team.id,
        userId: userId,
      });
      
      res.json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: error.message || "Failed to create team" });
    }
  });

  app.get("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teams = await storage.getUserTeams(userId);
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      // Get all teams for ranking calculation
      const allTeams = await storage.getAllTeams();
      const allTeamStats: { teamId: string; totalCalories: number }[] = [];
      
      for (const team of allTeams) {
        const activities = await storage.getTeamActivities(team.id, month, year);
        let totalCalories = 0;
        const byUserDate = new Map<string, number>();
        for (const act of activities) {
          const key = `${act.userId}:${act.date}`;
          const existing = byUserDate.get(key) || 0;
          byUserDate.set(key, Math.max(existing, act.calories));
        }
        byUserDate.forEach(cal => { totalCalories += cal; });
        allTeamStats.push({ teamId: team.id, totalCalories });
      }
      
      // Sort to determine ranks
      allTeamStats.sort((a, b) => b.totalCalories - a.totalCalories);
      const rankMap = new Map(allTeamStats.map((t, i) => [t.teamId, i + 1]));
      
      // Enrich user's teams with full data
      const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          const activities = await storage.getTeamActivities(team.id, month, year);
          
          // Calculate stats
          const calByUserDate = new Map<string, number>();
          const stepsByUserDate = new Map<string, number>();
          const workoutDates = new Set<string>();
          
          for (const act of activities) {
            const calKey = `${act.userId}:${act.date}`;
            calByUserDate.set(calKey, Math.max(calByUserDate.get(calKey) || 0, act.calories));
            stepsByUserDate.set(calKey, Math.max(stepsByUserDate.get(calKey) || 0, act.steps || 0));
            if (act.workoutCompleted) {
              workoutDates.add(`${act.userId}:${act.date}`);
            }
          }
          
          let totalCalories = 0;
          let totalSteps = 0;
          calByUserDate.forEach(cal => { totalCalories += cal; });
          stepsByUserDate.forEach(steps => { totalSteps += steps; });
          
          // Get member avatars (up to 3)
          const memberAvatars = await Promise.all(
            members.slice(0, 3).map(async (m) => {
              const user = await storage.getUser(m.userId);
              return {
                id: m.userId,
                profileImageUrl: user?.profileImageUrl,
                avatarId: user?.avatarId,
                firstName: user?.firstName,
              };
            })
          );
          
          return {
            ...team,
            memberCount: members.length,
            totalCalories,
            totalSteps,
            totalWorkouts: workoutDates.size,
            rank: rankMap.get(team.id) || 0,
            memberAvatars,
          };
        })
      );
      
      res.json(enrichedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  // Public endpoint — no auth needed, used by deep-link join page
  app.get("/api/teams/invite/:code", async (req, res) => {
    try {
      const code = req.params.code.trim().toLowerCase();
      const team = await storage.getTeamByInviteCode(code);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      const members = await storage.getTeamMembers(team.id);
      res.json({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: members.length,
        isFull: members.length >= 20,
      });
    } catch (error) {
      console.error("Error fetching team by invite code:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post("/api/teams/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const joinSchema = z.object({
        inviteCode: z.string().min(1, "Invite code is required"),
      });
      const validation = joinSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: validation.error.errors[0]?.message || "Invalid request" 
        });
      }
      
      const { inviteCode } = validation.data;
      const cleanCode = inviteCode.trim().toLowerCase();
      
      console.log(`[Teams] Join attempt with code: "${cleanCode}" (original: "${inviteCode}")`);

      const team = await storage.getTeamByInviteCode(cleanCode);
      if (!team) {
        console.log(`[Teams] Team not found for code: "${cleanCode}"`);
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      console.log(`[Teams] Found team: ${team.name} (${team.id})`)

      const isAlreadyMember = await storage.isUserInTeam(userId, team.id);
      if (isAlreadyMember) {
        return res.status(400).json({ message: "Already a member of this team" });
      }

      // Check team member count limit (max 20 members)
      const currentMembers = await storage.getTeamMembers(team.id);
      if (currentMembers.length >= 20) {
        return res.status(400).json({ message: "Team is full (maximum 20 members)" });
      }

      await storage.addTeamMember({
        teamId: team.id,
        userId: userId,
      });

      res.json(team);
    } catch (error: any) {
      console.error("Error joining team:", error);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  app.get("/api/teams/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const members = await storage.getTeamMembers(req.params.id);
      
      // Get user details for each member (without emails)
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            user: sanitizeUserForDisplay(user, currentUserId),
          };
        })
      );
      
      res.json(membersWithDetails);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Archive team endpoint - only owner can archive
  app.post("/api/teams/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamId = req.params.id;

      // Get team and check if user is owner
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.ownerId !== userId) {
        return res.status(403).json({ message: "Only team owner can end the challenge" });
      }

      const archivedTeam = await storage.archiveTeam(teamId);
      res.json({ success: true, team: archivedTeam });
    } catch (error: any) {
      console.error("Error archiving team:", error);
      res.status(500).json({ message: error.message || "Failed to archive team" });
    }
  });

  // Leave team endpoint - any member can leave
  app.post("/api/teams/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamId = req.params.id;

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if user is a member
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(400).json({ message: "You are not a member of this team" });
      }

      // Owner cannot leave, they must delete or transfer ownership
      if (team.ownerId === userId) {
        return res.status(400).json({ message: "Team owner cannot leave. Delete the team instead." });
      }

      await storage.removeTeamMember(userId, teamId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error leaving team:", error);
      res.status(500).json({ message: error.message || "Failed to leave team" });
    }
  });

  // Delete team endpoint - only owner can delete
  app.delete("/api/teams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamId = req.params.id;

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.ownerId !== userId) {
        return res.status(403).json({ message: "Only team owner can delete the team" });
      }

      await storage.deleteTeam(teamId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: error.message || "Failed to delete team" });
    }
  });

  // Kick member endpoint - only owner can kick
  app.delete("/api/teams/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const teamId = req.params.id;
      const targetUserId = req.params.userId;

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.ownerId !== currentUserId) {
        return res.status(403).json({ message: "Only team owner can remove members" });
      }

      // Owner cannot kick themselves
      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "Cannot remove yourself. Delete the team instead." });
      }

      // Check if target is a member
      const isMember = await storage.isUserInTeam(targetUserId, teamId);
      if (!isMember) {
        return res.status(400).json({ message: "User is not a member of this team" });
      }

      await storage.removeTeamMember(targetUserId, teamId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: error.message || "Failed to remove team member" });
    }
  });

  // Challenge Archive endpoint - shows all past months' results for user's teams
  app.get("/api/challenge-archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all monthly winners for teams the user is a member of
      const winners = await storage.getUserTeamsMonthlyWinners(userId);
      
      // Enrich with user and team details
      const enrichedWinners = await Promise.all(
        winners.map(async (winner) => {
          const user = await storage.getUser(winner.userId);
          const team = await storage.getTeam(winner.teamId);
          return {
            ...winner,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown',
            userAvatarId: user?.avatarId,
            userProfileImageUrl: user?.profileImageUrl,
            teamName: team?.name || 'Unknown Team',
            isCurrentUser: winner.userId === userId,
          };
        })
      );
      
      // Group by month/year for statistics
      const monthlyStats = new Map<string, {
        month: number;
        year: number;
        totalCalories: number;
        winnersCount: number;
        teams: string[];
      }>();
      
      for (const winner of enrichedWinners) {
        const key = `${winner.year}-${winner.month}`;
        const existing = monthlyStats.get(key);
        if (existing) {
          existing.totalCalories += winner.totalCalories;
          existing.winnersCount += 1;
          if (!existing.teams.includes(winner.teamName)) {
            existing.teams.push(winner.teamName);
          }
        } else {
          monthlyStats.set(key, {
            month: winner.month,
            year: winner.year,
            totalCalories: winner.totalCalories,
            winnersCount: 1,
            teams: [winner.teamName],
          });
        }
      }
      
      res.json({
        winners: enrichedWinners,
        monthlyStats: Array.from(monthlyStats.values()).sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }),
      });
    } catch (error) {
      console.error("Error fetching challenge archive:", error);
      res.status(500).json({ message: "Failed to fetch challenge archive" });
    }
  });

  // Victory Wall endpoints
  app.get("/api/teams/:id/victory-wall", isAuthenticated, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const userId = req.user.id;

      // Check if user is a member of this team
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this team's victory wall" });
      }

      const winners = await storage.getTeamMonthlyWinners(teamId);
      
      // Enrich with user details
      const winnersWithDetails = await Promise.all(
        winners.map(async (winner) => {
          const user = await storage.getUser(winner.userId);
          return {
            ...winner,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown',
            userAvatarId: user?.avatarId,
            profileImageUrl: user?.profileImageUrl ?? null,
          };
        })
      );

      res.json(winnersWithDetails);
    } catch (error) {
      console.error("Error fetching victory wall:", error);
      res.status(500).json({ message: "Failed to fetch victory wall" });
    }
  });

  app.post("/api/teams/:id/calculate-winner", isAuthenticated, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const userId = req.user.id;

      // Check if user is team owner
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.ownerId !== userId) {
        return res.status(403).json({ message: "Only team owner can calculate winners" });
      }

      // Validate request body
      const winnerSchema = z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2020).max(2100),
      });
      const validatedData = winnerSchema.parse(req.body);

      // Get all team members and calculate their totals for that month
      const members = await storage.getTeamMembers(teamId);
      const memberStats = [];

      for (const member of members) {
        const activities = await storage.getUserActivities(member.userId, validatedData.month, validatedData.year);
        const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
        
        if (totalCalories > 0) {
          memberStats.push({
            userId: member.userId,
            totalCalories,
          });
        }
      }

      if (memberStats.length === 0) {
        return res.status(400).json({ message: "No activities found for this month" });
      }

      // Sort by calories and get winner
      memberStats.sort((a, b) => b.totalCalories - a.totalCalories);
      const winner = memberStats[0];

      // Create/update monthly winner record
      const monthlyWinner = await storage.createMonthlyWinner({
        teamId,
        userId: winner.userId,
        month: validatedData.month,
        year: validatedData.year,
        totalCalories: winner.totalCalories,
      });

      const user = await storage.getUser(winner.userId);
      const winnerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown';

      // Fire-and-forget push to all team members
      try {
        const recipientIds = members.map(m => m.userId);
        triggerMonthlyWinner({
          teamId,
          teamName: team.name,
          winnerName,
          recipientUserIds: recipientIds,
        });
      } catch (e) { console.error("[Push] monthly winner trigger failed:", e); }

      res.json({
        ...monthlyWinner,
        userName: winnerName,
      });
    } catch (error: any) {
      console.error("Error calculating winner:", error);
      res.status(400).json({ message: error.message || "Failed to calculate winner" });
    }
  });

  // Team chat routes
  app.get("/api/teams/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string | undefined;

      // Check if user is a member of this team
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this team's messages" });
      }

      const messages = await storage.getTeamMessages(teamId, limit, before);
      
      // Sanitize user data (hide emails)
      const sanitizedMessages = messages.map(msg => ({
        ...msg,
        user: {
          id: msg.user.id,
          username: msg.user.username,
          firstName: msg.user.firstName,
          lastName: msg.user.lastName,
          avatarId: msg.user.avatarId,
          profileImageUrl: msg.user.profileImageUrl,
        }
      }));

      res.json(sanitizedMessages);
    } catch (error) {
      console.error("Error fetching team messages:", error);
      res.status(500).json({ message: "Failed to fetch team messages" });
    }
  });

  app.post("/api/teams/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const userId = req.user.id;

      // Check if user is a member of this team
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to post in this team" });
      }

      const messageSchema = z.object({
        content: z.string().min(1).max(1000),
      });
      const validatedData = messageSchema.parse(req.body);

      const message = await storage.sendTeamMessage(teamId, userId, validatedData.content);
      
      // Get user details for response
      const user = await storage.getUser(userId);

      // Fire-and-forget push notification to other team members
      try {
        const team = await storage.getTeam(teamId);
        const members = await storage.getTeamMembers(teamId);
        const recipientIds = members.map(m => m.userId).filter(id => id !== userId);
        if (team && recipientIds.length) {
          const senderName = user ? (user.firstName || user.username) : "A teammate";
          triggerTeamMessage({
            teamId,
            teamName: team.name,
            senderName,
            recipientUserIds: recipientIds,
            preview: validatedData.content,
          });
        }
      } catch (e) { console.error("[Push] team message trigger failed:", e); }
      
      res.json({
        ...message,
        user: user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarId: user.avatarId,
          profileImageUrl: user.profileImageUrl,
        } : null
      });
    } catch (error: any) {
      console.error("Error sending team message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // Activity routes
  // Image upload endpoint for evidence
  app.post("/api/upload/evidence", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Compress and save image
      const imagePath = await compressAndSaveImage(req.file.buffer, req.file.originalname);
      
      res.json({ 
        success: true,
        path: imagePath,
        message: "Image uploaded and compressed successfully" 
      });
    } catch (error: any) {
      console.error("Error uploading evidence:", error);
      res.status(500).json({ message: error.message || "Failed to upload image" });
    }
  });

  // Profile image upload endpoint - handles both multipart (web) and base64 (native) uploads
  app.post("/api/upload/profile-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      let imageBuffer: Buffer;

      // Check for base64 upload from native apps
      if (req.body && req.body.image && typeof req.body.image === 'string') {
        // Native app sends base64 encoded image
        imageBuffer = Buffer.from(req.body.image, 'base64');
        console.log('[Upload] Received base64 image upload from native app');
      } else if (req.file) {
        // Web upload via multipart form
        imageBuffer = req.file.buffer;
        console.log('[Upload] Received multipart form upload from web');
      } else {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Compress and save profile image
      const imagePath = await compressAndSaveProfileImage(imageBuffer, userId);
      
      // Update user's profile image URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl: imagePath });
      
      res.json({ 
        success: true,
        path: imagePath,
        user: updatedUser,
        message: "Profile image uploaded successfully" 
      });
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: error.message || "Failed to upload profile image" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('[API] POST /api/activities called for user:', userId, 'with body:', req.body);
      const validatedData = insertActivitySchema.parse(req.body);
      
      console.log('[API] Calling storage.createActivity');
      const activity = await storage.createActivity(validatedData, userId);
      console.log('[API] Activity created:', activity.id);

      // Auto-post to feed when this activity is a workout
      if (activity.workoutType) {
        (async () => {
          try {
            const content = formatWorkoutFeedPost(activity);
            await storage.createFeedPost(userId, content, activity.attachmentUrl ?? null);
          } catch (e) {
            console.error("[Feed] Auto-post failed:", e);
          }
        })();
      }

      // Fire-and-forget: recompute global monthly rank, notify if user was overtaken
      (async () => {
        try {
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          const allActivities = await storage.getAllActivitiesForMonth(month, year);
          // Aggregate calories per user (max per day to avoid double-counting)
          const userCalories = new Map<string, Map<string, number>>();
          for (const act of allActivities) {
            if (!userCalories.has(act.userId)) userCalories.set(act.userId, new Map());
            const dates = userCalories.get(act.userId)!;
            dates.set(act.date, Math.max(dates.get(act.date) || 0, act.calories));
          }
          const ranked: { userId: string; total: number }[] = [];
          for (const [uid, dates] of userCalories.entries()) {
            let total = 0;
            for (const c of dates.values()) total += c;
            ranked.push({ userId: uid, total });
          }
          ranked.sort((a, b) => b.total - a.total);
          const newRank = ranked.findIndex(u => u.userId === userId) + 1;
          if (newRank > 0) {
            const user = await storage.getUser(userId);
            const oldRank = user?.lastKnownGlobalRank ?? 0;
            if (oldRank > 0 && newRank > oldRank) {
              triggerRankChange({ userId, oldRank, newRank });
            }
            // Always update the snapshot so we have a baseline for next time
            if (oldRank !== newRank) {
              await storage.updateUser(userId, { lastKnownGlobalRank: newRank });
            }
          }
        } catch (e) {
          console.error("[Push] rank-change check failed:", e);
        }
      })();

      res.json(activity);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const activities = await storage.getUserActivities(userId, month, year);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Activity reactions routes
  app.post("/api/activities/:activityId/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId } = req.params;
      const { type } = req.body;

      console.log(`[Reactions] POST request - userId: ${userId}, activityId: ${activityId}, type: ${type}`);

      if (type !== 'thumbs_up' && type !== 'thumbs_down') {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const reaction = await storage.addReaction({
        activityId,
        userId,
        type,
      });

      console.log(`[Reactions] Successfully added reaction:`, reaction);

      // Fire-and-forget push to activity owner
      try {
        const activity = await storage.getActivityById(activityId);
        if (activity && activity.userId !== userId) {
          const reactor = await storage.getUser(userId);
          triggerReaction({
            ownerUserId: activity.userId,
            reactorName: reactor ? (reactor.firstName || reactor.username) : "Someone",
            reactionType: type,
            activityId,
          });
        }
      } catch (e) { console.error("[Push] reaction trigger failed:", e); }

      res.json(reaction);
    } catch (error: any) {
      console.error("[Reactions] Error adding reaction:", error);
      console.error("[Reactions] Error stack:", error.stack);
      res.status(400).json({ message: error.message || "Failed to add reaction" });
    }
  });

  app.delete("/api/activities/:activityId/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId } = req.params;

      await storage.removeReaction(activityId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing reaction:", error);
      res.status(400).json({ message: error.message || "Failed to remove reaction" });
    }
  });

  app.get("/api/activities/:activityId/reactors", async (req: any, res) => {
    try {
      const { activityId } = req.params;
      const reactors = await storage.getActivityReactors(activityId);
      const sanitized = reactors.map(r => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        profileImageUrl: r.profileImageUrl,
        type: r.type,
      }));
      res.json(sanitized);
    } catch (error: any) {
      console.error("Error fetching reactors:", error);
      res.status(500).json({ message: "Failed to fetch reactors" });
    }
  });

  app.get("/api/activities/:activityId/reactions", async (req: any, res) => {
    try {
      const { activityId } = req.params;
      const userId = req.user?.id;

      const reactions = await storage.getActivityReactions(activityId);
      
      let userReaction = undefined;
      if (userId) {
        const reaction = await storage.getUserReaction(activityId, userId);
        userReaction = reaction?.type as 'thumbs_up' | 'thumbs_down' | undefined;
      }

      res.json({ ...reactions, userReaction });
    } catch (error: any) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Activity comments routes
  app.post("/api/activities/:activityId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.addComment({
        activityId,
        userId,
        content: content.trim(),
      });

      // Return comment with user info (without email)
      const user = await storage.getUser(userId);

      // Fire-and-forget push to activity owner
      try {
        const activity = await storage.getActivityById(activityId);
        if (activity && activity.userId !== userId) {
          triggerComment({
            ownerUserId: activity.userId,
            commenterName: user ? (user.firstName || user.username) : "Someone",
            preview: content.trim(),
            activityId,
          });
        }
      } catch (e) { console.error("[Push] comment trigger failed:", e); }

      res.json({ ...comment, user: sanitizeUserForDisplay(user, userId) });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: error.message || "Failed to add comment" });
    }
  });

  app.get("/api/activities/:activityId/comments", async (req: any, res) => {
    try {
      const { activityId } = req.params;
      const currentUserId = req.user?.id;
      const comments = await storage.getActivityComments(activityId);
      
      // Remove emails from user data in comments
      const sanitizedComments = comments.map(comment => ({
        ...comment,
        user: sanitizeUserForDisplay(comment.user, currentUserId),
      }));
      
      res.json(sanitizedComments);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete("/api/activities/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { commentId } = req.params;

      await storage.deleteComment(commentId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      res.status(400).json({ message: error.message || "Failed to delete comment" });
    }
  });

  // Leaderboard routes
  
  // Get current user's rank for a specific location scope
  app.get("/api/leaderboard/user-rank", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const scope = req.query.scope as string | undefined;
      const locationId = req.query.locationId as string | undefined;

      // Get all activities for the month
      const allActivities = await storage.getAllActivitiesForMonth(month, year);
      
      // Helper to aggregate calories by date per user (avoid double-counting)
      const aggregateByUser = (activities: any[], filterFn?: (userId: string) => boolean) => {
        const userCalories = new Map<string, Map<string, number>>();
        for (const act of activities) {
          if (filterFn && !filterFn(act.userId)) continue;
          
          if (!userCalories.has(act.userId)) {
            userCalories.set(act.userId, new Map());
          }
          const userDates = userCalories.get(act.userId)!;
          const existing = userDates.get(act.date) || 0;
          userDates.set(act.date, Math.max(existing, act.calories));
        }
        
        const results: { userId: string; totalCalories: number }[] = [];
        for (const [uid, dates] of userCalories.entries()) {
          let total = 0;
          for (const cal of dates.values()) total += cal;
          results.push({ userId: uid, totalCalories: total });
        }
        return results.sort((a, b) => b.totalCalories - a.totalCalories);
      };

      let userFilter: ((userId: string) => boolean) | undefined;
      
      if (scope && locationId && scope !== 'global') {
        // Get all users and filter by location
        const allUsers = await storage.getAllUsers();
        const usersInLocation = new Set<string>();
        
        for (const user of allUsers) {
          let matches = false;
          switch (scope) {
            case 'continent':
              matches = user.continentId === locationId;
              break;
            case 'country':
              matches = user.countryId === locationId;
              break;
            case 'region':
              matches = user.regionId === locationId;
              break;
            case 'town':
              matches = user.townId === locationId;
              break;
          }
          if (matches) usersInLocation.add(user.id);
        }
        
        userFilter = (uid: string) => usersInLocation.has(uid);
      }

      const rankedUsers = aggregateByUser(allActivities, userFilter);
      const userRankIndex = rankedUsers.findIndex(u => u.userId === userId);
      
      res.json({
        rank: userRankIndex >= 0 ? userRankIndex + 1 : 0,
        total: rankedUsers.length,
      });
    } catch (error) {
      console.error("Error fetching user rank:", error);
      res.status(500).json({ message: "Failed to fetch user rank" });
    }
  });

  // Personal leaderboard - only shows members from user's teams (deduplicated)
  app.get("/api/leaderboard/personal", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Helper to aggregate activities by date (take max per day to avoid double-counting)
      const aggregateCaloriesByDate = (activities: any[]) => {
        const byDate = new Map<string, number>();
        for (const act of activities) {
          const existing = byDate.get(act.date) || 0;
          byDate.set(act.date, Math.max(existing, act.calories));
        }
        let total = 0;
        Array.from(byDate.values()).forEach(calories => { total += calories; });
        return total;
      };
      
      // Get user's teams
      const userTeams = await storage.getUserTeams(currentUserId);
      const userStatsMap = new Map<string, any>(); // Use Map to deduplicate by userId
      
      // Only show members from user's teams
      for (const team of userTeams) {
        const members = await storage.getTeamMembers(team.id);
        
        for (const member of members) {
          // Skip if already processed this user
          if (userStatsMap.has(member.userId)) {
            continue;
          }
          
          const activities = await storage.getUserActivities(member.userId, month, year);
          const totalCalories = aggregateCaloriesByDate(activities);
          const user = await storage.getUser(member.userId);
          
          if (user) {
            // Extract name from email if firstName and lastName are not available
            let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            
            if (!displayName && user.email) {
              // Use email username as name if no name is available
              const emailUsername = user.email.split('@')[0];
              displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
            }
            
            // Get location name for display
            let locationDisplay = '';
            if (user.townId) {
              const town = await storage.getLocationById(user.townId);
              locationDisplay = town?.name || '';
            } else if (user.countryId) {
              const country = await storage.getLocationById(user.countryId);
              locationDisplay = country?.name || '';
            }
            
            userStatsMap.set(user.id, {
              userId: user.id,
              name: displayName || 'Unknown User',
              teamName: team.name,
              calories: totalCalories,
              avatarId: user.avatarId,
              profileImageUrl: user.profileImageUrl,
              firstName: user.firstName,
              lastName: user.lastName,
              location: locationDisplay,
            });
          }
        }
      }
      
      // Convert map to array, sort by calories and add rank
      const sorted = Array.from(userStatsMap.values())
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / 30000) * 100),
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Team leaderboard - ranked by average daily calories per user
  app.get("/api/leaderboard/teams", isAuthenticated, async (req: any, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Helper to aggregate team activities by user+date (take max per user per day)
      const aggregateTeamCalories = (activities: any[]) => {
        const byUserDate = new Map<string, number>();
        for (const act of activities) {
          const key = `${act.userId}:${act.date}`;
          const existing = byUserDate.get(key) || 0;
          byUserDate.set(key, Math.max(existing, act.calories));
        }
        let total = 0;
        Array.from(byUserDate.values()).forEach(calories => { total += calories; });
        return total;
      };
      
      const teams = await storage.getAllTeams();
      const teamStats = [];
      
      // Calculate days elapsed in month (for current month use today's date, for past months use full month)
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(year, month, 0).getDate();
      
      let daysElapsed: number;
      if (year === currentYear && month === currentMonth) {
        // Current month: use today's date as the divisor
        daysElapsed = now.getDate();
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        // Past month: use full days in month
        daysElapsed = daysInMonth;
      } else {
        // Future month: use 1 to avoid division by zero
        daysElapsed = 1;
      }
      
      for (const team of teams) {
        const activities = await storage.getTeamActivities(team.id, month, year);
        const members = await storage.getTeamMembers(team.id);
        const totalCalories = aggregateTeamCalories(activities);
        
        // Calculate average daily calories per user (using days elapsed, not full month)
        const avgDailyCaloriesPerUser = members.length > 0 
          ? totalCalories / (members.length * daysElapsed)
          : 0;
        
        teamStats.push({
          teamId: team.id,
          name: team.name,
          teamName: `${members.length} members`,
          calories: Math.round(avgDailyCaloriesPerUser), // Display as avg daily per user
          memberCount: members.length,
          totalCalories: totalCalories,
        });
      }
      
      // Sort by average daily calories per user
      const sorted = teamStats
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / 1000) * 100), // Assuming 1000 cal/day goal per person
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  // Team-specific leaderboard
  app.get("/api/leaderboard/team/:teamId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const teamId = req.params.teamId;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Helper to aggregate activities by date (take max per day to avoid double-counting)
      const aggregateCaloriesByDate = (activities: any[]) => {
        const byDate = new Map<string, number>();
        for (const act of activities) {
          const existing = byDate.get(act.date) || 0;
          byDate.set(act.date, Math.max(existing, act.calories));
        }
        let total = 0;
        Array.from(byDate.values()).forEach(calories => { total += calories; });
        return total;
      };
      
      // Check if user is member of this team
      const isMember = await storage.isUserInTeam(currentUserId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "You can only view leaderboards for your teams" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      const memberStats: any[] = [];
      
      for (const member of members) {
        const activities = await storage.getUserActivities(member.userId, month, year);
        const totalCalories = aggregateCaloriesByDate(activities);
        const user = await storage.getUser(member.userId);
        
        if (user) {
          let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (!displayName && user.email) {
            const emailUsername = user.email.split('@')[0];
            displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
          }
          
          memberStats.push({
            userId: user.id,
            name: displayName || 'Unknown User',
            calories: totalCalories,
            avatarId: user.avatarId,
            profileImageUrl: user.profileImageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
          });
        }
      }
      
      const sorted = memberStats
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / 30000) * 100),
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  // Lightweight: current user's rank within a specific team (no full member loop)
  app.get("/api/leaderboard/team/:teamId/my-rank", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const teamId = req.params.teamId;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const isMember = await storage.isUserInTeam(currentUserId, teamId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this team" });

      const members = await storage.getTeamMembers(teamId);

      const aggregateCalories = (activities: any[]) => {
        const byDate = new Map<string, number>();
        for (const act of activities) {
          byDate.set(act.date, Math.max(byDate.get(act.date) || 0, act.calories));
        }
        return Array.from(byDate.values()).reduce((s, v) => s + v, 0);
      };

      const scores: { userId: string; calories: number }[] = [];
      for (const member of members) {
        const activities = await storage.getUserActivities(member.userId, month, year);
        scores.push({ userId: member.userId, calories: aggregateCalories(activities) });
      }

      scores.sort((a, b) => b.calories - a.calories);
      const rank = scores.findIndex((s) => s.userId === currentUserId) + 1;

      res.json({ rank, total: members.length });
    } catch (error) {
      console.error("Error fetching team my-rank:", error);
      res.status(500).json({ message: "Failed to fetch rank" });
    }
  });

  // Category leaderboard - separate rankings for calories, steps, and workouts
  // Shows only teammates (members from user's teams)
  app.get("/api/leaderboard/category/:category", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const category = req.params.category; // 'calories', 'steps', 'workouts'
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      if (!['calories', 'steps', 'workouts'].includes(category)) {
        return res.status(400).json({ message: "Invalid category. Use 'calories', 'steps', or 'workouts'" });
      }
      
      // Helper to aggregate activities by date
      const aggregateByDate = (activities: any[]) => {
        const byDate = new Map<string, { calories: number; steps: number; hasWorkout: boolean }>();
        for (const act of activities) {
          const existing = byDate.get(act.date);
          if (existing) {
            existing.calories = Math.max(existing.calories, act.calories);
            existing.steps = Math.max(existing.steps, act.steps);
            existing.hasWorkout = existing.hasWorkout || !!act.workoutType;
          } else {
            byDate.set(act.date, { 
              calories: act.calories, 
              steps: act.steps, 
              hasWorkout: !!act.workoutType 
            });
          }
        }
        return byDate;
      };
      
      // Get user's teams and collect all teammates (deduplicated)
      const userTeams = await storage.getUserTeams(currentUserId);
      const userStatsMap = new Map<string, any>();
      
      for (const team of userTeams) {
        const members = await storage.getTeamMembers(team.id);
        
        for (const member of members) {
          // Skip if already processed this user
          if (userStatsMap.has(member.userId)) {
            continue;
          }
          
          const user = await storage.getUser(member.userId);
          if (!user) continue;
          
          const activities = await storage.getUserActivities(user.id, month, year);
          const aggregated = aggregateByDate(activities);
          
          let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (!displayName && user.email) {
            const emailUsername = user.email.split('@')[0];
            displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
          }
          
          let totalCalories = 0;
          let totalSteps = 0;
          let workoutDays = 0;
          
          Array.from(aggregated.values()).forEach(dayData => {
            totalCalories += dayData.calories;
            totalSteps += dayData.steps;
            if (dayData.hasWorkout) workoutDays++;
          });
          
          // Only include users with activity
          if (totalCalories > 0 || totalSteps > 0 || workoutDays > 0) {
            userStatsMap.set(user.id, {
              userId: user.id,
              name: displayName || 'Unknown User',
              teamName: team.name,
              calories: totalCalories,
              steps: totalSteps,
              workouts: workoutDays,
              avatarId: user.avatarId,
              profileImageUrl: user.profileImageUrl,
            });
          }
        }
      }
      
      // Sort by the selected category
      const sortKey = category === 'workouts' ? 'workouts' : category;
      const sorted = Array.from(userStatsMap.values())
        .sort((a, b) => b[sortKey] - a[sortKey])
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          value: stat[sortKey],
          goalPercentage: category === 'calories' 
            ? Math.round((stat.calories / 30000) * 100)
            : category === 'steps'
            ? Math.round((stat.steps / 300000) * 100)
            : Math.round((stat.workouts / 20) * 100),
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching category leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch category leaderboard" });
    }
  });

  // Global leaderboard with location filtering
  app.get("/api/leaderboard/global", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const locationScope = req.query.scope as string || 'global'; // 'global', 'continent', 'country', 'region', 'town'
      const locationId = req.query.locationId as string | undefined;
      
      const aggregateByDate = (activities: any[]) => {
        const byDate = new Map<string, { calories: number; steps: number; hasWorkout: boolean }>();
        for (const act of activities) {
          const existing = byDate.get(act.date);
          if (existing) {
            existing.calories = Math.max(existing.calories, act.calories);
            existing.steps = Math.max(existing.steps, act.steps);
            existing.hasWorkout = existing.hasWorkout || !!act.workoutType;
          } else {
            byDate.set(act.date, { calories: act.calories, steps: act.steps, hasWorkout: !!act.workoutType });
          }
        }
        return byDate;
      };
      
      const allUsers = await storage.getAllUsers();
      const userStatsMap = new Map<string, any>();
      
      for (const user of allUsers) {
        // Filter by location scope if specified
        if (locationScope !== 'global' && locationId) {
          let matchesLocation = false;
          switch (locationScope) {
            case 'continent':
              matchesLocation = user.continentId === locationId;
              break;
            case 'country':
              matchesLocation = user.countryId === locationId;
              break;
            case 'region':
              matchesLocation = user.regionId === locationId;
              break;
            case 'town':
              matchesLocation = user.townId === locationId;
              break;
          }
          if (!matchesLocation) continue;
        }
        
        const activities = await storage.getUserActivities(user.id, month, year);
        const aggregated = aggregateByDate(activities);
        
        let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (!displayName && user.email) {
          const emailUsername = user.email.split('@')[0];
          displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
        }
        
        let totalCalories = 0;
        let totalSteps = 0;
        let workoutDays = 0;
        
        Array.from(aggregated.values()).forEach(dayData => {
          totalCalories += dayData.calories;
          totalSteps += dayData.steps;
          if (dayData.hasWorkout) workoutDays++;
        });
        
        // Get location names for display
        let locationDisplay = '';
        if (user.townId) {
          const town = await storage.getLocationById(user.townId);
          locationDisplay = town?.name || '';
        } else if (user.regionId) {
          const region = await storage.getLocationById(user.regionId);
          locationDisplay = region?.name || '';
        } else if (user.countryId) {
          const country = await storage.getLocationById(user.countryId);
          locationDisplay = country?.name || '';
        }
        
        userStatsMap.set(user.id, {
          userId: user.id,
          name: displayName || 'Unknown User',
          calories: totalCalories,
          steps: totalSteps,
          workouts: workoutDays,
          avatarId: user.avatarId,
          profileImageUrl: user.profileImageUrl,
          location: locationDisplay,
          continentId: user.continentId,
          countryId: user.countryId,
          regionId: user.regionId,
          townId: user.townId,
        });
      }
      
      const sorted = Array.from(userStatsMap.values())
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / 30000) * 100),
        }));
      
      res.json({
        scope: locationScope,
        locationId,
        leaderboard: sorted,
      });
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch global leaderboard" });
    }
  });

  // Goals/Quests API routes
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getUserGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getActiveGoals(userId);
      
      // Get all user activities once (no month filter to cover all goal date ranges)
      const allActivities = await storage.getUserActivities(userId);
      
      // Calculate current progress for each goal (read-only, no DB mutations)
      const goalsWithProgress = goals.map((goal) => {
        // Filter activities within goal date range
        const relevantActivities = allActivities.filter(a => 
          a.date >= goal.startDate && a.date <= goal.endDate
        );
        
        // Aggregate by date using max-per-day logic to avoid double-counting
        const byDate = new Map<string, { calories: number; steps: number; hasWorkout: boolean }>();
        for (const act of relevantActivities) {
          const existing = byDate.get(act.date);
          if (existing) {
            existing.calories = Math.max(existing.calories, act.calories);
            existing.steps = Math.max(existing.steps, act.steps);
            existing.hasWorkout = existing.hasWorkout || !!act.workoutType;
          } else {
            byDate.set(act.date, { 
              calories: act.calories, 
              steps: act.steps, 
              hasWorkout: !!act.workoutType 
            });
          }
        }
        
        let currentValue = 0;
        Array.from(byDate.values()).forEach(dayData => {
          if (goal.category === 'calories') currentValue += dayData.calories;
          else if (goal.category === 'steps') currentValue += dayData.steps;
          else if (goal.category === 'workouts' && dayData.hasWorkout) currentValue++;
        });
        
        const isCompleted = currentValue >= goal.targetValue;
        
        return {
          ...goal,
          currentValue,
          isCompleted: goal.isCompleted || isCompleted,
          progressPercentage: Math.min(100, Math.round((currentValue / goal.targetValue) * 100)),
        };
      });
      
      res.json(goalsWithProgress);
    } catch (error) {
      console.error("Error fetching active goals:", error);
      res.status(500).json({ message: "Failed to fetch active goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { goalType, category, targetValue } = req.body;
      
      if (!['daily', 'weekly'].includes(goalType)) {
        return res.status(400).json({ message: "Goal type must be 'daily' or 'weekly'" });
      }
      if (!['calories', 'steps', 'workouts'].includes(category)) {
        return res.status(400).json({ message: "Category must be 'calories', 'steps', or 'workouts'" });
      }
      if (!targetValue || targetValue <= 0) {
        return res.status(400).json({ message: "Target value must be positive" });
      }
      
      // Calculate start and end dates
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      let endDate: string;
      
      if (goalType === 'daily') {
        endDate = startDate;
      } else {
        // Weekly: end date is 6 days from start (7 days total)
        const end = new Date(today);
        end.setDate(end.getDate() + 6);
        endDate = end.toISOString().split('T')[0];
      }
      
      // Check for existing active goal with same type and category
      const existingGoals = await storage.getActiveGoals(userId);
      const duplicate = existingGoals.find(
        g => g.goalType === goalType && g.category === category && !g.isCompleted
      );
      
      if (duplicate) {
        return res.status(400).json({ 
          message: `You already have an active ${goalType} ${category} goal. Complete or wait for it to expire first.` 
        });
      }
      
      const goal = await storage.createGoal({
        userId,
        goalType,
        category,
        targetValue,
        startDate,
        endDate,
      });
      
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Get smart goal suggestions based on user's activity history
  app.get("/api/goals/suggested", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get activities from the last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all activities (we'll filter by date)
      const allActivities = await storage.getUserActivities(userId);
      
      // Filter to last 30 days and aggregate by date
      const recentActivities = allActivities.filter(a => {
        const actDate = new Date(a.date);
        return actDate >= thirtyDaysAgo && actDate <= now;
      });
      
      // Aggregate by date to avoid double-counting
      const byDate = new Map<string, { calories: number; steps: number; hasWorkout: boolean }>();
      for (const act of recentActivities) {
        const existing = byDate.get(act.date);
        if (existing) {
          existing.calories = Math.max(existing.calories, act.calories || 0);
          existing.steps = Math.max(existing.steps, act.steps || 0);
          existing.hasWorkout = existing.hasWorkout || !!act.workoutType;
        } else {
          byDate.set(act.date, {
            calories: act.calories || 0,
            steps: act.steps || 0,
            hasWorkout: !!act.workoutType,
          });
        }
      }
      
      const daysWithData = byDate.size;
      
      // Calculate averages - only use actual days with data
      let totalCalories = 0;
      let totalSteps = 0;
      let workoutDays = 0;
      
      byDate.forEach(day => {
        totalCalories += day.calories;
        totalSteps += day.steps;
        // Count workout day if has explicit workout OR any activity (calories/steps)
        if (day.hasWorkout || day.calories > 0 || day.steps > 0) workoutDays++;
      });
      
      // Only calculate averages if we have actual data
      const avgCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
      const avgSteps = daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0;
      const avgWorkoutDays = daysWithData > 0 ? Math.round((workoutDays / daysWithData) * 7) : 0; // Weekly estimate
      
      // Classify activity level based on average calories
      let activityLevel: 'beginner' | 'moderate' | 'active' | 'athlete';
      let activityDescription: string;
      
      if (daysWithData < 3) {
        // Not enough data to classify - use default
        activityLevel = 'beginner';
        activityDescription = 'Getting Started';
      } else if (avgCalories < 300) {
        activityLevel = 'beginner';
        activityDescription = 'Getting Started';
      } else if (avgCalories < 600) {
        activityLevel = 'moderate';
        activityDescription = 'Moderately Active';
      } else if (avgCalories < 1000) {
        activityLevel = 'active';
        activityDescription = 'Very Active';
      } else {
        activityLevel = 'athlete';
        activityDescription = 'Athlete Level';
      }
      
      // Calculate suggested goals
      let suggestedCalories: number;
      let suggestedSteps: number;
      let suggestedWorkouts: number;
      
      if (daysWithData < 3) {
        // Not enough data - use baseline goals for moderate activity
        suggestedCalories = 500;
        suggestedSteps = 8000;
        suggestedWorkouts = 3;
      } else {
        // Set goals 15% above current average to encourage growth
        const growthFactor = 1.15;
        suggestedCalories = Math.round((avgCalories * growthFactor) / 50) * 50; // Round to nearest 50
        suggestedSteps = Math.round((avgSteps * growthFactor) / 500) * 500; // Round to nearest 500
        suggestedWorkouts = Math.min(7, Math.max(1, avgWorkoutDays + 1));
        
        // Apply minimum thresholds based on activity level
        if (activityLevel === 'beginner') {
          suggestedCalories = Math.max(suggestedCalories, 300);
          suggestedSteps = Math.max(suggestedSteps, 5000);
        } else if (activityLevel === 'moderate') {
          suggestedCalories = Math.max(suggestedCalories, 500);
          suggestedSteps = Math.max(suggestedSteps, 8000);
        } else if (activityLevel === 'active') {
          suggestedCalories = Math.max(suggestedCalories, 700);
          suggestedSteps = Math.max(suggestedSteps, 10000);
        } else {
          suggestedCalories = Math.max(suggestedCalories, 1000);
          suggestedSteps = Math.max(suggestedSteps, 12000);
        }
      }
      
      // Get today's progress
      const today = now.toISOString().split('T')[0];
      const todayData = byDate.get(today) || { calories: 0, steps: 0, hasWorkout: false };
      
      res.json({
        activityLevel,
        activityDescription,
        daysAnalyzed: daysWithData,
        averages: {
          calories: avgCalories,
          steps: avgSteps,
          workoutsPerWeek: avgWorkoutDays,
        },
        suggestedGoals: {
          dailyCalories: suggestedCalories,
          dailySteps: suggestedSteps,
          weeklyWorkouts: suggestedWorkouts,
        },
        todayProgress: {
          calories: todayData.calories,
          steps: todayData.steps,
          hasWorkout: todayData.hasWorkout,
        },
      });
    } catch (error) {
      console.error("Error calculating suggested goals:", error);
      res.status(500).json({ message: "Failed to calculate suggested goals" });
    }
  });

  // Dashboard stats route - uses global ranking based on current month (resets on 1st)
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      // Helper function to aggregate activities by date (prevents double-counting when user has both manual + health entries)
      // Takes the MAX of each metric per day across all sources
      const aggregateByDate = (activities: any[]) => {
        const byDate = new Map<string, { calories: number; steps: number; hasWorkout: boolean }>();
        for (const act of activities) {
          const existing = byDate.get(act.date);
          const actCalories = act.calories || 0;
          const actSteps = act.steps || 0;
          if (existing) {
            // Take the maximum for each metric to avoid double-counting
            existing.calories = Math.max(existing.calories, actCalories);
            existing.steps = Math.max(existing.steps, actSteps);
            // Any day with any activity counts as a workout day
            existing.hasWorkout = existing.hasWorkout || !!act.workoutType || actCalories > 0 || actSteps > 0;
          } else {
            byDate.set(act.date, { 
              calories: actCalories, 
              steps: actSteps, 
              // Any day with any activity counts as a workout day
              hasWorkout: !!act.workoutType || actCalories > 0 || actSteps > 0 
            });
          }
        }
        return byDate;
      };
      
      // Today's date string in UTC — used to exclude future-dated rows and to
      // avoid applying the BMR-noise filter to today's partial-day data.
      const todayStr = now.toISOString().split('T')[0];

      // Get activities for current month only (resets on 1st of each month)
      const activities = await storage.getUserActivities(userId, month, year);
      const aggregated = aggregateByDate(activities);

      // Apply the same BMR-noise filter used by the daily-breakdown chart:
      // past completed days with fewer than 50 kcal are essentially rest days
      // (BMR estimation noise). Zero them out so the monthly total and the
      // per-day chart always agree.  Today's partial-day value is never filtered.
      aggregated.forEach((dayData, dateKey) => {
        if (dateKey > todayStr) {
          // Future-dated row (device timezone ahead of UTC): treat as zero
          dayData.calories = 0;
          dayData.steps = 0;
          dayData.hasWorkout = false;
        } else if (dateKey < todayStr && dayData.calories > 0 && dayData.calories < 50) {
          dayData.calories = 0;
          dayData.hasWorkout = dayData.steps > 0; // keep workout flag if steps present
        }
      });

      // Sum up the aggregated values
      let totalCalories = 0;
      let totalSteps = 0;
      let workoutCount = 0;
      Array.from(aggregated.values()).forEach(dayData => {
        totalCalories += dayData.calories;
        totalSteps += dayData.steps;
        if (dayData.hasWorkout) workoutCount++;
      });
      
      // Calculate global rank based on current month (not last 30 days)
      // This ensures leaderboard resets on the 1st of each month
      const allUsers = await storage.getAllUsers();
      const userCaloriesMap: Map<string, number> = new Map();
      
      // Calculate calories for each user for current month only (also using aggregation)
      // Apply the same noise filter (<50 kcal past days) so rank is based on the same
      // numbers the user sees on their own stat card.
      for (const user of allUsers) {
        const userActivities = await storage.getUserActivities(user.id, month, year);
        const userAggregated = aggregateByDate(userActivities);
        let userCalories = 0;
        Array.from(userAggregated.entries()).forEach(([dateKey, dayData]) => {
          let cal = dayData.calories;
          if (dateKey > todayStr) {
            cal = 0; // future-dated row
          } else if (dateKey < todayStr && cal > 0 && cal < 50) {
            cal = 0; // BMR noise on past completed days
          }
          userCalories += cal;
        });
        if (userCalories > 0) {
          userCaloriesMap.set(user.id, userCalories);
        }
      }
      
      // Sort users by calories and find current user's rank
      const sortedUsers = Array.from(userCaloriesMap.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const userRank = sortedUsers.findIndex(([id]) => id === userId) + 1;
      const totalActiveUsers = sortedUsers.length;
      
      // Calculate percentile (0 if no rank)
      let percentile = 0;
      if (userRank > 0 && totalActiveUsers > 0) {
        percentile = Math.round((userRank / totalActiveUsers) * 100);
      }
      
      // Calculate trend by comparing to last month
      const lastMonth = month === 1 ? 12 : month - 1;
      const lastYear = month === 1 ? year - 1 : year;
      const lastMonthActivities = await storage.getUserActivities(userId, lastMonth, lastYear);
      const lastMonthAggregated = aggregateByDate(lastMonthActivities);
      
      let lastMonthCalories = 0;
      let lastMonthSteps = 0;
      Array.from(lastMonthAggregated.values()).forEach(dayData => {
        lastMonthCalories += dayData.calories;
        lastMonthSteps += dayData.steps;
      });
      
      // Calculate percentage changes
      const caloriesTrend = lastMonthCalories > 0 
        ? Math.round(((totalCalories - lastMonthCalories) / lastMonthCalories) * 100) 
        : (totalCalories > 0 ? 100 : 0);
      const stepsTrend = lastMonthSteps > 0 
        ? Math.round(((totalSteps - lastMonthSteps) / lastMonthSteps) * 100) 
        : (totalSteps > 0 ? 100 : 0);
      
      // Get personal bests
      const personalBestsData = await storage.getUserPersonalBests(userId);
      const personalBestsMap: { [key: string]: number } = {};
      personalBestsData.forEach(pb => {
        personalBestsMap[pb.metric] = pb.value;
      });
      
      // Check and update personal bests for all days in current month
      // Use aggregated data to get accurate daily totals (max per day across all entries)
      for (const [dateStr, dayData] of Array.from(aggregated.entries())) {
        const dayCalories = dayData.calories;
        const daySteps = dayData.steps;
        const dayScore = dayCalories + daySteps;
        
        // Update personal bests if new records
        if (dayCalories > (personalBestsMap['daily_calories'] || 0)) {
          await storage.upsertPersonalBest({ userId, metric: 'daily_calories', value: dayCalories, metadata: { date: dateStr } });
          personalBestsMap['daily_calories'] = dayCalories;
        }
        if (daySteps > (personalBestsMap['daily_steps'] || 0)) {
          await storage.upsertPersonalBest({ userId, metric: 'daily_steps', value: daySteps, metadata: { date: dateStr } });
          personalBestsMap['daily_steps'] = daySteps;
        }
        if (dayScore > (personalBestsMap['daily_score'] || 0)) {
          await storage.upsertPersonalBest({ userId, metric: 'daily_score', value: dayScore, metadata: { date: dateStr } });
          personalBestsMap['daily_score'] = dayScore;
        }
      }
      
      // Get badges
      const badges = await storage.getUserBadges(userId);
      
      res.json({
        calories: totalCalories,
        steps: totalSteps,
        workouts: workoutCount,
        rank: userRank > 0 ? userRank : (totalCalories > 0 ? sortedUsers.length + 1 : 0),
        totalActiveUsers,
        percentile,
        currentMonth: month,
        currentYear: year,
        caloriesTrend,
        stepsTrend,
        personalBests: personalBestsMap,
        badgeCount: badges.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Progress chart route
  app.get("/api/progress/chart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      const activities = await storage.getUserActivities(userId, month, year);
      
      // First aggregate by date to prevent double-counting (take max per day)
      const byDate = new Map<string, number>();
      for (const act of activities) {
        const existing = byDate.get(act.date) || 0;
        byDate.set(act.date, Math.max(existing, act.calories));
      }
      
      // Group by week
      const weeklyData: { [key: string]: number } = {};
      Array.from(byDate.entries()).forEach(([dateStr, calories]) => {
        const date = new Date(dateStr);
        const weekNum = Math.ceil(date.getDate() / 7);
        const weekKey = `Week ${weekNum}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + calories;
      });
      
      const chartData = Object.entries(weeklyData).map(([date, calories]) => ({
        date,
        calories,
      }));
      
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching progress chart:", error);
      res.status(500).json({ message: "Failed to fetch progress chart" });
    }
  });

  app.get("/api/stats/calorie-diagnostics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      const todayActivities = await storage.getUserActivitiesForDate(userId, today);
      const todayCalories = todayActivities
        .filter((a: any) => a.type === 'calories')
        .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
      
      res.json({
        diagnostics: [
          { dataType: 'active-calories', value: 0, status: 'server n/a' },
          { dataType: 'calories', value: Math.round(todayCalories), status: 'ok' },
          { dataType: 'total-calories', value: 0, status: 'server n/a' }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calorie diagnostics" });
    }
  });

  // Daily breakdown route - for detailed stat views (calories/steps)
  app.get("/api/stats/daily-breakdown", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const metric = req.query.metric as string; // 'calories' or 'steps'
      
      if (!metric || (metric !== 'calories' && metric !== 'steps')) {
        return res.status(400).json({ message: "Invalid metric. Must be 'calories' or 'steps'" });
      }
      
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      // Get all activities for the current month
      const activities = await storage.getUserActivities(userId, month, year);
      
      // Get first day of month
      const firstDayOfMonth = new Date(year, month - 1, 1);
      
      // Calculate end of range: either end of month or 30 days from start
      const startDate = new Date(firstDayOfMonth);
      const endDate = new Date(firstDayOfMonth);
      endDate.setDate(endDate.getDate() + 29); // 30 days total (0-29)
      
      // Build today's date string using LOCAL date parts to avoid UTC-offset issues
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Build month-boundary strings via date arithmetic on LOCAL midnight dates
      // (avoids toISOString() UTC-shift for UTC- users)
      const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDateStr   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Group activities by date - take MAX per day to avoid double-counting from multiple sources
      const dailyData: { [key: string]: number } = {};

      // Initialise every calendar day in the month up to (and including) today
      for (let day = 1; day <= lastDay; day++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dateKey > todayStr) break;
        dailyData[dateKey] = 0;
      }

      // Take the maximum value for each day — compare date STRINGS, not Date objects,
      // to avoid UTC-midnight vs local-midnight mismatches for UTC- timezone users.
      activities.forEach(activity => {
        const dateKey = activity.date; // already "YYYY-MM-DD"
        if (dateKey >= startDateStr && dateKey <= todayStr && dateKey in dailyData) {
          const value = metric === 'calories' ? activity.calories : activity.steps;
          dailyData[dateKey] = Math.max(dailyData[dateKey] || 0, value);
        }
      });

      // For calories: past completed days below 50 kcal are within BMR estimation
      // noise (population-average BMR varies widely person-to-person).  Treat them
      // as rest days so they don't clutter the chart with meaningless micro-bars.
      // Today's partial-day value is always kept as-is.
      if (metric === 'calories') {
        for (const dateKey of Object.keys(dailyData)) {
          if (dateKey < todayStr && dailyData[dateKey] > 0 && dailyData[dateKey] < 50) {
            dailyData[dateKey] = 0;
          }
        }
      }
      
      // Convert to array format for charts.  Days with a zero value are omitted
      // unless they are today (so today always appears, even when no data has
      // synced yet).
      // Parse day number from the "YYYY-MM-DD" string directly — avoids UTC-midnight
      // misinterpretation when Date objects are used (e.g. new Date("2026-04-01")
      // is local March 31 for UTC-5 users, causing getDate() to return 31 not 1).
      const chartData = Object.entries(dailyData)
        .filter(([date, value]) => value > 0 || date === todayStr)
        .map(([date, value]) => ({
          date: parseInt(date.split('-')[2], 10).toString(), // day of month, no leading zero
          fullDate: date,
          value,
        }))
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
      
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching daily breakdown:", error);
      res.status(500).json({ message: "Failed to fetch daily breakdown" });
    }
  });

  // Workout calendar route - for calendar view of workout days
  app.get("/api/stats/workout-calendar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      // Get all activities for the current month
      const activities = await storage.getUserActivities(userId, month, year);
      
      // Group activities by date and check if there are workouts
      const workoutDays = activities
        .filter(activity => activity.workoutType) // Only activities with workout types
        .map(activity => ({
          date: activity.date,
          workoutType: activity.workoutType,
          calories: activity.calories,
        }));
      
      // Get unique workout days
      const uniqueDays = Array.from(new Set(workoutDays.map(w => w.date)))
        .map(date => {
          const dayWorkouts = workoutDays.filter(w => w.date === date);
          return {
            date,
            workouts: dayWorkouts.length,
            types: Array.from(new Set(dayWorkouts.map(w => w.workoutType))),
            totalCalories: dayWorkouts.reduce((sum, w) => sum + w.calories, 0),
          };
        });
      
      res.json(uniqueDays);
    } catch (error) {
      console.error("Error fetching workout calendar:", error);
      res.status(500).json({ message: "Failed to fetch workout calendar" });
    }
  });

  // Badge routes
  app.get("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const newBadges: string[] = [];
      
      // Get user activities
      const activities = await storage.getUserActivities(userId);
      
      // Check for first activity badge
      if (activities.length > 0 && !(await storage.hasBadge(userId, 'first_activity'))) {
        await storage.awardBadge({ userId, badgeType: 'first_activity' });
        newBadges.push('first_activity');
      }
      
      // Check for streak badges (consecutive days)
      const sortedDates = [...new Set(activities.map(a => a.date))].sort();
      let maxStreak = 0;
      let currentStreak = 1;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      
      if (maxStreak >= 3 && !(await storage.hasBadge(userId, 'streak_3'))) {
        await storage.awardBadge({ userId, badgeType: 'streak_3', metadata: { streak: maxStreak } });
        newBadges.push('streak_3');
      }
      if (maxStreak >= 7 && !(await storage.hasBadge(userId, 'streak_7'))) {
        await storage.awardBadge({ userId, badgeType: 'streak_7', metadata: { streak: maxStreak } });
        newBadges.push('streak_7');
      }
      if (maxStreak >= 30 && !(await storage.hasBadge(userId, 'streak_30'))) {
        await storage.awardBadge({ userId, badgeType: 'streak_30', metadata: { streak: maxStreak } });
        newBadges.push('streak_30');
      }
      
      // Check for milestone badges
      const totalSteps = activities.reduce((sum, a) => sum + a.steps, 0);
      const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);
      const workoutDays = new Set(activities.filter(a => a.workoutType).map(a => a.date)).size;
      
      // Find max daily steps
      const dailySteps = new Map<string, number>();
      activities.forEach(a => {
        const existing = dailySteps.get(a.date) || 0;
        dailySteps.set(a.date, Math.max(existing, a.steps));
      });
      const maxDailySteps = Math.max(...Array.from(dailySteps.values()), 0);
      
      if (maxDailySteps >= 10000 && !(await storage.hasBadge(userId, 'steps_10k'))) {
        await storage.awardBadge({ userId, badgeType: 'steps_10k', metadata: { steps: maxDailySteps } });
        newBadges.push('steps_10k');
      }
      
      // Find max daily calories
      const dailyCalories = new Map<string, number>();
      activities.forEach(a => {
        const existing = dailyCalories.get(a.date) || 0;
        dailyCalories.set(a.date, Math.max(existing, a.calories));
      });
      const maxDailyCalories = Math.max(...Array.from(dailyCalories.values()), 0);
      
      if (maxDailyCalories >= 1000 && !(await storage.hasBadge(userId, 'calories_1k'))) {
        await storage.awardBadge({ userId, badgeType: 'calories_1k', metadata: { calories: maxDailyCalories } });
        newBadges.push('calories_1k');
      }
      
      if (workoutDays >= 10 && !(await storage.hasBadge(userId, 'workouts_10'))) {
        await storage.awardBadge({ userId, badgeType: 'workouts_10', metadata: { workouts: workoutDays } });
        newBadges.push('workouts_10');
      }
      
      res.json({ newBadges, totalBadges: (await storage.getUserBadges(userId)).length });
    } catch (error) {
      console.error("Error checking badges:", error);
      res.status(500).json({ message: "Failed to check badges" });
    }
  });

  // Personal bests route
  app.get("/api/personal-bests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const personalBests = await storage.getUserPersonalBests(userId);
      res.json(personalBests);
    } catch (error) {
      console.error("Error fetching personal bests:", error);
      res.status(500).json({ message: "Failed to fetch personal bests" });
    }
  });

  // Notification routes
  app.post("/api/notifications/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Always regenerate notifications to ensure we have the complete set
      // The database unique constraint on (userId, date, type) handles duplicates via upsert
      console.log(`[Notifications] Generating notifications for ${userId}`);
      
      // Get user info
      const user = await storage.getUser(userId);
      const displayName = user?.firstName || 'there';
      
      // Get today's activities
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const activities = await storage.getUserActivities(userId, currentMonth, currentYear);
      const todayActivities = activities.filter(a => a.date === today);
      const todayCalories = todayActivities.reduce((sum, a) => sum + a.calories, 0);
      const monthlyCalories = activities.reduce((sum, a) => sum + a.calories, 0);
      
      // Get user's teams
      const userTeams = await storage.getUserTeams(userId);
      
      // Analyze performance for personalized messages
      const notifications: any[] = [];
      
      // Daily goal motivation (always show)
      const dailyGoal = 1000; // calories per day goal
      const dailyProgress = Math.round((todayCalories / dailyGoal) * 100);
      
      let dailyMessage = '';
      if (dailyProgress === 0) {
        dailyMessage = `Good morning ${displayName}! A new day, a fresh start! Every step counts toward your fitness goals. Let's make today amazing!`;
      } else if (dailyProgress < 50) {
        dailyMessage = `Hey ${displayName}! You're ${dailyProgress}% to your daily goal. You've got this! Small steps lead to big achievements.`;
      } else if (dailyProgress < 100) {
        dailyMessage = `Awesome work ${displayName}! You're ${dailyProgress}% there. Keep that momentum going - you're so close!`;
      } else {
        dailyMessage = `Incredible ${displayName}! You've smashed your daily goal! You're an inspiration to your team. Keep it up!`;
      }
      
      await storage.createNotification({
        userId,
        message: dailyMessage,
        type: 'daily_goal',
        date: today,
      });
      notifications.push({ message: dailyMessage, type: 'daily_goal' });
      
      // Check if ahead of team members
      console.log(`[Notifications] Checking team leadership for user ${userId}, teams:`, userTeams.length);
      for (const team of userTeams) {
        const members = await storage.getTeamMembers(team.id);
        console.log(`[Notifications] Team ${team.name} has ${members.length} members`);
        const memberStats = await Promise.all(
          members.map(async (member) => {
            const memberActivities = await storage.getUserActivities(member.userId, currentMonth, currentYear);
            const calories = memberActivities.reduce((sum, a) => sum + a.calories, 0);
            console.log(`[Notifications] Member ${member.userId} has ${calories} calories`);
            return {
              userId: member.userId,
              calories,
            };
          })
        );
        
        const userStat = memberStats.find(s => s.userId === userId);
        const othersCalories = memberStats.filter(s => s.userId !== userId).map(s => s.calories);
        console.log(`[Notifications] User calories: ${userStat?.calories}, Others: ${JSON.stringify(othersCalories)}`);
        
        if (userStat && othersCalories.length > 0) {
          const maxOther = Math.max(...othersCalories);
          console.log(`[Notifications] Comparing ${userStat.calories} > ${maxOther}`);
          if (userStat.calories > maxOther && userStat.calories > 0) {
            const teamLeaderMessage = `Great work ${displayName}! You're leading ${team.name} this month. Your dedication is inspiring your teammates. Keep setting the pace!`;
            await storage.createNotification({
              userId,
              message: teamLeaderMessage,
              type: 'team_leader',
              date: today,
            });
            notifications.push({ message: teamLeaderMessage, type: 'team_leader' });
            console.log(`[Notifications] Created team_leader notification for ${userId}`);
            break; // Only show once
          }
        }
      }
      
      // Check if user has burned most calories globally
      const allTeams = await storage.getAllTeams();
      const allUsersCalories = [];
      const userSet = new Set(); // Deduplicate users across teams
      console.log(`[Notifications] Checking global leadership across ${allTeams.length} teams`);
      for (const team of allTeams) {
        const members = await storage.getTeamMembers(team.id);
        for (const member of members) {
          if (!userSet.has(member.userId)) {
            userSet.add(member.userId);
            const memberActivities = await storage.getUserActivities(member.userId, currentMonth, currentYear);
            const totalCalories = memberActivities.reduce((sum, a) => sum + a.calories, 0);
            allUsersCalories.push({ userId: member.userId, calories: totalCalories });
          }
        }
      }
      
      const sortedUsers = allUsersCalories.sort((a, b) => b.calories - a.calories);
      console.log(`[Notifications] Global rankings:`, sortedUsers.slice(0, 3));
      if (sortedUsers.length > 0 && sortedUsers[0].userId === userId && sortedUsers[0].calories > 0) {
        const globalMessage = `UNSTOPPABLE ${displayName}! You've burned the most calories across ALL teams this month! You're a true fitness champion!`;
        await storage.createNotification({
          userId,
          message: globalMessage,
          type: 'global_leader',
          date: today,
        });
        notifications.push({ message: globalMessage, type: 'global_leader' });
        console.log(`[Notifications] Created global_leader notification for ${userId}`);
      }
      
      res.json(notifications);
    } catch (error) {
      console.error("Error generating notifications:", error);
      res.status(500).json({ message: "Failed to generate notifications" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      const notifications = await storage.getUserNotifications(userId, today);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // WebAuthn/Passkey configuration
  const RP_NAME = "FayaFlex";
  const RP_ID = process.env.REPLIT_DEV_DOMAIN ? 
    process.env.REPLIT_DEV_DOMAIN.split(':')[0] : 
    "localhost";
  const getOrigin = (req: any) => {
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    return `http://localhost:5000`;
  };

  // Passkey Registration - Start
  app.post("/api/passkey/register/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get existing passkeys for this user
      const userPasskeys = await storage.getUserPasskeys(userId);

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.username || user.email,
        userDisplayName: user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          (user.username || user.email),
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required',
        },
        excludeCredentials: userPasskeys.map(pk => ({
          id: Buffer.from(pk.id, 'base64'),
          type: 'public-key',
        })),
        supportedAlgorithmIDs: [-7, -257],
      });

      // Store challenge in session
      req.session.passkeyChallenge = options.challenge;
      
      res.json(options);
    } catch (error: any) {
      console.error("Error starting passkey registration:", error);
      res.status(500).json({ message: error.message || "Failed to start passkey registration" });
    }
  });

  // Passkey Registration - Verify
  app.post("/api/passkey/register/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { response } = req.body as { response: RegistrationResponseJSON };
      const expectedChallenge = req.session.passkeyChallenge;

      if (!expectedChallenge) {
        return res.status(400).json({ message: "No challenge found in session" });
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: RP_ID,
      });

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        // Store passkey in database
        await storage.createPasskey({
          id: Buffer.from(registrationInfo.credentialID).toString('base64'),
          userId,
          credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
          counter: registrationInfo.counter,
          deviceType: registrationInfo.credentialDeviceType,
          backedUp: registrationInfo.credentialBackedUp,
          transports: JSON.stringify(response.response.transports || []),
        });

        // Clear challenge from session
        delete req.session.passkeyChallenge;

        res.json({ verified: true });
      } else {
        res.status(400).json({ verified: false, message: "Verification failed" });
      }
    } catch (error: any) {
      console.error("Error verifying passkey registration:", error);
      res.status(500).json({ message: error.message || "Failed to verify passkey registration" });
    }
  });

  // Passkey Authentication - Start
  app.post("/api/passkey/login/start", async (req: any, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Don't reveal if user exists
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const userPasskeys = await storage.getUserPasskeys(user.id);
      
      if (userPasskeys.length === 0) {
        return res.status(400).json({ message: "No passkeys registered for this user" });
      }

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        timeout: 60000,
        allowCredentials: userPasskeys.map(pk => ({
          id: Buffer.from(pk.id, 'base64'),
          type: 'public-key',
          transports: pk.transports ? JSON.parse(pk.transports) : undefined,
        })),
        userVerification: 'required',
      });

      // Store challenge and username in session
      req.session.passkeyChallenge = options.challenge;
      req.session.passkeyUsername = username;

      res.json(options);
    } catch (error: any) {
      console.error("Error starting passkey authentication:", error);
      res.status(500).json({ message: error.message || "Failed to start passkey authentication" });
    }
  });

  // Get user's passkeys
  app.get("/api/passkeys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userPasskeys = await storage.getUserPasskeys(userId);
      res.json(userPasskeys);
    } catch (error: any) {
      console.error("Error fetching passkeys:", error);
      res.status(500).json({ message: error.message || "Failed to fetch passkeys" });
    }
  });

  // Passkey Authentication - Verify
  app.post("/api/passkey/login/verify", async (req: any, res) => {
    try {
      const { response } = req.body as { response: AuthenticationResponseJSON };
      const expectedChallenge = req.session.passkeyChallenge;
      const username = req.session.passkeyUsername;

      if (!expectedChallenge || !username) {
        return res.status(400).json({ message: "No challenge or username found in session" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Get the passkey from storage
      const passkey = await storage.getPasskeyById(Buffer.from(response.id, 'base64').toString('base64'));

      if (!passkey || passkey.userId !== user.id) {
        return res.status(400).json({ message: "Passkey not found or doesn't belong to this user" });
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: Buffer.from(passkey.id, 'base64'),
          credentialPublicKey: Buffer.from(passkey.credentialPublicKey, 'base64'),
          counter: Number(passkey.counter),
        },
      });

      const { verified, authenticationInfo } = verification;

      if (verified) {
        // Update counter
        await storage.updatePasskeyCounter(passkey.id, authenticationInfo.newCounter);

        // Log user in
        req.login(user, (err: any) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }

          // Clear challenge from session
          delete req.session.passkeyChallenge;
          delete req.session.passkeyUsername;

          // User can see their own email when logging in
          res.json({ verified: true, user: sanitizeUserForDisplay(user, user.id) });
        });
      } else {
        res.status(400).json({ verified: false, message: "Verification failed" });
      }
    } catch (error: any) {
      console.error("Error verifying passkey authentication:", error);
      res.status(500).json({ message: error.message || "Failed to verify passkey authentication" });
    }
  });

  // ============ CHALLENGE ROUTES ============

  // Create a new challenge
  app.post("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const { opponentId, teamId, metric, durationDays, message } = req.body;
      const challengerId = req.user.id;

      if (!opponentId || !metric || !durationDays) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (challengerId === opponentId) {
        return res.status(400).json({ message: "You cannot challenge yourself" });
      }

      const shareTeam = await storage.doUsersShareTeam(challengerId, opponentId);
      if (!shareTeam) {
        return res.status(400).json({ message: "You can only challenge teammates" });
      }

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const challenge = await storage.createChallenge({
        challengerId,
        opponentId,
        teamId: teamId || null,
        metric,
        durationDays,
        startDate,
        endDate,
        message: message || null,
      });

      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Get all challenges for the current user
  app.get("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const status = req.query.status as string | undefined;
      
      const challenges = await storage.getUserChallenges(userId, status);
      
      const enrichedChallenges = await Promise.all(challenges.map(async (challenge) => {
        const challenger = await storage.getUser(challenge.challengerId);
        const opponent = await storage.getUser(challenge.opponentId);
        const winner = challenge.winnerId ? await storage.getUser(challenge.winnerId) : null;
        
        let currentScores = { challengerScore: 0, opponentScore: 0 };
        if (challenge.status === 'active') {
          try {
            currentScores = await storage.getChallengeScores(challenge.id);
          } catch (e) {}
        }
        
        return {
          ...challenge,
          challenger: challenger ? sanitizeUserForDisplay(challenger, userId) : null,
          opponent: opponent ? sanitizeUserForDisplay(opponent, userId) : null,
          winner: winner ? sanitizeUserForDisplay(winner, userId) : null,
          currentScores: challenge.status === 'active' ? currentScores : null,
        };
      }));
      
      res.json(enrichedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Get pending challenges for the current user (invites to respond to)
  app.get("/api/challenges/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenges = await storage.getPendingChallengesForUser(userId);
      
      const enrichedChallenges = await Promise.all(challenges.map(async (challenge) => {
        const challenger = await storage.getUser(challenge.challengerId);
        return {
          ...challenge,
          challenger: challenger ? sanitizeUserForDisplay(challenger, userId) : null,
        };
      }));
      
      res.json(enrichedChallenges);
    } catch (error) {
      console.error("Error fetching pending challenges:", error);
      res.status(500).json({ message: "Failed to fetch pending challenges" });
    }
  });

  // Get a specific challenge
  app.get("/api/challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenge = await storage.getChallenge(req.params.id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengerId !== userId && challenge.opponentId !== userId) {
        return res.status(403).json({ message: "You are not part of this challenge" });
      }
      
      const challenger = await storage.getUser(challenge.challengerId);
      const opponent = await storage.getUser(challenge.opponentId);
      const winner = challenge.winnerId ? await storage.getUser(challenge.winnerId) : null;
      
      let currentScores = { challengerScore: 0, opponentScore: 0 };
      if (challenge.status === 'active') {
        currentScores = await storage.getChallengeScores(challenge.id);
      }
      
      res.json({
        ...challenge,
        challenger: challenger ? sanitizeUserForDisplay(challenger, userId) : null,
        opponent: opponent ? sanitizeUserForDisplay(opponent, userId) : null,
        winner: winner ? sanitizeUserForDisplay(winner, userId) : null,
        currentScores,
      });
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  // Respond to a challenge (accept/decline)
  app.post("/api/challenges/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accept } = req.body;
      const challenge = await storage.getChallenge(req.params.id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.opponentId !== userId) {
        return res.status(403).json({ message: "Only the challenged user can respond" });
      }
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({ message: "Challenge is no longer pending" });
      }
      
      const updated = await storage.respondToChallenge(challenge.id, accept);
      res.json(updated);
    } catch (error) {
      console.error("Error responding to challenge:", error);
      res.status(500).json({ message: "Failed to respond to challenge" });
    }
  });

  // Cancel a challenge (only challenger can cancel pending challenges)
  app.post("/api/challenges/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenge = await storage.getChallenge(req.params.id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengerId !== userId) {
        return res.status(403).json({ message: "Only the challenger can cancel" });
      }
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({ message: "Can only cancel pending challenges" });
      }
      
      const updated = await storage.cancelChallenge(challenge.id);
      res.json(updated);
    } catch (error) {
      console.error("Error cancelling challenge:", error);
      res.status(500).json({ message: "Failed to cancel challenge" });
    }
  });

  // Get current scores for an active challenge
  app.get("/api/challenges/:id/scores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenge = await storage.getChallenge(req.params.id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengerId !== userId && challenge.opponentId !== userId) {
        return res.status(403).json({ message: "You are not part of this challenge" });
      }
      
      const scores = await storage.getChallengeScores(challenge.id);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching challenge scores:", error);
      res.status(500).json({ message: "Failed to fetch challenge scores" });
    }
  });

  // ============ END CHALLENGE ROUTES ============

  // ============ MESSAGE ROUTES ============

  // Get all conversations for the current user
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      
      // Sanitize partner data
      const sanitized = conversations.map(conv => ({
        ...conv,
        partner: conv.partner ? sanitizeUserForDisplay(conv.partner, userId) : null,
      }));
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Get conversation with a specific user
  app.get("/api/messages/conversation/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const partnerId = req.params.partnerId;
      
      // Check if they are teammates
      const areTeammates = await storage.doUsersShareTeam(userId, partnerId);
      if (!areTeammates) {
        return res.status(403).json({ message: "You can only message teammates" });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(userId, partnerId);
      
      const messages = await storage.getConversation(userId, partnerId);
      
      // Get partner info
      const partner = await storage.getUser(partnerId);
      
      res.json({
        messages: messages.reverse(), // Oldest first for chat display
        partner: partner ? sanitizeUserForDisplay(partner, userId) : null,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Send a message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, content } = req.body;
      
      if (!recipientId || !content?.trim()) {
        return res.status(400).json({ message: "Recipient and message content are required" });
      }
      
      // Check if they are teammates
      const areTeammates = await storage.doUsersShareTeam(senderId, recipientId);
      if (!areTeammates) {
        return res.status(403).json({ message: "You can only message teammates" });
      }
      
      const message = await storage.sendMessage(senderId, recipientId, content.trim());

      // Fire-and-forget push to recipient
      try {
        const sender = await storage.getUser(senderId);
        triggerDirectMessage({
          recipientUserId: recipientId,
          senderId,
          senderName: sender ? (sender.firstName || sender.username) : "A teammate",
          preview: content.trim(),
        });
      } catch (e) { console.error("[Push] DM trigger failed:", e); }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============ END MESSAGE ROUTES ============

  // ============ PUSH NOTIFICATION ROUTES ============

  // Public — frontend needs this to subscribe via Push API (web)
  app.get("/api/push/vapid-public-key", (_req, res) => {
    const key = getVapidPublicKey();
    if (!key) return res.status(503).json({ message: "Web push not configured" });
    res.json({ publicKey: key });
  });

  // Register or refresh a push token (called on app launch / after permission grant)
  app.post("/api/push/register", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]),
        webSubscription: z.any().optional(),
      });
      const data = schema.parse(req.body);
      const saved = await storage.upsertPushToken(userId, data);
      res.json({ success: true, id: saved.id });
    } catch (err: any) {
      console.error("[Push] register error:", err);
      res.status(400).json({ message: err.message || "Failed to register push token" });
    }
  });

  // Unregister a push token (e.g. on logout or when user disables notifications)
  app.delete("/api/push/token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const token = (req.query.token as string) || (req.body && req.body.token);
      if (!token) return res.status(400).json({ message: "Token required" });
      await storage.deletePushTokenByToken(userId, token);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Push] unregister error:", err);
      res.status(400).json({ message: err.message || "Failed to unregister token" });
    }
  });

  // Get current notification preferences (returns defaults if user has none set)
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const prefs = (user?.notificationPrefs as any) || DEFAULT_NOTIFICATION_PREFS;
      res.json({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to load preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = notificationPrefsSchema.partial().parse(req.body);
      const current = (await storage.getUser(userId))?.notificationPrefs as any || DEFAULT_NOTIFICATION_PREFS;
      const merged = { ...DEFAULT_NOTIFICATION_PREFS, ...current, ...data };
      await storage.updateNotificationPrefs(userId, merged);
      res.json(merged);
    } catch (err: any) {
      console.error("[Push] update prefs error:", err);
      res.status(400).json({ message: err.message || "Failed to update preferences" });
    }
  });

  // Test push (handy for verifying setup) — sends a test notification to all the caller's devices
  app.post("/api/push/test", isAuthenticated, async (req: any, res) => {
    try {
      const { sendPushToUser } = await import("./pushService");
      const tokens = await storage.getUserPushTokens(req.user.id);
      console.log(`[Push] /api/push/test for user=${req.user.id} tokenCount=${tokens.length} platforms=${tokens.map(t => t.platform).join(",")}`);
      if (tokens.length === 0) {
        return res.status(200).json({
          success: false,
          tokenCount: 0,
          message: "No push tokens registered for this user. The device has not sent its APNs/FCM token to the server yet.",
        });
      }
      await sendPushToUser(req.user.id, {
        type: "dailyReminder",
        title: "FayaFlex test notification",
        body: "If you can read this, push notifications are working!",
        url: "/",
      });
      res.json({ success: true, tokenCount: tokens.length, platforms: tokens.map(t => t.platform) });
    } catch (err: any) {
      console.error("[Push] /api/push/test error:", err);
      res.status(500).json({ message: err.message || "Test failed" });
    }
  });

  // Start the daily reminder cron job
  startPushCron();

  // ============ END PUSH NOTIFICATION ROUTES ============

  const httpServer = createServer(app);
  
  // Start cleanup job for old evidence (runs every hour)
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  console.log('[Cleanup] Initializing evidence cleanup job (runs every hour)');
  setInterval(async () => {
    console.log('[Cleanup] Running scheduled cleanup...');
    await cleanupOldEvidence();
  }, CLEANUP_INTERVAL);
  
  // Run cleanup immediately on startup
  console.log('[Cleanup] Running initial cleanup on startup...');
  cleanupOldEvidence().catch(err => console.error('[Cleanup] Initial cleanup failed:', err));

  // Challenge completion job (runs every hour)
  const CHALLENGE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
  console.log('[Challenges] Initializing challenge completion job (runs every hour)');
  
  const completeChallenges = async () => {
    try {
      const expiredChallenges = await storage.getActiveChallengesRequiringCompletion();
      console.log(`[Challenges] Found ${expiredChallenges.length} challenges to complete`);
      
      for (const challenge of expiredChallenges) {
        try {
          const scores = await storage.getChallengeScores(challenge.id);
          let winnerId: string | null = null;
          
          if (scores.challengerScore > scores.opponentScore) {
            winnerId = challenge.challengerId;
          } else if (scores.opponentScore > scores.challengerScore) {
            winnerId = challenge.opponentId;
          }
          
          await storage.completeChallenge(
            challenge.id, 
            winnerId, 
            scores.challengerScore, 
            scores.opponentScore
          );
          console.log(`[Challenges] Completed challenge ${challenge.id}, winner: ${winnerId || 'tie'}`);
        } catch (err) {
          console.error(`[Challenges] Error completing challenge ${challenge.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[Challenges] Error in challenge completion job:', err);
    }
  };
  
  setInterval(completeChallenges, CHALLENGE_CHECK_INTERVAL);
  
  // Run challenge completion immediately on startup
  console.log('[Challenges] Running initial challenge completion check...');
  completeChallenges().catch(err => console.error('[Challenges] Initial check failed:', err));

  // ============ AUTO MONTHLY WINNER CALCULATION ============
  // Runs every 5 minutes to check if it's time to calculate winners
  // Winners are calculated at 12:00 PM on the 1st of each month
  const WINNER_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  let lastWinnerCalculationMonth = -1; // Track to prevent duplicate calculations
  
  const autoCalculateMonthlyWinners = async () => {
    try {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const currentHour = now.getHours();
      const currentMonth = now.getMonth();
      
      // Only run on the 1st of the month between 12:00 and 12:59
      if (dayOfMonth !== 1 || currentHour !== 12) {
        return;
      }
      
      // Prevent running multiple times in the same month
      if (lastWinnerCalculationMonth === currentMonth) {
        return;
      }
      
      console.log('[VictoryWall] Starting automatic monthly winner calculation...');
      
      // Get previous month
      const prevDate = new Date(now);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const month = prevDate.getMonth() + 1; // 1-12
      const year = prevDate.getFullYear();
      
      // Get all active teams
      const allTeams = await storage.getAllTeams();
      const activeTeams = allTeams.filter(t => t.status === 'active');
      
      console.log(`[VictoryWall] Calculating winners for ${activeTeams.length} active teams for ${month}/${year}`);
      
      let successCount = 0;
      let skipCount = 0;
      
      for (const team of activeTeams) {
        try {
          // Check if winner already exists for this team/month
          const existingWinner = await storage.getMonthlyWinner(team.id, month, year);
          if (existingWinner) {
            skipCount++;
            continue;
          }
          
          // Get all team members and calculate their totals
          const members = await storage.getTeamMembers(team.id);
          const memberStats = [];
          
          for (const member of members) {
            const activities = await storage.getUserActivities(member.userId, month, year);
            const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
            
            if (totalCalories > 0) {
              memberStats.push({
                userId: member.userId,
                totalCalories,
              });
            }
          }
          
          if (memberStats.length === 0) {
            console.log(`[VictoryWall] Team ${team.name}: No activities for ${month}/${year}`);
            continue;
          }
          
          // Sort by calories and get winner
          memberStats.sort((a, b) => b.totalCalories - a.totalCalories);
          const winner = memberStats[0];
          
          // Create monthly winner record
          await storage.createMonthlyWinner({
            teamId: team.id,
            userId: winner.userId,
            month,
            year,
            totalCalories: winner.totalCalories,
          });
          
          const user = await storage.getUser(winner.userId);
          const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown';
          console.log(`[VictoryWall] Team ${team.name}: Winner is ${userName} with ${winner.totalCalories} calories`);
          successCount++;
        } catch (err) {
          console.error(`[VictoryWall] Error calculating winner for team ${team.id}:`, err);
        }
      }
      
      lastWinnerCalculationMonth = currentMonth;
      console.log(`[VictoryWall] Calculation complete: ${successCount} winners announced, ${skipCount} already calculated`);
    } catch (err) {
      console.error('[VictoryWall] Error in auto winner calculation:', err);
    }
  };
  
  console.log('[VictoryWall] Initializing automatic monthly winner calculation (12:00 PM on 1st of each month)');
  setInterval(autoCalculateMonthlyWinners, WINNER_CHECK_INTERVAL);
  
  // Check immediately on startup (in case server restarts on the 1st at noon)
  autoCalculateMonthlyWinners().catch(err => console.error('[VictoryWall] Initial check failed:', err));

  // ── Feed routes ─────────────────────────────────────────────────────────────

  // GET /api/feed — paginated feed for the current user (own + teammates' posts)
  app.get("/api/feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit  = Math.min(parseInt((req.query.limit  as string) || "30"), 50);
      const offset = parseInt((req.query.offset as string) || "0");
      const posts  = await storage.getFeed(userId, limit, offset);
      // Strip email from embedded user objects
      const sanitized = posts.map((p) => ({ ...p, user: sanitizeUserForDisplay(p.user, userId) }));
      res.json(sanitized);
    } catch (err) {
      console.error("[Feed] GET /api/feed error:", err);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // POST /api/feed/posts — create a new post
  app.post("/api/feed/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        content:  z.string().max(2000).default(""),
        imageUrl: z.string().nullable().optional(),
      });
      const { content, imageUrl } = schema.parse(req.body);
      if (!content.trim() && !imageUrl) {
        return res.status(400).json({ message: "Post must have text or an image" });
      }
      const post = await storage.createFeedPost(userId, content, imageUrl);
      res.status(201).json(post);
    } catch (err: any) {
      console.error("[Feed] POST /api/feed/posts error:", err);
      res.status(400).json({ message: err.message || "Failed to create post" });
    }
  });

  // DELETE /api/feed/posts/:id — delete own post
  app.delete("/api/feed/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteFeedPost(req.params.id, req.user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("[Feed] DELETE /api/feed/posts error:", err);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // POST /api/feed/posts/:id/like — toggle like
  app.post("/api/feed/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      const existing = await storage.getFeedPostLike(postId, userId);
      if (existing) {
        await storage.unlikeFeedPost(postId, userId);
        res.json({ liked: false });
      } else {
        await storage.likeFeedPost(postId, userId);
        res.json({ liked: true });
      }
    } catch (err) {
      console.error("[Feed] POST like error:", err);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // GET /api/feed/posts/:id/likers — list users who liked the post
  app.get("/api/feed/posts/:id/likers", isAuthenticated, async (req: any, res) => {
    try {
      const likers = await storage.getFeedPostLikers(req.params.id);
      const sanitized = likers.map((l) => ({
        id: l.id,
        username: l.username,
        firstName: l.firstName,
        lastName: l.lastName,
        profileImageUrl: l.profileImageUrl,
        avatarId: l.avatarId,
      }));
      res.json(sanitized);
    } catch (err) {
      console.error("[Feed] GET likers error:", err);
      res.status(500).json({ message: "Failed to load likers" });
    }
  });

  // GET /api/feed/posts/:id/comments
  app.get("/api/feed/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const comments = await storage.getFeedPostComments(req.params.id);
      const sanitized = comments.map((c) => ({ ...c, user: sanitizeUserForDisplay(c.user, req.user.id) }));
      res.json(sanitized);
    } catch (err) {
      console.error("[Feed] GET comments error:", err);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // POST /api/feed/posts/:id/comments
  app.post("/api/feed/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({ content: z.string().min(1).max(500) });
      const { content } = schema.parse(req.body);
      const comment = await storage.addFeedPostComment(req.params.id, req.user.id, content);
      res.status(201).json(comment);
    } catch (err: any) {
      console.error("[Feed] POST comment error:", err);
      res.status(400).json({ message: err.message || "Failed to add comment" });
    }
  });

  // DELETE /api/feed/posts/:postId/comments/:commentId
  app.delete("/api/feed/posts/:postId/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteFeedPostComment(req.params.commentId, req.user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("[Feed] DELETE comment error:", err);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // POST /api/upload/feed-image — upload image for a feed post
  app.post("/api/upload/feed-image", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const outputPath = await compressAndSaveFeedImage(req.file.buffer, req.file.originalname || 'feed-post');
      res.json({ url: outputPath });
    } catch (err) {
      console.error("[Feed] Image upload error:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  return httpServer;
}
