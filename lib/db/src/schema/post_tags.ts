import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const postTagsTable = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  tag: text("tag").notNull(),
});

export type PostTag = typeof postTagsTable.$inferSelect;
