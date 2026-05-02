import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const bannersTable = pgTable("banners", {
  id: serial("id").primaryKey(),
  subtitle: text("subtitle").notNull().default(""),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaHref: text("cta_href").notNull().default(""),
  imageUrl: text("image_url"),
  gradientFrom: text("gradient_from").notNull().default("#FF6F00"),
  gradientTo: text("gradient_to").notNull().default("#EA580C"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Banner = typeof bannersTable.$inferSelect;
