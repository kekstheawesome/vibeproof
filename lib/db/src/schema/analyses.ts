import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const analysesTable = pgTable("analyses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  inputMode: text("input_mode", { enum: ["image", "text"] }).notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Analysis = typeof analysesTable.$inferSelect;
export type InsertAnalysis = typeof analysesTable.$inferInsert;
