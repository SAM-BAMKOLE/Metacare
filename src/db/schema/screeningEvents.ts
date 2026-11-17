import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { patients } from "./patients"
import { organizations } from "./organizations"

export const screeningEvents = pgTable("screening_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  screeningType: text("screening_type").notNull(),
  screeningDate: timestamp("screening_date", { withTimezone: true }).notNull(),
  location: text("location"),
  recordedById: text("recorded_by_id").notNull(),
  resultCategory: text("result_category").notNull(),
  resultNotes: text("result_notes"),
  requiresClinicalReview: boolean("requires_clinical_review").default(false).notNull(),
  clinicianConfirmedFollowUp: boolean("clinician_confirmed_follow_up").default(false).notNull(),
  nextStepRecommendation: text("next_step_recommendation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
