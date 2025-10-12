import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, insertTeamSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body - allow firstName and lastName updates
      const updateUserSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
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

  // Device connection routes
  app.get("/api/devices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get device connections for supported providers
      const providers = ['apple_health', 'garmin', 'android_health'];
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
      const userId = req.user.claims.sub;
      
      const toggleSchema = z.object({
        provider: z.enum(['apple_health', 'garmin', 'android_health']),
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
      const userId = req.user.claims.sub;
      
      const syncSchema = z.object({
        provider: z.enum(['apple_health', 'garmin', 'android_health']),
      });
      
      const validatedData = syncSchema.parse(req.body);
      
      // Check if device is connected
      const existingConnection = await storage.getDeviceConnection(userId, validatedData.provider);
      if (!existingConnection || !existingConnection.isConnected) {
        return res.status(400).json({ message: "Device is not connected" });
      }
      
      // MVP: Simulate syncing by updating lastSyncAt timestamp
      // In production, this would fetch real data from the health app API
      const connection = await storage.upsertDeviceConnection({
        userId,
        provider: validatedData.provider,
        isConnected: true,
        lastSyncAt: new Date(),
      });
      
      res.json(connection);
    } catch (error: any) {
      console.error("Error syncing device:", error);
      res.status(400).json({ message: error.message || "Failed to sync device" });
    }
  });

  // Profile routes
  app.get("/api/profile/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
      
      res.json({ totalWorkouts, currentStreak });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Team routes
  app.post("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const teams = await storage.getUserTeams(userId);
      
      // Enrich teams with member counts
      const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          return {
            ...team,
            memberCount: members.length,
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
      const userId = req.user.claims.sub;
      
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

      const team = await storage.getTeamByInviteCode(inviteCode);
      if (!team) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

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
      const members = await storage.getTeamMembers(req.params.id);
      
      // Get user details for each member
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            user,
          };
        })
      );
      
      res.json(membersWithDetails);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Activity routes
  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertActivitySchema.parse(req.body);
      
      const activity = await storage.createActivity(validatedData, userId);
      res.json(activity);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const activities = await storage.getUserActivities(userId, month, year);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard/personal", isAuthenticated, async (req: any, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      const teams = await storage.getAllTeams();
      const userStats: any[] = [];
      
      for (const team of teams) {
        const members = await storage.getTeamMembers(team.id);
        
        for (const member of members) {
          const activities = await storage.getUserActivities(member.userId, month, year);
          const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
          const user = await storage.getUser(member.userId);
          
          if (user) {
            // Extract name from email if firstName and lastName are not available
            let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            
            if (!displayName && user.email) {
              // Use email username as name if no name is available
              const emailUsername = user.email.split('@')[0];
              displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
            }
            
            userStats.push({
              userId: user.id,
              name: displayName || 'Unknown User',
              teamName: team.name,
              calories: totalCalories,
            });
          }
        }
      }
      
      // Sort by calories and add rank
      const sorted = userStats
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / 30000) * 100), // Assuming 30000 cal goal
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/leaderboard/teams", isAuthenticated, async (req: any, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      const teams = await storage.getAllTeams();
      const teamStats = [];
      
      for (const team of teams) {
        const activities = await storage.getTeamActivities(team.id, month, year);
        const members = await storage.getTeamMembers(team.id);
        const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
        
        teamStats.push({
          teamId: team.id,
          name: team.name,
          teamName: `${members.length} members`,
          calories: totalCalories,
          memberCount: members.length,
        });
      }
      
      // Sort by calories and add rank
      const sorted = teamStats
        .sort((a, b) => b.calories - a.calories)
        .map((stat, index) => ({
          ...stat,
          rank: index + 1,
          goalPercentage: Math.round((stat.calories / (stat.memberCount * 30000)) * 100),
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const activities = await storage.getUserActivities(userId, month, year);
      const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
      const totalSteps = activities.reduce((sum, act) => sum + act.steps, 0);
      const workoutCount = activities.length;
      
      // Calculate rank
      const leaderboard = await storage.getAllTeams();
      const allUsers: any[] = [];
      
      for (const team of leaderboard) {
        const members = await storage.getTeamMembers(team.id);
        for (const member of members) {
          const memberActivities = await storage.getUserActivities(member.userId, month, year);
          const memberCalories = memberActivities.reduce((sum, act) => sum + act.calories, 0);
          allUsers.push({ userId: member.userId, calories: memberCalories });
        }
      }
      
      const sorted = allUsers.sort((a, b) => b.calories - a.calories);
      const userRank = sorted.findIndex(u => u.userId === userId) + 1;
      
      res.json({
        calories: totalCalories,
        steps: totalSteps,
        workouts: workoutCount,
        rank: userRank || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Progress chart route
  app.get("/api/progress/chart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      const activities = await storage.getUserActivities(userId, month, year);
      
      // Group by week
      const weeklyData: { [key: string]: number } = {};
      activities.forEach(activity => {
        const date = new Date(activity.date);
        const weekNum = Math.ceil(date.getDate() / 7);
        const weekKey = `Week ${weekNum}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + activity.calories;
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

  const httpServer = createServer(app);
  return httpServer;
}
