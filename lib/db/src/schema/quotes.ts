import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  contractorId: integer("contractor_id").notNull(),
  contractorName: text("contractor_name").notNull(),
  contractorRating: real("contractor_rating").notNull().default(0),
  contractorAvatarUrl: text("contractor_avatar_url"),
  contractorTier: text("contractor_tier").notNull().default("free"),
  amount: real("amount").notNull(),
  message: text("message"),
  estimatedDays: integer("estimated_days").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
