import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull().default("Other"),
  category: text("category").notNull().default("Other"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull().default(""),
  organizerId: integer("organizer_id").notNull(),
  volunteersNeeded: integer("volunteers_needed").notNull().default(10),
  image: text("image"),
  status: text("status").notNull().default("upcoming"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  duration: text("duration"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRegistrationsTable = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;
export type EventRegistration = typeof eventRegistrationsTable.$inferSelect;
