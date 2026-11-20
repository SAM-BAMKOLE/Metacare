import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { notifications } from "./notifications"

export const notificationAttempts = pgTable("notification_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id")
    .notNull()
    .references(() => notifications.id),
  channel: text("channel").notNull(),
  language: text("language"),
  outcome: text("outcome").notNull(),
  acknowledgementAt: timestamp("acknowledgement_at", { withTimezone: true }),
  understanding: text("understanding"),
  concernQuestion: text("concern_question"),
  nextStepExplained: boolean("next_step_explained").default(false).notNull(),
  simulated: boolean("simulated").default(true).notNull(),
  attemptAt: timestamp("attempt_at", { withTimezone: true }).defaultNow().notNull(),
  errorMessage: text("error_message"),
})
