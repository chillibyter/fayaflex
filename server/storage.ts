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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
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
  getTeamActivities(teamId: string, month?: number, year?: number): Promise<Activity[]>;
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
      .values(userData)
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
    const [team] = await db.select().from(teams).where(eq(teams.inviteCode, code));
    return team;
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
}

export const storage = new DatabaseStorage();
