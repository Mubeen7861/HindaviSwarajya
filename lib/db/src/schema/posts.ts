import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sevaCategoryEnum = ["Food", "Education", "Health", "Shelter", "Other"] as const;

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  helpedPeople: integer("helped_people").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  location: text("location"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, timestamp: true, likes: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
