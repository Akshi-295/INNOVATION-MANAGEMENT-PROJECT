import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull().$type<"hvac" | "lighting" | "appliance" | "ev_charger" | "industrial" | "other">(),
  status: text("status").notNull().default("online").$type<"online" | "offline" | "warning">(),
  powerRatingW: real("power_rating_w").notNull(),
  currentWatts: real("current_watts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
