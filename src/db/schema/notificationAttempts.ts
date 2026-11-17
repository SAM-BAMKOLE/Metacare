import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { notifications } from "./notifications"

export const notificationAttempts = pgTable("notification_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id")
    .notNull()
    .references(() => notifications.id),
  channel: text("channel").notNull(),
  outcome: text("outcome").notNull(),
  simulated: boolean("simulated").default(true).notNull(),
  attemptAt: timestamp("attempt_at", { withTimezone: true }).defaultNow().notNull(),
  errorMessage: text("error_message"),
})
