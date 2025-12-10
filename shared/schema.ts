import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const directors = pgTable("directors", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  schoolName: text("school_name").notNull(),
  directorKey: text("director_key").notNull().unique(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteCodes = pgTable("invite_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  directorId: varchar("director_id").notNull().references(() => directors.id),
  className: text("class_name").notNull(),
  role: text("role").notNull().default("student"),
  isActive: boolean("is_active").default(true),
  usageCount: text("usage_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectorSchema = createInsertSchema(directors).pick({
  email: true,
  password: true,
  name: true,
  schoolName: true,
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).pick({
  code: true,
  className: true,
  role: true,
});

export type InsertDirector = z.infer<typeof insertDirectorSchema>;
export type Director = typeof directors.$inferSelect;
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;
