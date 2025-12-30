import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  date,
  text,
  boolean,
  uniqueIndex,
  bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).unique().notNull(),
  password: text("password"),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarId: varchar("avatar_id"), // Fitness-themed avatar selection
  // Location hierarchy for geo rankings (denormalized for fast queries)
  continentId: varchar("continent_id"),
  countryId: varchar("country_id"),
  regionId: varchar("region_id"),
  townId: varchar("town_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams),
  notifications: many(notifications),
  passkeys: many(passkeys),
}));

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code", { length: 50 }).unique().notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' or 'archived'
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// Activities table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  calories: integer("calories").notNull().default(0),
  steps: integer("steps").notNull().default(0),
  workoutType: varchar("workout_type", { length: 100 }),
  source: varchar("source", { length: 50 }).default("manual"), // 'manual', 'apple_health', 'android_health', 'huawei_health'
  attachmentUrl: text("attachment_url"), // URL/path to uploaded evidence attachment
  createdAt: timestamp("created_at").defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Device connections table
export const deviceConnections = pgTable("device_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'apple_health', 'android_health', 'huawei_health'
  isConnected: boolean("is_connected").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userProviderUnique: uniqueIndex("device_connections_user_provider_unique").on(table.userId, table.provider),
}));

export const deviceConnectionsRelations = relations(deviceConnections, ({ one }) => ({
  user: one(users, {
    fields: [deviceConnections.userId],
    references: [users.id],
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  profileImageUrl: true,
  avatarId: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  inviteCode: true,
  createdAt: true,
});
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Activity = typeof activities.$inferSelect;
export const insertActivitySchema = createInsertSchema(activities)
  .omit({
    id: true,
    createdAt: true,
    userId: true,
  })
  .extend({
    // Server-side validation for attachment file paths
    attachmentUrl: z.string().nullable().optional().refine(
      (val) => {
        if (!val) return true; // Optional field, accepts null and undefined
        
        // Check if it's a valid file path (starts with /uploads/evidence/)
        if (!val.startsWith('/uploads/evidence/')) {
          return false;
        }
        
        return true;
      },
      {
        message: "Invalid attachment: must be a valid evidence file path"
      }
    ),
  });
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type DeviceConnection = typeof deviceConnections.$inferSelect;

// Passkeys table for WebAuthn/biometric authentication
export const passkeys = pgTable("passkeys", {
  id: text("id").primaryKey(), // credentialID from WebAuthn
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialPublicKey: text("credential_public_key").notNull(), // Base64 encoded public key
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  deviceType: varchar("device_type", { length: 50 }), // 'platform' or 'cross-platform'
  backedUp: boolean("backed_up").default(false),
  transports: text("transports"), // JSON array of transport types
  createdAt: timestamp("created_at").defaultNow(),
});

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export type Passkey = typeof passkeys.$inferSelect;
export const insertPasskeySchema = createInsertSchema(passkeys).omit({
  createdAt: true,
});
export type InsertPasskey = z.infer<typeof insertPasskeySchema>;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Daily notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'daily_goal', 'team_leader', 'global_leader'
  date: date("date").notNull(), // The day this notification is for
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userDateTypeUnique: uniqueIndex("notifications_user_date_type_unique").on(table.userId, table.date, table.type),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Monthly team winners table (Victory Wall)
export const monthlyWinners = pgTable("monthly_winners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  totalCalories: integer("total_calories").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  teamMonthYearUnique: uniqueIndex("monthly_winners_team_month_year_unique").on(table.teamId, table.month, table.year),
}));

export const monthlyWinnersRelations = relations(monthlyWinners, ({ one }) => ({
  team: one(teams, {
    fields: [monthlyWinners.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [monthlyWinners.userId],
    references: [users.id],
  }),
}));

export type MonthlyWinner = typeof monthlyWinners.$inferSelect;
export const insertMonthlyWinnerSchema = createInsertSchema(monthlyWinners).omit({
  id: true,
  createdAt: true,
});
export type InsertMonthlyWinner = z.infer<typeof insertMonthlyWinnerSchema>;

// Activity reactions table (thumbs up/down)
export const activityReactions = pgTable("activity_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'thumbs_up' or 'thumbs_down'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  activityUserUnique: uniqueIndex("activity_reactions_activity_user_unique").on(table.activityId, table.userId),
}));

export const activityReactionsRelations = relations(activityReactions, ({ one }) => ({
  activity: one(activities, {
    fields: [activityReactions.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityReactions.userId],
    references: [users.id],
  }),
}));

export type ActivityReaction = typeof activityReactions.$inferSelect;
export const insertActivityReactionSchema = createInsertSchema(activityReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityReaction = z.infer<typeof insertActivityReactionSchema>;

// Activity comments table
export const activityComments = pgTable("activity_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityCommentsRelations = relations(activityComments, ({ one }) => ({
  activity: one(activities, {
    fields: [activityComments.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityComments.userId],
    references: [users.id],
  }),
}));

export type ActivityComment = typeof activityComments.$inferSelect;
export const insertActivityCommentSchema = createInsertSchema(activityComments).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;

// User badges/achievements table
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeType: varchar("badge_type", { length: 50 }).notNull(), // 'first_activity', 'streak_3', 'streak_7', 'streak_30', 'steps_10k', 'calories_1k', 'workouts_10', 'top_10', 'champion'
  earnedAt: timestamp("earned_at").defaultNow(),
  metadata: jsonb("metadata"), // Optional extra data (e.g., streak count, month/year for champion)
}, (table) => ({
  userBadgeUnique: uniqueIndex("user_badges_user_badge_unique").on(table.userId, table.badgeType),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

// Personal bests table for tracking user records
export const personalBests = pgTable("personal_bests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  metric: varchar("metric", { length: 50 }).notNull(), // 'daily_calories', 'daily_steps', 'daily_score', 'monthly_score', 'streak'
  value: integer("value").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow(),
  metadata: jsonb("metadata"), // Optional extra data (e.g., date achieved, month/year)
}, (table) => ({
  userMetricUnique: uniqueIndex("personal_bests_user_metric_unique").on(table.userId, table.metric),
}));

export const personalBestsRelations = relations(personalBests, ({ one }) => ({
  user: one(users, {
    fields: [personalBests.userId],
    references: [users.id],
  }),
}));

export type PersonalBest = typeof personalBests.$inferSelect;
export const insertPersonalBestSchema = createInsertSchema(personalBests).omit({
  id: true,
  achievedAt: true,
});
export type InsertPersonalBest = z.infer<typeof insertPersonalBestSchema>;

// Locations table for hierarchical geo ranking
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'continent', 'country', 'region', 'town'
  parentId: varchar("parent_id").references((): any => locations.id, { onDelete: "cascade" }),
  isoCode: varchar("iso_code", { length: 10 }), // ISO country/region codes where applicable
  sortOrder: integer("sort_order").default(0),
});

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "parentChild",
  }),
  children: many(locations, { relationName: "parentChild" }),
}));

export type Location = typeof locations.$inferSelect;
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});
export type InsertLocation = z.infer<typeof insertLocationSchema>;

// Goal Journeys / Quests table
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalType: varchar("goal_type", { length: 20 }).notNull(), // 'daily' or 'weekly'
  category: varchar("category", { length: 20 }).notNull(), // 'calories', 'steps', 'workouts'
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
}));

export type UserGoal = typeof userGoals.$inferSelect;
export const insertUserGoalSchema = createInsertSchema(userGoals).omit({
  id: true,
  currentValue: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
});
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
