import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertActivitySchema, insertTeamSchema, locations } from "@shared/schema";
import { z } from "zod";
import { upload, compressAndSaveImage, compressAndSaveProfileImage, cleanupOldEvidence } from "./imageUpload";
import express from "express";
import path from "path";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";

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
      
      // Transform activities: convert workouts count to workoutType if not already set
      const transformedActivities = validatedData.activities.map(activity => ({
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
      
      // Calculate today's totals (take max per activity type to avoid double counting)
      let todayCalories = 0;
      let todaySteps = 0;
      let todayWorkouts = 0;
      
      for (const act of todayActivities) {
        // Take max values (health syncs may create multiple entries per day)
        todayCalories = Math.max(todayCalories, act.calories);
        todaySteps = Math.max(todaySteps, act.steps || 0);
        if (act.workoutCompleted) todayWorkouts = 1;
      }
      
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
      res.json({
        ...monthlyWinner,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown',
      });
    } catch (error: any) {
      console.error("Error calculating winner:", error);
      res.status(400).json({ message: error.message || "Failed to calculate winner" });
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

  // Profile image upload endpoint
  app.post("/api/upload/profile-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const userId = req.user.id;

      // Compress and save profile image
      const imagePath = await compressAndSaveProfileImage(req.file.buffer, userId);
      
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

  // Category leaderboard - separate rankings for calories, steps, and workouts
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
      
      // Get user's teams to show only teammates
      const userTeams = await storage.getUserTeams(currentUserId);
      const userStatsMap = new Map<string, any>();
      
      for (const team of userTeams) {
        const members = await storage.getTeamMembers(team.id);
        
        for (const member of members) {
          if (userStatsMap.has(member.userId)) continue;
          
          const activities = await storage.getUserActivities(member.userId, month, year);
          const aggregated = aggregateByDate(activities);
          const user = await storage.getUser(member.userId);
          
          if (user) {
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
            
            userStatsMap.set(user.id, {
              userId: user.id,
              name: displayName || 'Unknown User',
              teamName: team.name,
              calories: totalCalories,
              steps: totalSteps,
              workouts: workoutDays,
              avatarId: user.avatarId,
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
          if (existing) {
            // Take the maximum for each metric to avoid double-counting
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
      
      // Get activities for current month only (resets on 1st of each month)
      const activities = await storage.getUserActivities(userId, month, year);
      const aggregated = aggregateByDate(activities);
      
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
      for (const user of allUsers) {
        const userActivities = await storage.getUserActivities(user.id, month, year);
        const userAggregated = aggregateByDate(userActivities);
        let userCalories = 0;
        Array.from(userAggregated.values()).forEach(dayData => {
          userCalories += dayData.calories;
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
      
      // Calculate 30 days from beginning of month
      const startDate = new Date(firstDayOfMonth);
      const endDate = new Date(firstDayOfMonth);
      endDate.setDate(endDate.getDate() + 29); // 30 days total (0-29)
      
      // Group activities by date
      const dailyData: { [key: string]: number } = {};
      
      // Initialize all days with 0
      for (let d = new Date(startDate); d <= endDate && d <= now; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyData[dateKey] = 0;
      }
      
      // Sum up the metric for each day
      activities.forEach(activity => {
        const activityDate = new Date(activity.date);
        if (activityDate >= startDate && activityDate <= endDate) {
          const dateKey = activity.date;
          dailyData[dateKey] = (dailyData[dateKey] || 0) + (metric === 'calories' ? activity.calories : activity.steps);
        }
      });
      
      // Convert to array format for charts
      const chartData = Object.entries(dailyData)
        .map(([date, value]) => ({
          date: new Date(date).getDate().toString(), // Just the day number
          fullDate: date,
          value,
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
      
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
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============ END MESSAGE ROUTES ============

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
  
  return httpServer;
}
