import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { referrals } from "./referrals"
import { user as authUser } from "./auth"

export const confirmatoryFollowUps = pgTable("confirmatory_follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id")
    .notNull()
    .references(() => referrals.id),
  required: text("required").notNull(), // yes, no, undetermined
  testAssessmentLabel: text("test_assessment_label").notNull(),
  orderedBy: text("ordered_by")
    .notNull()
    .references(() => authUser.id),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull(),
  expectedDate: timestamp("expected_date", { withTimezone: true }),
  status: text("status").notNull(), // not_ordered, ordered, scheduled, completed, result_pending_review, reviewed, cancelled
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by").references(() => authUser.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  outcomeSummary: text("outcome_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
