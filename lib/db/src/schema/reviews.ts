import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  contractorId: integer("contractor_id").notNull(),
  homeownerId: integer("homeowner_id").notNull(),
  homeownerName: text("homeowner_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  jobTitle: text("job_title"),
  jobTrade: text("job_trade"),
  photos: text("photos").array().default([]),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
