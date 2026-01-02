import {
  users,
  teams,
  teamMembers,
  activities,
  deviceConnections,
  notifications,
  passkeys,
  monthlyWinners,
  activityReactions,
  activityComments,
  userBadges,
  personalBests,
  userGoals,
  passwordResetTokens,
  locations,
  challenges,
  messages,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type Activity,
  type InsertActivity,
  type DeviceConnection,
  type Notification,
  type InsertNotification,
  type Passkey,
  type InsertPasskey,
  type MonthlyWinner,
  type InsertMonthlyWinner,
  type ActivityReaction,
  type InsertActivityReaction,
  type ActivityComment,
  type InsertActivityComment,
  type UserBadge,
  type InsertUserBadge,
  type PersonalBest,
  type InsertPersonalBest,
  type UserGoal,
  type InsertUserGoal,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Location,
  type Challenge,
  type InsertChallenge,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getLegacyUserByFirstName(firstName: string): Promise<User | undefined>;
  getLegacyUserByFullName(firstName: string, lastName: string): Promise<User | undefined>;
  createUser(user: Partial<UpsertUser> & { username: string; password: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByInviteCode(code: string): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  archiveTeam(teamId: string): Promise<Team>;
  getTeamLastActivityDate(teamId: string): Promise<Date | null>;

  // Team member operations
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  isUserInTeam(userId: string, teamId: string): Promise<boolean>;
  removeTeamMember(userId: string, teamId: string): Promise<void>;
  doUsersShareTeam(userId1: string, userId2: string): Promise<boolean>;

  // Activity operations
  createActivity(activity: InsertActivity, userId: string): Promise<Activity>;
  getUserActivities(userId: string, month?: number, year?: number): Promise<Activity[]>;
  getUserActivitiesForDate(userId: string, date: string): Promise<Activity[]>;
  getTeamActivities(teamId: string, month?: number, year?: number): Promise<Activity[]>;
  getAllActivitiesForMonth(month: number, year: number): Promise<Activity[]>;
  syncHealthActivities(
    userId: string,
    provider: string,
    activities: Array<{ date: string; calories: number; steps: number; workoutType?: string }>
  ): Promise<{ created: number; updated: number; skipped: number }>;

  // Device connection operations
  getDeviceConnection(userId: string, provider: string): Promise<DeviceConnection | undefined>;
  upsertDeviceConnection(connection: Partial<DeviceConnection> & { userId: string; provider: string }): Promise<DeviceConnection>;

  // Passkey operations
  createPasskey(passkey: InsertPasskey): Promise<Passkey>;
  getUserPasskeys(userId: string): Promise<Passkey[]>;
  getPasskeyById(id: string): Promise<Passkey | undefined>;
  updatePasskeyCounter(id: string, counter: number): Promise<void>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, date: string): Promise<Notification[]>;
  deleteUserNotifications(userId: string, date: string): Promise<void>;

  // Monthly winners operations (Victory Wall)
  createMonthlyWinner(winner: InsertMonthlyWinner): Promise<MonthlyWinner>;
  getTeamMonthlyWinners(teamId: string): Promise<MonthlyWinner[]>;
  getMonthlyWinner(teamId: string, month: number, year: number): Promise<MonthlyWinner | undefined>;

  // Activity reactions operations (thumbs up/down)
  addReaction(reaction: InsertActivityReaction): Promise<ActivityReaction>;
  removeReaction(activityId: string, userId: string): Promise<void>;
  getUserReaction(activityId: string, userId: string): Promise<ActivityReaction | undefined>;
  getActivityReactions(activityId: string): Promise<{ thumbsUp: number; thumbsDown: number; userReaction?: 'thumbs_up' | 'thumbs_down' }>;

  // Activity comments operations
  addComment(comment: InsertActivityComment): Promise<ActivityComment>;
  getActivityComments(activityId: string): Promise<(ActivityComment & { user: User })[]>;
  deleteComment(commentId: string, userId: string): Promise<void>;

  // Badge operations
  awardBadge(badge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  hasBadge(userId: string, badgeType: string): Promise<boolean>;

  // Personal best operations
  upsertPersonalBest(best: InsertPersonalBest): Promise<PersonalBest>;
  getUserPersonalBests(userId: string): Promise<PersonalBest[]>;
  getPersonalBest(userId: string, metric: string): Promise<PersonalBest | undefined>;

  // Goal operations
  createGoal(goal: InsertUserGoal): Promise<UserGoal>;
  getUserGoals(userId: string): Promise<UserGoal[]>;
  getActiveGoals(userId: string): Promise<UserGoal[]>;
  updateGoalProgress(goalId: string, currentValue: number): Promise<UserGoal>;
  completeGoal(goalId: string): Promise<UserGoal>;

  // Password reset operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(tokenId: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // Location operations
  getLocations(type?: string, parentId?: string): Promise<Location[]>;
  getLocationById(id: string): Promise<Location | undefined>;
  getLocationHierarchy(id: string): Promise<Location[]>;
  searchCities(query: string, limit?: number): Promise<{ city: Location; hierarchy: Location[] }[]>;
  createLocationHierarchyFromGeoNames(data: {
    geonameId: number;
    cityName: string;
    regionName: string;
    countryName: string;
    countryCode: string;
    continentCode: string;
    continentName: string;
  }): Promise<{ continentId: string; countryId: string; regionId: string; townId: string }>;

  // Challenge operations
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  getUserChallenges(userId: string, status?: string): Promise<Challenge[]>;
  getPendingChallengesForUser(userId: string): Promise<Challenge[]>;
  respondToChallenge(challengeId: string, accept: boolean): Promise<Challenge>;
  cancelChallenge(challengeId: string): Promise<Challenge>;
  completeChallenge(challengeId: string, winnerId: string | null, challengerScore: number, opponentScore: number): Promise<Challenge>;
  getActiveChallengesRequiringCompletion(): Promise<Challenge[]>;
  getChallengeScores(challengeId: string): Promise<{ challengerScore: number; opponentScore: number }>;

  // Message operations
  sendMessage(senderId: string, recipientId: string, content: string): Promise<Message>;
  getConversation(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
  getUserConversations(userId: string): Promise<{ partnerId: string; partner: User | null; lastMessage: Message; unreadCount: number }[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find user by ID (primary identifier) if provided
    if (userData.id) {
      const [existingById] = await db
        .select()
        .from(users)
        .where(eq(users.id, userData.id));
      
      if (existingById) {
        // User exists by ID - update their data (handles email changes)
        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updatedUser;
      }
    }
    
    // User doesn't exist by ID - check for email conflict
    if (userData.email) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingByEmail) {
        // Email already in use by different user - use existing user
        // and update with new data (this handles test scenarios with changing subs)
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName: userData.firstName || existingByEmail.firstName,
            lastName: userData.lastName || existingByEmail.lastName,
            profileImageUrl: userData.profileImageUrl || existingByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        return updatedUser;
      }
    }
    
    // No conflicts - create new user with onConflict for concurrency safety
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete all user-related data in the correct order (child tables first)
    // This ensures foreign key constraints are respected
    
    // Get user data first to clean up uploaded files
    const user = await db.select().from(users).where(eq(users.id, id));
    const userData = user[0];
    
    // Handle teams owned by this user - delete the team and all associated data
    const ownedTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.ownerId, id));
    const teamIds = ownedTeams.map(t => t.id);
    
    if (teamIds.length > 0) {
      // Delete monthly winners for these teams
      await db.delete(monthlyWinners).where(inArray(monthlyWinners.teamId, teamIds));
      // Delete team members for these teams
      await db.delete(teamMembers).where(inArray(teamMembers.teamId, teamIds));
      // Delete challenges associated with these teams
      await db.delete(challenges).where(inArray(challenges.teamId, teamIds));
      // Delete the teams themselves
      await db.delete(teams).where(inArray(teams.id, teamIds));
    }
    
    // Delete user's activities first (needed before deleting reactions/comments on them)
    const userActivities = await db.select({ id: activities.id, attachmentUrl: activities.attachmentUrl }).from(activities).where(eq(activities.userId, id));
    const activityIds = userActivities.map(a => a.id);
    
    if (activityIds.length > 0) {
      // Delete reactions on user's activities
      await db.delete(activityReactions).where(inArray(activityReactions.activityId, activityIds));
      // Delete comments on user's activities
      await db.delete(activityComments).where(inArray(activityComments.activityId, activityIds));
    }
    
    // Delete user's reactions on other activities
    await db.delete(activityReactions).where(eq(activityReactions.userId, id));
    // Delete user's comments on other activities
    await db.delete(activityComments).where(eq(activityComments.userId, id));
    // Delete user's activities
    await db.delete(activities).where(eq(activities.userId, id));
    // Delete user's team memberships
    await db.delete(teamMembers).where(eq(teamMembers.userId, id));
    // Delete user's passkeys
    await db.delete(passkeys).where(eq(passkeys.userId, id));
    // Delete user's notifications
    await db.delete(notifications).where(eq(notifications.userId, id));
    // Delete user's device connections
    await db.delete(deviceConnections).where(eq(deviceConnections.userId, id));
    // Delete user's badges
    await db.delete(userBadges).where(eq(userBadges.userId, id));
    // Delete user's personal bests
    await db.delete(personalBests).where(eq(personalBests.userId, id));
    // Delete user's goals
    await db.delete(userGoals).where(eq(userGoals.userId, id));
    // Delete user's password reset tokens
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    // Delete user's messages (sent and received)
    await db.delete(messages).where(eq(messages.senderId, id));
    await db.delete(messages).where(eq(messages.recipientId, id));
    // Delete user's challenges (as challenger or opponent)
    await db.delete(challenges).where(eq(challenges.challengerId, id));
    await db.delete(challenges).where(eq(challenges.opponentId, id));
    // Delete user's monthly winner records
    await db.delete(monthlyWinners).where(eq(monthlyWinners.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
    
    // Clean up uploaded files after database deletion
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    
    // Helper to normalize stored paths (strip leading slash for join)
    const normalizeUploadPath = (url: string) => {
      // Remove leading slash so path.join works correctly
      return url.startsWith('/') ? url.substring(1) : url;
    };
    
    // Delete profile image if exists
    if (userData?.profileImageUrl && userData.profileImageUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), normalizeUploadPath(userData.profileImageUrl));
        await fs.unlink(filePath);
        console.log(`Deleted profile image: ${filePath}`);
      } catch (err) {
        // File may not exist, ignore error
        console.log(`Could not delete profile image: ${userData.profileImageUrl}`);
      }
    }
    
    // Delete activity evidence images
    for (const activity of userActivities) {
      if (activity.attachmentUrl && activity.attachmentUrl.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), normalizeUploadPath(activity.attachmentUrl));
          await fs.unlink(filePath);
          console.log(`Deleted evidence image: ${filePath}`);
        } catch (err) {
          // File may not exist, ignore error
          console.log(`Could not delete evidence image: ${activity.attachmentUrl}`);
        }
      }
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getLegacyUserByFirstName(firstName: string): Promise<User | undefined> {
    const matches = await db
      .select()
      .from(users)
      .where(
        and(
          sql`LOWER(${users.firstName}) = LOWER(${firstName})`,
          sql`${users.username} IS NULL`,
          sql`${users.password} IS NULL`
        )
      );
    
    if (matches.length === 0) {
      return undefined;
    }
    
    if (matches.length > 1) {
      throw new Error("Multiple accounts found with this first name. Please provide your last name to identify your account.");
    }
    
    return matches[0];
  }

  async getLegacyUserByFullName(firstName: string, lastName: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          sql`LOWER(${users.firstName}) = LOWER(${firstName})`,
          sql`LOWER(${users.lastName}) = LOWER(${lastName})`,
          sql`${users.username} IS NULL`,
          sql`${users.password} IS NULL`
        )
      );
    return user;
  }

  async createUser(userData: Partial<UpsertUser> & { username: string; password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
        email: userData.email || `${userData.username}@temp.local`, // Email is required, use temp if not provided
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        avatarId: userData.avatarId,
      })
      .returning();
    return user;
  }

  // Team operations
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const inviteCode = randomBytes(6).toString("hex");
    const [team] = await db
      .insert(teams)
      .values({ ...teamData, inviteCode })
      .returning();
    return team;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByInviteCode(code: string): Promise<Team | undefined> {
    console.log(`[Storage] Looking for team with invite code: "${code}"`);
    
    // Try exact match first (most common case - codes are lowercase hex)
    let [team] = await db.select().from(teams).where(eq(teams.inviteCode, code.toLowerCase()));
    if (team) {
      console.log(`[Storage] Found team with lowercase match: ${team.name}`);
      return team;
    }
    
    // Fallback: try exact match with original case
    [team] = await db.select().from(teams).where(eq(teams.inviteCode, code));
    if (team) {
      console.log(`[Storage] Found team with exact match: ${team.name}`);
      return team;
    }
    
    // Debug: list all teams and their invite codes
    const allTeams = await db.select({ id: teams.id, name: teams.name, inviteCode: teams.inviteCode }).from(teams).limit(10);
    console.log(`[Storage] No team found. Available teams:`, allTeams.map(t => ({ name: t.name, code: t.inviteCode })));
    
    return undefined;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        ownerId: teams.ownerId,
        inviteCode: teams.inviteCode,
        status: teams.status,
        createdAt: teams.createdAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(
        and(
          eq(teamMembers.userId, userId),
          eq(teams.status, "active") // Only show active teams
        )
      );
    
    return userTeams;
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async archiveTeam(teamId: string): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ status: "archived" })
      .where(eq(teams.id, teamId))
      .returning();
    return team;
  }

  async getTeamLastActivityDate(teamId: string): Promise<Date | null> {
    // Get all team members
    const members = await this.getTeamMembers(teamId);
    if (members.length === 0) return null;

    const memberIds = members.map(m => m.userId);

    // Get the most recent activity from any team member
    const [result] = await db
      .select({ lastActivity: sql<Date>`MAX(${activities.createdAt})` })
      .from(activities)
      .where(inArray(activities.userId, memberIds));

    return result?.lastActivity || null;
  }

  // Team member operations
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    return teamMember;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }

  async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
    return !!member;
  }

  async removeTeamMember(userId: string, teamId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
  }

  async doUsersShareTeam(userId1: string, userId2: string): Promise<boolean> {
    // Get teams for both users and check if they share any
    const user1Teams = await this.getUserTeams(userId1);
    const user2Teams = await this.getUserTeams(userId2);
    
    const user1TeamIds = new Set(user1Teams.map(t => t.id));
    return user2Teams.some(t => user1TeamIds.has(t.id));
  }

  // Activity operations
  async createActivity(activityData: InsertActivity, userId: string): Promise<Activity> {
    console.log('[Storage] createActivity called with:', { activityData, userId });
    const [activity] = await db
      .insert(activities)
      .values({ ...activityData, userId })
      .returning();
    console.log('[Storage] Activity inserted, id:', activity.id);
    return activity;
  }

  async getUserActivities(userId: string, month?: number, year?: number): Promise<Activity[]> {
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      return await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            sql`${activities.date} >= ${startDate.toISOString().split('T')[0]}`,
            sql`${activities.date} <= ${endDate.toISOString().split('T')[0]}`
          )
        )
        .orderBy(desc(activities.date));
    }

    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.date));
  }

  async getUserActivitiesForDate(userId: string, date: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.date, date)
        )
      );
  }

  async getTeamActivities(teamId: string, month?: number, year?: number): Promise<Activity[]> {
    const members = await this.getTeamMembers(teamId);
    const memberIds = members.map(m => m.userId);

    if (memberIds.length === 0) return [];

    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      return await db
        .select()
        .from(activities)
        .where(
          and(
            inArray(activities.userId, memberIds),
            sql`${activities.date} >= ${startDate.toISOString().split('T')[0]}`,
            sql`${activities.date} <= ${endDate.toISOString().split('T')[0]}`
          )
        )
        .orderBy(desc(activities.date));
    }

    return await db
      .select()
      .from(activities)
      .where(inArray(activities.userId, memberIds))
      .orderBy(desc(activities.date));
  }

  async getAllActivitiesForMonth(month: number, year: number): Promise<Activity[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return await db
      .select()
      .from(activities)
      .where(
        and(
          sql`${activities.date} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${activities.date} <= ${endDate.toISOString().split('T')[0]}`
        )
      )
      .orderBy(desc(activities.date));
  }

  async syncHealthActivities(
    userId: string,
    provider: string,
    incomingActivities: Array<{ date: string; calories: number; steps: number; workoutType?: string }>
  ): Promise<{ created: number; updated: number; skipped: number }> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const incoming of incomingActivities) {
      // Check if activity already exists for this date and source
      const [existing] = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.date, incoming.date),
            eq(activities.source, provider)
          )
        );

      if (existing) {
        // Check if values have changed
        if (
          existing.calories !== incoming.calories ||
          existing.steps !== incoming.steps ||
          existing.workoutType !== (incoming.workoutType || null)
        ) {
          // Update existing activity
          await db
            .update(activities)
            .set({
              calories: incoming.calories,
              steps: incoming.steps,
              workoutType: incoming.workoutType || null,
            })
            .where(eq(activities.id, existing.id));
          updated++;
        } else {
          // No changes, skip
          skipped++;
        }
      } else {
        // Create new activity
        await db.insert(activities).values({
          userId,
          date: incoming.date,
          calories: incoming.calories,
          steps: incoming.steps,
          workoutType: incoming.workoutType || null,
          source: provider,
        });
        created++;
      }
    }

    return { created, updated, skipped };
  }

  // Device connection operations
  async getDeviceConnection(userId: string, provider: string): Promise<DeviceConnection | undefined> {
    const [connection] = await db
      .select()
      .from(deviceConnections)
      .where(and(eq(deviceConnections.userId, userId), eq(deviceConnections.provider, provider)));
    return connection;
  }

  async upsertDeviceConnection(connectionData: Partial<DeviceConnection> & { userId: string; provider: string }): Promise<DeviceConnection> {
    const [connection] = await db
      .insert(deviceConnections)
      .values(connectionData)
      .onConflictDoUpdate({
        target: [deviceConnections.userId, deviceConnections.provider],
        set: {
          ...connectionData,
        },
      })
      .returning();
    return connection;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .onConflictDoUpdate({
        target: [notifications.userId, notifications.date, notifications.type],
        set: {
          message: notificationData.message,
        },
      })
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, date: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.date, date)));
  }

  async deleteUserNotifications(userId: string, date: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.date, date)));
  }

  // User operations (additional)
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  // Passkey operations
  async createPasskey(passkeyData: InsertPasskey): Promise<Passkey> {
    const [passkey] = await db
      .insert(passkeys)
      .values(passkeyData)
      .returning();
    return passkey;
  }

  async getUserPasskeys(userId: string): Promise<Passkey[]> {
    return await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, userId));
  }

  async getPasskeyById(id: string): Promise<Passkey | undefined> {
    const [passkey] = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.id, id));
    return passkey;
  }

  async updatePasskeyCounter(id: string, counter: number): Promise<void> {
    await db
      .update(passkeys)
      .set({ counter })
      .where(eq(passkeys.id, id));
  }

  // Monthly winners operations (Victory Wall)
  async createMonthlyWinner(winnerData: InsertMonthlyWinner): Promise<MonthlyWinner> {
    const [winner] = await db
      .insert(monthlyWinners)
      .values(winnerData)
      .onConflictDoUpdate({
        target: [monthlyWinners.teamId, monthlyWinners.month, monthlyWinners.year],
        set: {
          userId: winnerData.userId,
          totalCalories: winnerData.totalCalories,
        },
      })
      .returning();
    return winner;
  }

  async getTeamMonthlyWinners(teamId: string): Promise<MonthlyWinner[]> {
    return await db
      .select()
      .from(monthlyWinners)
      .where(eq(monthlyWinners.teamId, teamId))
      .orderBy(desc(monthlyWinners.year), desc(monthlyWinners.month));
  }

  async getMonthlyWinner(teamId: string, month: number, year: number): Promise<MonthlyWinner | undefined> {
    const [winner] = await db
      .select()
      .from(monthlyWinners)
      .where(
        and(
          eq(monthlyWinners.teamId, teamId),
          eq(monthlyWinners.month, month),
          eq(monthlyWinners.year, year)
        )
      );
    return winner;
  }

  // Activity reactions operations
  async addReaction(reactionData: InsertActivityReaction): Promise<ActivityReaction> {
    // First, try to find existing reaction
    const existing = await this.getUserReaction(reactionData.activityId, reactionData.userId);
    
    if (existing) {
      // Update existing reaction
      const [reaction] = await db
        .update(activityReactions)
        .set({ type: reactionData.type })
        .where(
          and(
            eq(activityReactions.activityId, reactionData.activityId),
            eq(activityReactions.userId, reactionData.userId)
          )
        )
        .returning();
      return reaction;
    } else {
      // Insert new reaction
      const [reaction] = await db
        .insert(activityReactions)
        .values(reactionData)
        .returning();
      return reaction;
    }
  }

  async removeReaction(activityId: string, userId: string): Promise<void> {
    await db
      .delete(activityReactions)
      .where(
        and(
          eq(activityReactions.activityId, activityId),
          eq(activityReactions.userId, userId)
        )
      );
  }

  async getUserReaction(activityId: string, userId: string): Promise<ActivityReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(activityReactions)
      .where(
        and(
          eq(activityReactions.activityId, activityId),
          eq(activityReactions.userId, userId)
        )
      );
    return reaction;
  }

  async getActivityReactions(activityId: string): Promise<{ thumbsUp: number; thumbsDown: number; userReaction?: 'thumbs_up' | 'thumbs_down' }> {
    const reactions = await db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, activityId));

    const thumbsUp = reactions.filter(r => r.type === 'thumbs_up').length;
    const thumbsDown = reactions.filter(r => r.type === 'thumbs_down').length;

    return { thumbsUp, thumbsDown };
  }

  // Activity comments operations
  async addComment(commentData: InsertActivityComment): Promise<ActivityComment> {
    const [comment] = await db
      .insert(activityComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getActivityComments(activityId: string): Promise<(ActivityComment & { user: User })[]> {
    const comments = await db
      .select({
        id: activityComments.id,
        activityId: activityComments.activityId,
        userId: activityComments.userId,
        content: activityComments.content,
        createdAt: activityComments.createdAt,
        user: users,
      })
      .from(activityComments)
      .innerJoin(users, eq(activityComments.userId, users.id))
      .where(eq(activityComments.activityId, activityId))
      .orderBy(activityComments.createdAt);

    return comments;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await db
      .delete(activityComments)
      .where(
        and(
          eq(activityComments.id, commentId),
          eq(activityComments.userId, userId)
        )
      );
  }

  // Badge operations
  async awardBadge(badgeData: InsertUserBadge): Promise<UserBadge> {
    const [badge] = await db
      .insert(userBadges)
      .values(badgeData)
      .onConflictDoNothing()
      .returning();
    return badge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async hasBadge(userId: string, badgeType: string): Promise<boolean> {
    const [badge] = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeType, badgeType)
        )
      );
    return !!badge;
  }

  // Personal best operations
  async upsertPersonalBest(bestData: InsertPersonalBest): Promise<PersonalBest> {
    const existing = await this.getPersonalBest(bestData.userId, bestData.metric);
    
    if (existing && existing.value >= bestData.value) {
      return existing;
    }
    
    if (existing) {
      const [updated] = await db
        .update(personalBests)
        .set({ value: bestData.value, achievedAt: new Date(), metadata: bestData.metadata })
        .where(
          and(
            eq(personalBests.userId, bestData.userId),
            eq(personalBests.metric, bestData.metric)
          )
        )
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(personalBests)
      .values(bestData)
      .returning();
    return created;
  }

  async getUserPersonalBests(userId: string): Promise<PersonalBest[]> {
    return await db
      .select()
      .from(personalBests)
      .where(eq(personalBests.userId, userId));
  }

  async getPersonalBest(userId: string, metric: string): Promise<PersonalBest | undefined> {
    const [best] = await db
      .select()
      .from(personalBests)
      .where(
        and(
          eq(personalBests.userId, userId),
          eq(personalBests.metric, metric)
        )
      );
    return best;
  }

  // Goal operations
  async createGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const [created] = await db
      .insert(userGoals)
      .values(goal)
      .returning();
    return created;
  }

  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.userId, userId))
      .orderBy(desc(userGoals.createdAt));
  }

  async getActiveGoals(userId: string): Promise<UserGoal[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(userGoals)
      .where(
        and(
          eq(userGoals.userId, userId),
          eq(userGoals.isCompleted, false),
          lte(userGoals.startDate, today),
          gte(userGoals.endDate, today)
        )
      )
      .orderBy(desc(userGoals.createdAt));
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<UserGoal> {
    const [goal] = await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.id, goalId));
    
    const isCompleted = currentValue >= goal.targetValue;
    
    const [updated] = await db
      .update(userGoals)
      .set({ 
        currentValue,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      })
      .where(eq(userGoals.id, goalId))
      .returning();
    return updated;
  }

  async completeGoal(goalId: string): Promise<UserGoal> {
    const [updated] = await db
      .update(userGoals)
      .set({ 
        isCompleted: true,
        completedAt: new Date()
      })
      .where(eq(userGoals.id, goalId))
      .returning();
    return updated;
  }

  // Password reset operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [created] = await db
      .insert(passwordResetTokens)
      .values({ userId, token, expiresAt, used: false })
      .returning();
    return created;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return result;
  }

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, new Date()));
  }

  // Location operations
  async getLocations(type?: string, parentId?: string): Promise<Location[]> {
    let query = db.select().from(locations);
    
    if (type && parentId) {
      return await db.select().from(locations)
        .where(and(eq(locations.type, type), eq(locations.parentId, parentId)))
        .orderBy(locations.sortOrder);
    } else if (type) {
      return await db.select().from(locations)
        .where(eq(locations.type, type))
        .orderBy(locations.sortOrder);
    } else if (parentId) {
      return await db.select().from(locations)
        .where(eq(locations.parentId, parentId))
        .orderBy(locations.sortOrder);
    } else {
      // Return only top-level locations (continents)
      return await db.select().from(locations)
        .where(sql`${locations.parentId} IS NULL`)
        .orderBy(locations.sortOrder);
    }
  }

  async getLocationById(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async getLocationHierarchy(id: string): Promise<Location[]> {
    const hierarchy: Location[] = [];
    let currentId: string | null = id;
    
    while (currentId) {
      const [location] = await db.select().from(locations).where(eq(locations.id, currentId));
      if (!location) break;
      hierarchy.unshift(location); // Add to beginning to maintain order from top to bottom
      currentId = location.parentId;
    }
    
    return hierarchy;
  }

  async searchCities(query: string, limit: number = 10): Promise<{ city: Location; hierarchy: Location[] }[]> {
    if (!query || query.length < 2) return [];
    
    // Search for towns/cities matching the query (case-insensitive)
    const cities = await db.select().from(locations)
      .where(and(
        eq(locations.type, 'town'),
        sql`LOWER(${locations.name}) LIKE LOWER(${'%' + query + '%'})`
      ))
      .orderBy(locations.name)
      .limit(limit);
    
    // Get hierarchy for each city
    const results = await Promise.all(
      cities.map(async (city) => {
        const hierarchy = await this.getLocationHierarchy(city.id);
        return { city, hierarchy };
      })
    );
    
    return results;
  }

  async createLocationHierarchyFromGeoNames(data: {
    geonameId: number;
    cityName: string;
    regionName: string;
    countryName: string;
    countryCode: string;
    continentCode: string;
    continentName: string;
  }): Promise<{ continentId: string; countryId: string; regionId: string; townId: string }> {
    // Create or get continent
    let [continent] = await db.select().from(locations)
      .where(and(eq(locations.type, 'continent'), eq(locations.name, data.continentName)));
    
    if (!continent) {
      [continent] = await db.insert(locations).values({
        id: `continent_${data.continentCode.toLowerCase()}`,
        name: data.continentName,
        type: 'continent',
        parentId: null,
        sortOrder: 0,
      }).onConflictDoNothing().returning();
      
      if (!continent) {
        [continent] = await db.select().from(locations)
          .where(eq(locations.id, `continent_${data.continentCode.toLowerCase()}`));
      }
    }

    // Create or get country
    let [country] = await db.select().from(locations)
      .where(and(
        eq(locations.type, 'country'),
        eq(locations.name, data.countryName),
        eq(locations.parentId, continent.id)
      ));
    
    if (!country) {
      const countryId = `country_${data.countryCode.toLowerCase()}`;
      [country] = await db.insert(locations).values({
        id: countryId,
        name: data.countryName,
        type: 'country',
        parentId: continent.id,
        sortOrder: 0,
      }).onConflictDoNothing().returning();
      
      if (!country) {
        [country] = await db.select().from(locations).where(eq(locations.id, countryId));
      }
    }

    // Create or get region (use country if no region)
    let region = country;
    if (data.regionName && data.regionName.trim() !== '') {
      const regionSlug = data.regionName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
      const regionId = `region_${data.countryCode.toLowerCase()}_${regionSlug}`;
      
      [region] = await db.select().from(locations)
        .where(and(
          eq(locations.type, 'region'),
          eq(locations.name, data.regionName),
          eq(locations.parentId, country.id)
        ));
      
      if (!region) {
        [region] = await db.insert(locations).values({
          id: regionId,
          name: data.regionName,
          type: 'region',
          parentId: country.id,
          sortOrder: 0,
        }).onConflictDoNothing().returning();
        
        if (!region) {
          [region] = await db.select().from(locations).where(eq(locations.id, regionId));
        }
      }
    }

    // Create or get town/city
    const townSlug = data.cityName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    const townId = `town_${data.geonameId}`;
    
    let [town] = await db.select().from(locations)
      .where(eq(locations.id, townId));
    
    if (!town) {
      [town] = await db.insert(locations).values({
        id: townId,
        name: data.cityName,
        type: 'town',
        parentId: region?.id || country.id,
        sortOrder: 0,
      }).onConflictDoNothing().returning();
      
      if (!town) {
        [town] = await db.select().from(locations).where(eq(locations.id, townId));
      }
    }

    return {
      continentId: continent.id,
      countryId: country.id,
      regionId: region?.id || country.id,
      townId: town.id,
    };
  }

  // Challenge operations
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getUserChallenges(userId: string, status?: string): Promise<Challenge[]> {
    const conditions = [
      sql`(${challenges.challengerId} = ${userId} OR ${challenges.opponentId} = ${userId})`
    ];
    
    if (status) {
      conditions.push(eq(challenges.status, status));
    }
    
    return await db.select().from(challenges)
      .where(and(...conditions))
      .orderBy(desc(challenges.createdAt));
  }

  async getPendingChallengesForUser(userId: string): Promise<Challenge[]> {
    return await db.select().from(challenges)
      .where(and(
        eq(challenges.opponentId, userId),
        eq(challenges.status, 'pending')
      ))
      .orderBy(desc(challenges.createdAt));
  }

  async respondToChallenge(challengeId: string, accept: boolean): Promise<Challenge> {
    const now = new Date();
    
    if (accept) {
      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
      if (!challenge) throw new Error('Challenge not found');
      
      const [updated] = await db.update(challenges)
        .set({
          status: 'active',
          respondedAt: now,
          startDate: now.toISOString().split('T')[0],
          endDate: new Date(now.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .where(eq(challenges.id, challengeId))
        .returning();
      return updated;
    } else {
      const [updated] = await db.update(challenges)
        .set({
          status: 'declined',
          respondedAt: now,
        })
        .where(eq(challenges.id, challengeId))
        .returning();
      return updated;
    }
  }

  async cancelChallenge(challengeId: string): Promise<Challenge> {
    const [updated] = await db.update(challenges)
      .set({ status: 'cancelled' })
      .where(eq(challenges.id, challengeId))
      .returning();
    return updated;
  }

  async completeChallenge(challengeId: string, winnerId: string | null, challengerScore: number, opponentScore: number): Promise<Challenge> {
    const [updated] = await db.update(challenges)
      .set({
        status: 'completed',
        winnerId,
        challengerScore,
        opponentScore,
        completedAt: new Date(),
      })
      .where(eq(challenges.id, challengeId))
      .returning();
    return updated;
  }

  async getActiveChallengesRequiringCompletion(): Promise<Challenge[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(challenges)
      .where(and(
        eq(challenges.status, 'active'),
        lte(challenges.endDate, today)
      ));
  }

  async getChallengeScores(challengeId: string): Promise<{ challengerScore: number; opponentScore: number }> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
    if (!challenge) throw new Error('Challenge not found');

    const startDate = challenge.startDate;
    const endDate = challenge.endDate;
    const metric = challenge.metric;

    const getScore = async (userId: string): Promise<number> => {
      const userActivities = await db.select().from(activities)
        .where(and(
          eq(activities.userId, userId),
          gte(activities.date, startDate),
          lte(activities.date, endDate)
        ));

      if (metric === 'calories') {
        return userActivities.reduce((sum, a) => sum + (a.calories || 0), 0);
      } else if (metric === 'steps') {
        return userActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
      } else if (metric === 'workouts') {
        return userActivities.filter(a => a.workoutType).length;
      }
      return 0;
    };

    const challengerScore = await getScore(challenge.challengerId);
    const opponentScore = await getScore(challenge.opponentId);

    return { challengerScore, opponentScore };
  }

  // Message operations
  async sendMessage(senderId: string, recipientId: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({ senderId, recipientId, content })
      .returning();
    return message;
  }

  async getConversation(userId1: string, userId2: string, limit: number = 50): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.recipientId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.recipientId} = ${userId1})`
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getUserConversations(userId: string): Promise<{ partnerId: string; partner: User | null; lastMessage: Message; unreadCount: number }[]> {
    // Get distinct conversation partners
    const allMessages = await db.select().from(messages)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.recipientId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));

    // Group by partner
    const conversationsMap = new Map<string, { lastMessage: Message; unreadCount: number }>();
    
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        const unreadCount = allMessages.filter(
          m => m.senderId === partnerId && m.recipientId === userId && !m.isRead
        ).length;
        conversationsMap.set(partnerId, { lastMessage: msg, unreadCount });
      }
    }

    // Fetch partner details
    const results: { partnerId: string; partner: User | null; lastMessage: Message; unreadCount: number }[] = [];
    for (const [partnerId, data] of conversationsMap) {
      const partner = await this.getUser(partnerId);
      results.push({ partnerId, partner: partner || null, ...data });
    }

    return results;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.recipientId, userId),
        eq(messages.senderId, senderId),
        eq(messages.isRead, false)
      ));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.recipientId, userId),
        eq(messages.isRead, false)
      ));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
