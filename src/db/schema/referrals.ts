import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { patients } from "./patients"
import { screeningEvents } from "./screeningEvents"
import { organizations } from "./organizations"

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id),
  sourceScreeningEventId: uuid("source_screening_event_id").references(() => screeningEvents.id),
  referringOrganizationId: uuid("referring_organization_id")
    .notNull()
    .references(() => organizations.id),
  receivingOrganizationId: uuid("receiving_organization_id").references(() => organizations.id),
  receivingProvider: text("receiving_provider"),
  assignedOwnerId: text("assigned_owner_id"),
  priority: text("priority").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: text("status").notNull().default("draft"),
  instructions: text("instructions"),
  patientCommunicationStatus: text("patient_communication_status").default("not_contacted").notNull(),
  providerAcknowledgementStatus: text("provider_acknowledgement_status").default("not_acknowledged").notNull(),
  closureOutcome: text("closure_outcome"),
  closureReason: text("closure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
