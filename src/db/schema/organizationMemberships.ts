import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
