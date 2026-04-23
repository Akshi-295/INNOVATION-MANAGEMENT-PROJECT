import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { devicesTable } from "./devices";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().references(() => devicesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"overconsumption" | "idle_waste" | "off_hours_usage" | "spike_detected" | "threshold_exceeded">(),
  severity: text("severity").notNull().$type<"low" | "medium" | "high" | "critical">(),
  message: text("message").notNull(),
  status: text("status").notNull().default("active").$type<"active" | "resolved" | "dismissed">(),
  estimatedWasteKwh: real("estimated_waste_kwh").notNull().default(0),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, resolvedAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
