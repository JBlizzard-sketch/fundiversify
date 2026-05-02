import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractorsTable = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trade: text("trade").notNull(),
  location: text("location").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  yearsExperience: integer("years_experience").notNull().default(0),
  phone: text("phone").notNull(),
  portfolioPhotos: text("portfolio_photos").array().default([]),
  specializations: text("specializations").array().default([]),
  profileViews: integer("profile_views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContractorSchema = createInsertSchema(contractorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type Contractor = typeof contractorsTable.$inferSelect;
