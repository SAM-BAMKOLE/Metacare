import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { referrals } from "./referrals"

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id").references(() => referrals.id),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  simulated: boolean("simulated").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
