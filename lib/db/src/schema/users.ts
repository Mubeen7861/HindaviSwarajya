import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rankEnum = ["Sevak", "Karyakarta", "Nayak", "Veer", "Sardar"] as const;

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  location: text("location").notNull(),
  rank: text("rank").notNull().default("Sevak"),
  totalHelped: integer("total_helped").notNull().default(0),
  followersCount: integer("followers_count").notNull().default(0),
  postsCount: integer("posts_count").notNull().default(0),
  bio: text("bio"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, joinedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
