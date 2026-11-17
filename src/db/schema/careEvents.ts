import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { referrals } from "./referrals"
import { patients } from "./patients"

export const careEvents = pgTable("care_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id")
    .notNull()
    .references(() => referrals.id),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  actorId: text("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  eventType: text("event_type").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
})
