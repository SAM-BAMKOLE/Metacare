import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { referrals } from "./referrals"
import { user as authUser } from "./auth"

export const clinicalConsultations = pgTable("clinical_consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id")
    .notNull()
    .references(() => referrals.id),
  consultingClinicianId: text("consulting_clinician_id")
    .notNull()
    .references(() => authUser.id),
  requestingClinicianOrFacility: text("requesting_clinician_or_facility").notNull(),
  consultationDate: timestamp("consultation_date", { withTimezone: true }).notNull(),
  reason: text("reason").notNull(),
  outcome: text("outcome").notNull(), // assessment_completed, more_information_requested, further_review_required, redirected, other
  summaryRecommendation: text("summary_recommendation"),
  nextAction: text("next_action"),
  nextActionOwnerId: text("next_action_owner_id").references(() => authUser.id),
  nextActionDueDate: timestamp("next_action_due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
