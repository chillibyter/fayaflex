import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertActivitySchema, insertTeamSchema } from "@shared/schema";
import { z } from "zod";
import { upload, compressAndSaveImage, cleanupOldEvidence } from "./imageUpload";
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      
      res.json({ totalWorkouts, currentStreak });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
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
  // Personal leaderboard - only shows members from user's teams (deduplicated)
  app.get("/api/leaderboard/personal", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
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
              avatarId: user.avatarId,
              firstName: user.firstName,
              lastName: user.lastName,
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
      const currentUserId = req.user.id;
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

  // Dashboard stats route - uses global ranking based on last 30 days
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const activities = await storage.getUserActivities(userId, month, year);
      const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
      const totalSteps = activities.reduce((sum, act) => sum + act.steps, 0);
      const workoutCount = activities.length;
      
      // Calculate global rank based on last 30 days using a more efficient approach
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all users and their activities in one efficient query
      const allUsers = await storage.getAllUsers();
      const userCaloriesMap: Map<string, number> = new Map();
      
      // Calculate calories for each user
      for (const user of allUsers) {
        const allActivities = await storage.getUserActivities(user.id);
        const last30DaysActivities = allActivities.filter(act => {
          const actDate = new Date(act.date);
          return actDate >= thirtyDaysAgo;
        });
        const userCalories = last30DaysActivities.reduce((sum, act) => sum + act.calories, 0);
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
      
      res.json({
        calories: totalCalories,
        steps: totalSteps,
        workouts: workoutCount,
        rank: userRank > 0 ? userRank : (totalCalories > 0 ? sortedUsers.length + 1 : 0),
        totalActiveUsers,
        percentile,
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
  const RP_NAME = "Ultimate Fitness Challenge";
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
  
  return httpServer;
}
