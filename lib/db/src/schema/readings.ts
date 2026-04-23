import { pgTable, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { devicesTable } from "./devices";

export const readingsTable = pgTable("readings", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().references(() => devicesTable.id, { onDelete: "cascade" }),
  wattsConsumed: real("watts_consumed").notNull(),
  kwhConsumed: real("kwh_consumed").notNull(),
  isWasteful: boolean("is_wasteful").notNull().default(false),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReadingSchema = createInsertSchema(readingsTable).omit({ id: true, recordedAt: true });
export type InsertReading = z.infer<typeof insertReadingSchema>;
export type Reading = typeof readingsTable.$inferSelect;
