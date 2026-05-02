import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedContractorsTable = pgTable("saved_contractors", {
  id: serial("id").primaryKey(),
  homeownerId: integer("homeowner_id").notNull(),
  contractorId: integer("contractor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.homeownerId, t.contractorId),
]);

export const insertSavedContractorSchema = createInsertSchema(savedContractorsTable).omit({ id: true, createdAt: true });
export type InsertSavedContractor = z.infer<typeof insertSavedContractorSchema>;
export type SavedContractor = typeof savedContractorsTable.$inferSelect;
