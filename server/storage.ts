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
  teamMessages,
  feedPosts,
  feedPostLikes,
  feedPostComments,
  pushTokens,
  syncedWorkouts,
  appNotifications,
  type AppNotification,
  type InsertAppNotification,
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
  type TeamMessage,
  type FeedPost,
  type FeedPostLike,
  type FeedPostComment,
  type PushToken,
  type InsertPushToken,
  type NotificationPrefs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface FeedPostUser extends User {
  /** Single team chip displayed next to the user's name in the feed.
   *  When the user belongs to multiple teams we surface their most-recent one. */
  team?: { id: string; name: string } | null;
}

export interface FeedPostPBFlags {
  calories?: boolean;
  distance?: boolean;
  duration?: boolean;
  steps?: boolean;
  elevation?: boolean;
}

export interface FeedPostWithMeta extends FeedPost {
  user: FeedPostUser;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** Per-metric flags marking values that are this user's all-time PR for the
   *  workout type encoded in the post content. Only present on auto-posted
   *  workout cards where at least one metric is a PR. */
  personalBests?: FeedPostPBFlags;
}

// ── Auto-workout content parsing (mirrors client/src/components/WorkoutPostCard.tsx) ──
// We re-parse server-side so we can compute PB flags by comparing against the
// activities table. Keeping this here (rather than imported from a shared file)
// makes the read path zero-roundtrip and matches the post format created in
// server/routes.ts → formatWorkoutFeedPost().
const FEED_WORKOUT_RE = /^Completed an?\s+(.+?)\s+workout$/i;
interface ParsedFeedWorkout {
  type: string;
  caloriesNum?: number;
  distanceM?: number;
  durationMin?: number;
  steps?: number;
  elevationM?: number;
}
function parseFeedWorkoutContent(content: string | null | undefined): ParsedFeedWorkout | null {
  if (!content) return null;
  const lines = content.split("\n");
  const m = lines[0]?.match(FEED_WORKOUT_RE);
  if (!m) return null;
  const out: ParsedFeedWorkout = { type: m[1] };
  const stats = lines[1] || "";
  const h = stats.match(/(\d+)h\s+(\d+)m/);
  const min = stats.match(/(\d+)\s*min(?!\w)/);
  if (h) out.durationMin = parseInt(h[1]) * 60 + parseInt(h[2]);
  else if (min) out.durationMin = parseInt(min[1]);
  const km = stats.match(/([\d.]+)\s*km/);
  if (km) out.distanceM = Math.round(parseFloat(km[1]) * 1000);
  const cal = stats.match(/(\d+)\s*cal/);
  if (cal) out.caloriesNum = parseInt(cal[1]);
  const steps = stats.match(/([\d,]+)\s*steps/);
  if (steps) out.steps = parseInt(steps[1].replace(/,/g, ""));
  const elev = stats.match(/(\d+)\s*m\s*elevation/);
  if (elev) out.elevationM = parseInt(elev[1]);
  return out;
}
function normalizeWorkoutType(t: string | null | undefined): string {
  return (t || "").toLowerCase().trim().replace(/_/g, " ").replace(/\s+/g, " ");
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getLegacyUserByFirstName(firstName: string): Promise<User | undefined>;
  getLegacyUserByFullName(firstName: string, lastName: string): Promise<User | undefined>;
  createUser(user: Partial<UpsertUser> & { username: string; password?: string | null }): Promise<User>;
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
  deleteTeam(teamId: string): Promise<void>;
  getTeamLastActivityDate(teamId: string): Promise<Date | null>;

  // Team member operations
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  isUserInTeam(userId: string, teamId: string): Promise<boolean>;
  joinTeamWithCap(teamId: string, userId: string, maxMembers: number): Promise<"joined" | "already_member" | "full">;
  removeTeamMember(userId: string, teamId: string): Promise<void>;
  doUsersShareTeam(userId1: string, userId2: string): Promise<boolean>;

  // Activity operations
  createActivity(activity: InsertActivity, userId: string): Promise<Activity>;
  getUserActivities(userId: string, month?: number, year?: number): Promise<Activity[]>;
  getUserActivitiesForDate(userId: string, date: string): Promise<Activity[]>;
  getTeamActivities(teamId: string, month?: number, year?: number): Promise<Activity[]>;
  getAllActivitiesForMonth(month: number, year: number): Promise<Activity[]>;
  recordSyncedWorkout(userId: string, source: string, externalId: string, feedPostId: string | null): Promise<{ alreadyExisted: boolean }>;
  deleteSyncedWorkout(userId: string, source: string, externalId: string): Promise<void>;
  setSyncedWorkoutFeedPost(userId: string, source: string, externalId: string, feedPostId: string): Promise<void>;
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
  getUserTeamsMonthlyWinners(userId: string): Promise<MonthlyWinner[]>;
  getAllMonthlyWinners(): Promise<MonthlyWinner[]>;

  // Activity reactions operations (thumbs up/down)
  addReaction(reaction: InsertActivityReaction): Promise<ActivityReaction>;
  removeReaction(activityId: string, userId: string): Promise<void>;
  getUserReaction(activityId: string, userId: string): Promise<ActivityReaction | undefined>;
  getActivityReactions(activityId: string): Promise<{ thumbsUp: number; thumbsDown: number; userReaction?: 'thumbs_up' | 'thumbs_down' }>;
  getActivityReactors(activityId: string): Promise<Array<{ id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; type: string; createdAt: Date | null }>>;

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
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  setUserAppleId(userId: string, appleId: string): Promise<void>;
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

  // Team chat operations
  sendTeamMessage(teamId: string, userId: string, content: string): Promise<TeamMessage>;
  getTeamMessages(teamId: string, limit?: number, before?: string): Promise<(TeamMessage & { user: User })[]>;
  getLatestMessagePerTeam(teamIds: string[]): Promise<Record<string, { id: string; content: string; createdAt: Date; userFirstName: string | null }>>;

  // Feed post operations
  createFeedPost(
    userId: string,
    content: string,
    imageUrl?: string | null,
    extras?: { routePolyline?: string | null; routePrivacy?: string | null },
  ): Promise<FeedPost>;
  getFeed(userId: string, limit?: number, offset?: number): Promise<FeedPostWithMeta[]>;
  deleteFeedPost(postId: string, userId: string): Promise<void>;
  likeFeedPost(postId: string, userId: string): Promise<void>;
  unlikeFeedPost(postId: string, userId: string): Promise<void>;
  getFeedPostLike(postId: string, userId: string): Promise<FeedPostLike | undefined>;
  addFeedPostComment(postId: string, userId: string, content: string): Promise<FeedPostComment>;
  getFeedPostComments(postId: string): Promise<(FeedPostComment & { user: User })[]>;
  deleteFeedPostComment(commentId: string, userId: string): Promise<void>;

  // Push notification operations
  upsertPushToken(userId: string, data: InsertPushToken): Promise<PushToken>;
  deletePushTokenById(id: string): Promise<void>;
  deletePushTokenByToken(userId: string, token: string): Promise<void>;
  getUserPushTokens(userId: string): Promise<PushToken[]>;
  updateNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<User>;
  getUsersWithoutActivityOn(date: string): Promise<User[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
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

  async createUser(userData: Partial<UpsertUser> & { username: string; password?: string | null }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password || null, // Allow null for OAuth users
        email: userData.email || `${userData.username}@temp.local`, // Email is required, use temp if not provided
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        avatarId: userData.avatarId,
        continentId: userData.continentId,
        countryId: userData.countryId,
        regionId: userData.regionId,
        townId: userData.townId,
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

  async deleteTeam(teamId: string): Promise<void> {
    // Delete team messages first
    await db.delete(teamMessages).where(eq(teamMessages.teamId, teamId));
    // Delete team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    // Delete the team
    await db.delete(teams).where(eq(teams.id, teamId));
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

  async joinTeamWithCap(
    teamId: string,
    userId: string,
    maxMembers: number,
  ): Promise<"joined" | "already_member" | "full"> {
    // Wrap the membership check + count + insert in a single transaction
    // and lock the team row with `SELECT ... FOR UPDATE` so that two
    // concurrent joiners can't both pass the count check and exceed the
    // member cap.
    return await db.transaction(async (tx) => {
      // Row-level lock on the team. If the team disappeared between the
      // route handler's lookup and now, treat as full to fail safely.
      const lockedTeam = await tx.execute(
        sql`SELECT id FROM teams WHERE id = ${teamId} FOR UPDATE`,
      );
      if ((lockedTeam as any).rows?.length === 0) return "full" as const;

      const [existing] = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
      if (existing) return "already_member" as const;

      const countResult = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));
      const memberCount = countResult[0]?.count ?? 0;
      if (memberCount >= maxMembers) return "full" as const;

      await tx.insert(teamMembers).values({ teamId, userId });
      return "joined" as const;
    });
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

  async recordSyncedWorkout(
    userId: string,
    source: string,
    externalId: string,
    feedPostId: string | null,
  ): Promise<{ alreadyExisted: boolean }> {
    const inserted = await db
      .insert(syncedWorkouts)
      .values({ userId, source, externalId, feedPostId })
      .onConflictDoNothing({
        target: [syncedWorkouts.userId, syncedWorkouts.source, syncedWorkouts.externalId],
      })
      .returning({ id: syncedWorkouts.id });
    return { alreadyExisted: inserted.length === 0 };
  }

  async deleteSyncedWorkout(userId: string, source: string, externalId: string): Promise<void> {
    await db
      .delete(syncedWorkouts)
      .where(
        and(
          eq(syncedWorkouts.userId, userId),
          eq(syncedWorkouts.source, source),
          eq(syncedWorkouts.externalId, externalId),
        ),
      );
  }

  async setSyncedWorkoutFeedPost(
    userId: string,
    source: string,
    externalId: string,
    feedPostId: string,
  ): Promise<void> {
    await db
      .update(syncedWorkouts)
      .set({ feedPostId })
      .where(
        and(
          eq(syncedWorkouts.userId, userId),
          eq(syncedWorkouts.source, source),
          eq(syncedWorkouts.externalId, externalId),
        ),
      );
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
        // Never let a re-sync reduce a day's totals for the same source.
        // HealthKit / Garmin sometimes report a lower cumulative value
        // mid-day (recalculation, workout edit, source switch). Take the
        // max so users don't see their calories/steps drop after a sync.
        const nextCalories = Math.max(existing.calories ?? 0, incoming.calories ?? 0);
        const nextSteps = Math.max(existing.steps ?? 0, incoming.steps ?? 0);
        const nextWorkoutType = incoming.workoutType || existing.workoutType || null;

        if (
          existing.calories !== nextCalories ||
          existing.steps !== nextSteps ||
          existing.workoutType !== nextWorkoutType
        ) {
          await db
            .update(activities)
            .set({
              calories: nextCalories,
              steps: nextSteps,
              workoutType: nextWorkoutType,
            })
            .where(eq(activities.id, existing.id));
          updated++;
        } else {
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

  // ---------- App notifications (Notifications Center) ----------
  async createAppNotification(data: InsertAppNotification): Promise<AppNotification> {
    const [row] = await db.insert(appNotifications).values(data).returning();
    return row;
  }

  async listAppNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
    return await db
      .select()
      .from(appNotifications)
      .where(eq(appNotifications.userId, userId))
      .orderBy(desc(appNotifications.createdAt))
      .limit(limit);
  }

  async getAppNotificationUnreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appNotifications)
      .where(and(eq(appNotifications.userId, userId), eq(appNotifications.isRead, false)));
    return row?.count ?? 0;
  }

  async markAppNotificationRead(userId: string, id: string): Promise<void> {
    await db
      .update(appNotifications)
      .set({ isRead: true })
      .where(and(eq(appNotifications.userId, userId), eq(appNotifications.id, id)));
  }

  async markAllAppNotificationsRead(userId: string): Promise<void> {
    await db
      .update(appNotifications)
      .set({ isRead: true })
      .where(and(eq(appNotifications.userId, userId), eq(appNotifications.isRead, false)));
  }

  async deleteAppNotification(userId: string, id: string): Promise<void> {
    await db
      .delete(appNotifications)
      .where(and(eq(appNotifications.userId, userId), eq(appNotifications.id, id)));
  }

  async clearAppNotifications(userId: string): Promise<void> {
    await db.delete(appNotifications).where(eq(appNotifications.userId, userId));
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

  async getUserTeamsMonthlyWinners(userId: string): Promise<MonthlyWinner[]> {
    // Get all teams user is a member of
    const userTeams = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    if (userTeams.length === 0) return [];
    
    const teamIds = userTeams.map(t => t.teamId);
    
    return await db
      .select()
      .from(monthlyWinners)
      .where(inArray(monthlyWinners.teamId, teamIds))
      .orderBy(desc(monthlyWinners.year), desc(monthlyWinners.month));
  }

  async getAllMonthlyWinners(): Promise<MonthlyWinner[]> {
    return await db
      .select()
      .from(monthlyWinners)
      .orderBy(desc(monthlyWinners.year), desc(monthlyWinners.month));
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

  async getFeedPostLikers(postId: string) {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        avatarId: users.avatarId,
        createdAt: feedPostLikes.createdAt,
      })
      .from(feedPostLikes)
      .innerJoin(users, eq(feedPostLikes.userId, users.id))
      .where(eq(feedPostLikes.postId, postId))
      .orderBy(desc(feedPostLikes.createdAt));
    return rows;
  }

  async getActivityReactors(activityId: string) {
    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        type: activityReactions.type,
        createdAt: activityReactions.createdAt,
      })
      .from(activityReactions)
      .innerJoin(users, eq(activityReactions.userId, users.id))
      .where(eq(activityReactions.activityId, activityId))
      .orderBy(desc(activityReactions.createdAt));
    return rows;
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

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.appleId, appleId));
    return user;
  }

  async setUserAppleId(userId: string, appleId: string): Promise<void> {
    await db
      .update(users)
      .set({ appleId, updatedAt: new Date() })
      .where(eq(users.id, userId));
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

  // Team chat operations
  async sendTeamMessage(teamId: string, userId: string, content: string): Promise<TeamMessage> {
    const [message] = await db.insert(teamMessages)
      .values({
        teamId,
        userId,
        content,
      })
      .returning();
    return message;
  }

  async getLatestMessagePerTeam(
    teamIds: string[]
  ): Promise<Record<string, { id: string; content: string; createdAt: Date; userFirstName: string | null }>> {
    if (teamIds.length === 0) return {};
    // One row per team using DISTINCT ON (Postgres) — selects newest message per team.
    const placeholders = sql.join(teamIds.map(id => sql`${id}`), sql.raw(','));
    const result: any = await db.execute(sql`
      SELECT DISTINCT ON (tm.team_id)
        tm.team_id   AS "teamId",
        tm.id        AS "id",
        tm.content   AS "content",
        tm.created_at AS "createdAt",
        u.first_name AS "userFirstName"
      FROM team_messages tm
      INNER JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id IN (${placeholders})
      ORDER BY tm.team_id, tm.created_at DESC
    `);
    const rows: any[] = result.rows ?? result;
    const out: Record<string, { id: string; content: string; createdAt: Date; userFirstName: string | null }> = {};
    for (const r of rows) {
      out[r.teamId] = {
        id: r.id,
        content: r.content,
        createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
        userFirstName: r.userFirstName ?? null,
      };
    }
    return out;
  }

  async getTeamMessages(teamId: string, limit: number = 50, before?: string): Promise<(TeamMessage & { user: User })[]> {
    // Build conditions array
    const conditions = [eq(teamMessages.teamId, teamId)];
    
    // Add cursor-based pagination if before is provided
    if (before) {
      const [beforeMessage] = await db.select({ createdAt: teamMessages.createdAt })
        .from(teamMessages)
        .where(eq(teamMessages.id, before));
      
      if (beforeMessage) {
        conditions.push(sql`${teamMessages.createdAt} < ${beforeMessage.createdAt}`);
      }
    }

    // Single query with join to get messages and users together (avoids N+1)
    const results = await db
      .select({
        message: teamMessages,
        user: users,
      })
      .from(teamMessages)
      .innerJoin(users, eq(teamMessages.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(teamMessages.createdAt))
      .limit(limit);

    // Map results to expected format
    return results.map(({ message, user }) => ({
      ...message,
      user,
    }));
  }

  // ── Feed post operations ──────────────────────────────────────────────────

  async createFeedPost(
    userId: string,
    content: string,
    imageUrl?: string | null,
    extras?: { routePolyline?: string | null; routePrivacy?: string | null },
  ): Promise<FeedPost> {
    const [post] = await db
      .insert(feedPosts)
      .values({
        userId,
        content,
        imageUrl: imageUrl ?? null,
        routePolyline: extras?.routePolyline ?? null,
        routePrivacy: extras?.routePrivacy ?? null,
      })
      .returning();
    return post;
  }

  async getFeed(userId: string, limit: number = 30, offset: number = 0): Promise<FeedPostWithMeta[]> {
    // Get all team-mates (including self) so we can show their posts
    const userTeamRows = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    const teamIds = userTeamRows.map((r) => r.teamId);

    let visibleUserIds: string[] = [userId];
    if (teamIds.length > 0) {
      const teammateRows = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(inArray(teamMembers.teamId, teamIds));
      const ids = teammateRows.map((r) => r.userId);
      visibleUserIds = [...new Set([...visibleUserIds, ...ids])];
    }

    // Fetch posts from visible users
    const posts = await db
      .select({ post: feedPosts, user: users })
      .from(feedPosts)
      .innerJoin(users, eq(feedPosts.userId, users.id))
      .where(inArray(feedPosts.userId, visibleUserIds))
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit)
      .offset(offset);

    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.post.id);

    // Aggregate like counts
    const likeCounts = await db
      .select({ postId: feedPostLikes.postId, count: sql<number>`count(*)::int` })
      .from(feedPostLikes)
      .where(inArray(feedPostLikes.postId, postIds))
      .groupBy(feedPostLikes.postId);

    const likeCountMap = new Map(likeCounts.map((l) => [l.postId, l.count]));

    // Aggregate comment counts
    const commentCounts = await db
      .select({ postId: feedPostComments.postId, count: sql<number>`count(*)::int` })
      .from(feedPostComments)
      .where(inArray(feedPostComments.postId, postIds))
      .groupBy(feedPostComments.postId);

    const commentCountMap = new Map(commentCounts.map((c) => [c.postId, c.count]));

    // Which posts has the current user liked?
    const myLikes = await db
      .select({ postId: feedPostLikes.postId })
      .from(feedPostLikes)
      .where(and(eq(feedPostLikes.userId, userId), inArray(feedPostLikes.postId, postIds)));

    const likedSet = new Set(myLikes.map((l) => l.postId));

    // ── Fetch each post author's primary team (most recent membership) ──
    // We want a tiny "team chip" next to the user's name on every feed card.
    // One round-trip joins team_members → teams for all visible authors, then
    // we reduce to the freshest team per user in JS.
    const authorIds = Array.from(new Set(posts.map((p) => p.user.id)));
    const teamRows = await db
      .select({
        userId: teamMembers.userId,
        teamId: teams.id,
        teamName: teams.name,
        teamCreatedAt: teams.createdAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(
        inArray(teamMembers.userId, authorIds),
        eq(teams.status, "active"),
      ));
    const teamMap = new Map<string, { id: string; name: string }>();
    for (const r of teamRows) {
      const existing = teamMap.get(r.userId);
      const isFresher = !existing
        || (r.teamCreatedAt && (!existing || (existing as any)._ts < r.teamCreatedAt.getTime()));
      if (!existing || isFresher) {
        teamMap.set(r.userId, {
          id: r.teamId,
          name: r.teamName,
          // Stash the timestamp on the object for the next iteration's
          // freshness comparison; stripped before the response goes out.
          ...({ _ts: r.teamCreatedAt?.getTime?.() ?? 0 } as any),
        });
      }
    }
    // Strip the internal _ts marker
    teamMap.forEach((v) => { delete (v as any)._ts; });

    // ── Compute per-post personal-best flags for auto-workout posts ──
    // A metric is "PB" when its value matches the user's all-time max for the
    // same workout type in the activities table. Computing at read time means
    // a value that was once a PR will lose its badge when the user beats it.
    const pbMap = new Map<string, FeedPostPBFlags>();

    // 1. Parse all auto-workout posts in this page
    const parsedByPost = new Map<string, ParsedFeedWorkout>();
    const userIdsWithWorkouts = new Set<string>();
    for (const { post } of posts) {
      const parsed = parseFeedWorkoutContent(post.content);
      if (!parsed) continue;
      parsedByPost.set(post.id, parsed);
      userIdsWithWorkouts.add(post.userId);
    }

    if (userIdsWithWorkouts.size > 0) {
      // 2. Pull every relevant activity for those users (one query) so we can
      //    compute max(metric) per (userId, workoutType) in JS.
      const acts = await db
        .select({
          userId: activities.userId,
          workoutType: activities.workoutType,
          calories: activities.calories,
          steps: activities.steps,
          durationMinutes: activities.durationMinutes,
          distanceMeters: activities.distanceMeters,
          elevationGainMeters: activities.elevationGainMeters,
        })
        .from(activities)
        .where(and(
          inArray(activities.userId, Array.from(userIdsWithWorkouts)),
          sql`${activities.workoutType} IS NOT NULL`,
        ));

      type Maxes = { calories: number; distanceM: number; durationMin: number; steps: number; elevationM: number };
      const maxByKey = new Map<string, Maxes>();
      for (const a of acts) {
        const key = `${a.userId}::${normalizeWorkoutType(a.workoutType)}`;
        const cur: Maxes = maxByKey.get(key) ?? { calories: 0, distanceM: 0, durationMin: 0, steps: 0, elevationM: 0 };
        if ((a.calories ?? 0) > cur.calories) cur.calories = a.calories ?? 0;
        if ((a.distanceMeters ?? 0) > cur.distanceM) cur.distanceM = a.distanceMeters ?? 0;
        if ((a.durationMinutes ?? 0) > cur.durationMin) cur.durationMin = a.durationMinutes ?? 0;
        if ((a.steps ?? 0) > cur.steps) cur.steps = a.steps ?? 0;
        if ((a.elevationGainMeters ?? 0) > cur.elevationM) cur.elevationM = a.elevationGainMeters ?? 0;
        maxByKey.set(key, cur);
      }

      // 3. For each parsed post, mark each metric a PB when the post value
      //    matches (within a small tolerance) the user's all-time max.
      for (const { post } of posts) {
        const parsed = parsedByPost.get(post.id);
        if (!parsed) continue;
        const key = `${post.userId}::${normalizeWorkoutType(parsed.type)}`;
        const max = maxByKey.get(key);
        if (!max) continue;
        const flags: FeedPostPBFlags = {};
        // Tolerances absorb tiny rounding drift between the DB integer values
        // and the human-readable strings we baked into the post content.
        if (parsed.caloriesNum != null && max.calories > 0
          && Math.abs(parsed.caloriesNum - max.calories) <= 1) flags.calories = true;
        if (parsed.distanceM != null && max.distanceM > 0
          && Math.abs(parsed.distanceM - max.distanceM) <= 50) flags.distance = true;
        if (parsed.durationMin != null && max.durationMin > 0
          && Math.abs(parsed.durationMin - max.durationMin) <= 1) flags.duration = true;
        if (parsed.steps != null && max.steps > 0
          && Math.abs(parsed.steps - max.steps) <= 50) flags.steps = true;
        if (parsed.elevationM != null && max.elevationM > 0
          && Math.abs(parsed.elevationM - max.elevationM) <= 5) flags.elevation = true;
        if (Object.keys(flags).length > 0) pbMap.set(post.id, flags);
      }
    }

    return posts.map(({ post, user }) => ({
      ...post,
      user: { ...user, team: teamMap.get(user.id) ?? null } as FeedPostUser,
      likeCount: likeCountMap.get(post.id) ?? 0,
      commentCount: commentCountMap.get(post.id) ?? 0,
      likedByMe: likedSet.has(post.id),
      personalBests: pbMap.get(post.id),
    }));
  }

  async deleteFeedPost(postId: string, userId: string): Promise<void> {
    // Clear the dedup record first so a future sync can repost this workout.
    await db.delete(syncedWorkouts).where(eq(syncedWorkouts.feedPostId, postId));
    await db.delete(feedPosts).where(and(eq(feedPosts.id, postId), eq(feedPosts.userId, userId)));
  }

  async likeFeedPost(postId: string, userId: string): Promise<void> {
    await db.insert(feedPostLikes).values({ postId, userId }).onConflictDoNothing();
  }

  async unlikeFeedPost(postId: string, userId: string): Promise<void> {
    await db.delete(feedPostLikes).where(and(eq(feedPostLikes.postId, postId), eq(feedPostLikes.userId, userId)));
  }

  async getFeedPostLike(postId: string, userId: string): Promise<FeedPostLike | undefined> {
    const [like] = await db
      .select()
      .from(feedPostLikes)
      .where(and(eq(feedPostLikes.postId, postId), eq(feedPostLikes.userId, userId)));
    return like;
  }

  async addFeedPostComment(postId: string, userId: string, content: string): Promise<FeedPostComment> {
    const [comment] = await db.insert(feedPostComments).values({ postId, userId, content }).returning();
    return comment;
  }

  async getFeedPostComments(postId: string): Promise<(FeedPostComment & { user: User })[]> {
    const results = await db
      .select({ comment: feedPostComments, user: users })
      .from(feedPostComments)
      .innerJoin(users, eq(feedPostComments.userId, users.id))
      .where(eq(feedPostComments.postId, postId))
      .orderBy(feedPostComments.createdAt);
    return results.map(({ comment, user }) => ({ ...comment, user }));
  }

  async deleteFeedPostComment(commentId: string, userId: string): Promise<void> {
    await db.delete(feedPostComments).where(and(eq(feedPostComments.id, commentId), eq(feedPostComments.userId, userId)));
  }

  // ==================== Push notification operations ====================
  async upsertPushToken(userId: string, data: InsertPushToken): Promise<PushToken> {
    const [existing] = await db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, data.token)));

    let saved: PushToken;
    if (existing) {
      const [updated] = await db
        .update(pushTokens)
        .set({
          platform: data.platform,
          webSubscription: data.webSubscription ?? existing.webSubscription,
          lastSeenAt: new Date(),
        })
        .where(eq(pushTokens.id, existing.id))
        .returning();
      saved = updated;
    } else {
      const [created] = await db
        .insert(pushTokens)
        .values({ ...data, userId })
        .returning();
      saved = created;
    }

    // Prune stale same-platform tokens for this user (likely from previous installs).
    // Anything not seen in the last 24h is considered dead — only the live device
    // refreshes its token on every app launch, so this safely removes ghosts.
    if (data.platform === "ios" || data.platform === "android") {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      try {
        const stale = await db
          .delete(pushTokens)
          .where(
            and(
              eq(pushTokens.userId, userId),
              eq(pushTokens.platform, data.platform),
              lte(pushTokens.lastSeenAt, cutoff),
            ),
          )
          .returning({ id: pushTokens.id });
        if (stale.length > 0) {
          console.log(`[Push] Pruned ${stale.length} stale ${data.platform} token(s) for user ${userId}`);
        }
      } catch (e: any) {
        console.warn("[Push] Stale token prune failed:", e?.message);
      }
    }

    return saved;
  }

  async deletePushTokenById(id: string): Promise<void> {
    await db.delete(pushTokens).where(eq(pushTokens.id, id));
  }

  async deletePushTokenByToken(userId: string, token: string): Promise<void> {
    await db
      .delete(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
  }

  async getUserPushTokens(userId: string): Promise<PushToken[]> {
    return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  }

  async updateNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ notificationPrefs: prefs as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getUsersWithoutActivityOn(date: string): Promise<User[]> {
    // Find all users who have NO activity row for the given date (or all rows are zero calories+steps)
    const result = await db.execute(sql`
      SELECT u.* FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM activities a
        WHERE a.user_id = u.id
          AND a.date = ${date}::date
          AND (a.calories > 0 OR a.steps > 0)
      )
    `);
    return result.rows as unknown as User[];
  }

  async getActivityById(id: string): Promise<Activity | undefined> {
    const [row] = await db.select().from(activities).where(eq(activities.id, id));
    return row;
  }
}

export const storage = new DatabaseStorage();
