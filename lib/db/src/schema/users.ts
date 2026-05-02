import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { SWARAJYA_RANK_NAMES } from "../ranks";

export const rankEnum = SWARAJYA_RANK_NAMES;

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),
  avatar: text("avatar"),
  location: text("location"),
  rank: text("rank").notNull().default("Sevak"),
  totalHelped: integer("total_helped").notNull().default(0),
  followersCount: integer("followers_count").notNull().default(0),
  postsCount: integer("posts_count").notNull().default(0),
  bio: text("bio"),
  chhava: boolean("chhava").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, joinedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
