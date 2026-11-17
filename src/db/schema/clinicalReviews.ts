import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { screeningEvents } from "./screeningEvents"

export const clinicalReviews = pgTable("clinical_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  screeningEventId: uuid("screening_event_id")
    .notNull()
    .references(() => screeningEvents.id),
  clinicianId: text("clinician_id").notNull(),
  followUpRequired: boolean("follow_up_required").default(false).notNull(),
  nextStepRecommendation: text("next_step_recommendation"),
  clinicalPriority: text("clinical_priority"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
