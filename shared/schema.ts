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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarId: varchar("avatar_id"), // Fitness-themed avatar selection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams),
  notifications: many(notifications),
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
  source: varchar("source", { length: 50 }).default("manual"), // 'manual', 'apple_health', 'garmin'
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
  provider: varchar("provider", { length: 50 }).notNull(), // 'apple_health', 'garmin', 'android_health'
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
    // Server-side validation for attachment data URLs
    attachmentUrl: z.string().optional().refine(
      (val) => {
        if (!val) return true; // Optional field
        
        // Check if it's a valid data URL
        if (!val.startsWith('data:image/')) {
          return false;
        }
        
        // Check size (max 5MB when Base64 encoded, ~6.7MB as Base64)
        const base64Data = val.split(',')[1];
        if (base64Data && base64Data.length > 6700000) {
          return false;
        }
        
        return true;
      },
      {
        message: "Invalid attachment: must be an image data URL under 5MB"
      }
    ),
  });
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type DeviceConnection = typeof deviceConnections.$inferSelect;

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
