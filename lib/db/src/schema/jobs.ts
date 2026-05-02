import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  homeownerId: integer("homeowner_id").notNull(),
  homeownerName: text("homeowner_name").notNull(),
  title: text("title").notNull(),
  trade: text("trade").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  estimatedBudget: real("estimated_budget"),
  status: text("status").notNull().default("open"),
  urgency: text("urgency").notNull().default("flexible"),
  quoteCount: integer("quote_count").notNull().default(0),
  homeownerConfirmed: boolean("homeowner_confirmed").notNull().default(false),
  contractorConfirmed: boolean("contractor_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
