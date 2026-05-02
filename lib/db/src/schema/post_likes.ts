import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const postLikesTable = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.postId, t.userId)]);

export type PostLike = typeof postLikesTable.$inferSelect;
