import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const helpRequestsTable = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Other"),
  urgency: text("urgency").notNull().default("Medium"),
  location: text("location").notNull(),
  requesterId: integer("requester_id").notNull(),
  peopleNeeded: integer("people_needed").notNull().default(1),
  status: text("status").notNull().default("open"),
  deadline: text("deadline"),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const helpRequestJoinsTable = pgTable("help_request_joins", {
  id: serial("id").primaryKey(),
  helpRequestId: integer("help_request_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export type HelpRequest = typeof helpRequestsTable.$inferSelect;
export type HelpRequestJoin = typeof helpRequestJoinsTable.$inferSelect;
