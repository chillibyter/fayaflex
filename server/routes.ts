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
      
      // Validate request body - allow firstName, lastName, and avatarId updates
      const updateUserSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        avatarId: z.string().optional(),
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
        activities: z.array(z.object({
          date: z.string(), // YYYY-MM-DD format
          calories: z.number().int().min(0),
          steps: z.number().int().min(0),
          workoutType: z.string().optional(),
        })).max(100), // Limit to 100 activities per sync
      });
      
      const validatedData = syncSchema.parse(req.body);
      
      // Check if device is connected
      const existingConnection = await storage.getDeviceConnection(userId, validatedData.provider);
      if (!existingConnection || !existingConnection.isConnected) {
        return res.status(400).json({ message: "Device is not connected" });
      }
      
      // Sync activities from health device
      const results = await storage.syncHealthActivities(
        userId,
        validatedData.provider,
        validatedData.activities
      );
      
      // Update device connection lastSyncAt
      await storage.upsertDeviceConnection({
        userId,
        provider: validatedData.provider,
        isConnected: true,
        lastSyncAt: new Date(),
      });
      
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

  // Teammate profile routes (require shared team membership)
  app.get("/api/users/:userId/profile", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
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
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:userId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
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
  // Personal leaderboard - only shows members from user's teams (deduplicated)
  app.get("/api/leaderboard/personal", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
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
            
            userStatsMap.set(user.id, {
              userId: user.id,
              name: displayName || 'Unknown User',
              teamName: team.name,
              calories: totalCalories,
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
      
      const teams = await storage.getAllTeams();
      const teamStats = [];
      
      // Calculate days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (const team of teams) {
        const activities = await storage.getTeamActivities(team.id, month, year);
        const members = await storage.getTeamMembers(team.id);
        const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
        
        // Calculate average daily calories per user
        const avgDailyCaloriesPerUser = members.length > 0 
          ? totalCalories / (members.length * daysInMonth)
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
      const currentUserId = req.user.claims.sub;
      const teamId = req.params.teamId;
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Check if user is member of this team
      const isMember = await storage.isUserInTeam(currentUserId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "You can only view leaderboards for your teams" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      const memberStats: any[] = [];
      
      for (const member of members) {
        const activities = await storage.getUserActivities(member.userId, month, year);
        const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
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

  // Dashboard stats route - uses global ranking based on last 30 days
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const activities = await storage.getUserActivities(userId, month, year);
      const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
      const totalSteps = activities.reduce((sum, act) => sum + act.steps, 0);
      const workoutCount = activities.length;
      
      // Calculate global rank based on last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allTeams = await storage.getAllTeams();
      const allUsers: any[] = [];
      
      for (const team of allTeams) {
        const members = await storage.getTeamMembers(team.id);
        for (const member of members) {
          // Get all activities for last 30 days
          const allActivities = await storage.getUserActivities(member.userId);
          const last30DaysActivities = allActivities.filter(act => {
            const actDate = new Date(act.date);
            return actDate >= thirtyDaysAgo;
          });
          const memberCalories = last30DaysActivities.reduce((sum, act) => sum + act.calories, 0);
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

  // Notification routes
  app.post("/api/notifications/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      
      const notifications = await storage.getUserNotifications(userId, today);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
