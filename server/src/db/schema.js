import {
  boolean,
  integer,
  json,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Mirrors the existing Neon tables exactly — do not rename columns without a migration.

// Wellness profile, 90-day program, wellness history and reminder settings.
// Linked to the MongoDB auth user by email.
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(0),

  isPregnant: boolean().default(false),
  numberOfChildren: integer().default(0),
  supportSystem: jsonb().default({ partner: false, family: false, friends: false, other: "" }),

  hasMentalHealthHistory: boolean().default(false),
  mentalHealthNotes: text(),
  deliveryType: varchar({ length: 120 }),
  postpartumWeeks: integer(),

  epdsScore: integer(),

  // [{ date: "YYYY-MM-DD", mood, stress, sleep, energy }]
  wellnessHistory: jsonb().default([]),

  hasActiveProgram: boolean().default(false),
  programStartDate: timestamp(),
  programEndDate: timestamp(),
  // [{ day, theme, welcomeMessage, encouragementMessage, objectives, tasks,
  //    reflectionPrompt, executedDate, thoughts }]
  programPlan: jsonb().default([]),

  counselingHistory: jsonb().default([]),

  notificationsEnabled: boolean().default(true),
  // Stored in UTC ("HH:mm:ss"); converted to/from `timezone` at the API boundary.
  notificationTime: time().default("08:00:00"),
  lastNotificationSent: timestamp(),
  timezone: varchar({ length: 60 }).default("Australia/Melbourne"),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

// Voice consultation sessions with the AI specialists.
export const SessionChatTable = pgTable("sessionChatTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar().notNull(),
  notes: text(),
  selectedDoctor: json(),
  conversation: json(),
  report: json(),
  createdBy: varchar().notNull(),
  createdOn: varchar(),
});
