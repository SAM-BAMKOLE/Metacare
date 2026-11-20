import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { referrals } from "./referrals"
import { user as authUser } from "./auth"

export const escalations = pgTable("escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id")
    .notNull()
    .references(() => referrals.id),
  reason: text("reason").notNull(),
  escalatedBy: text("escalated_by")
    .notNull()
    .references(() => authUser.id),
  escalatedTo: text("escalated_to")
    .notNull()
    .references(() => authUser.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  acknowledgedBy: text("acknowledged_by").references(() => authUser.id),
  actionTaken: text("action_taken"),
})
