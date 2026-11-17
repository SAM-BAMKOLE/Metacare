import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  internalId: text("internal_id").notNull(),
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  contactDetails: text("contact_details"),
  administrativeNotes: text("administrative_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
