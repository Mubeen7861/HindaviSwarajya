import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const eventTagsTable = pgTable("event_tags", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  tag: text("tag").notNull(),
});
