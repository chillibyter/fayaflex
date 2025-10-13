import {
  users,
  teams,
  teamMembers,
  activities,
  deviceConnections,
  notifications,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;

  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByInviteCode(code: string): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;

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

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, date: string): Promise<Notification[]>;
  deleteUserNotifications(userId: string, date: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find user by ID (primary identifier)
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
        createdAt: teams.createdAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    
    return userTeams;
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
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
    const [activity] = await db
      .insert(activities)
      .values({ ...activityData, userId })
      .returning();
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
}

export const storage = new DatabaseStorage();
