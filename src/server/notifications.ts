import { db } from "@/lib/db"
import { notifications, notificationAttempts } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"

export const createNotificationSchema = z.object({
  referralId: z.string().optional().nullable(),
  userId: z.string().min(1, "User is required"),
  type: z.string().min(1, "Notification type is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  simulated: z.boolean().default(true),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>

export async function createNotification(input: CreateNotificationInput) {
  'use server'
  const parsed = createNotificationSchema.parse(input)

  const [notification] = await db.insert(notifications).values({
    referralId: parsed.referralId ?? null,
    userId: parsed.userId,
    type: parsed.type,
    title: parsed.title,
    content: parsed.content,
    read: false,
    simulated: parsed.simulated ?? true,
  }).returning()

  return notification
}

export async function listNotifications(userId: string, unreadOnly = false) {
  'use server'
  const conditions = [eq(notifications.userId, userId)]
  if (unreadOnly) conditions.push(eq(notifications.read, false))
  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
}

export async function markNotificationRead(notificationId: string, userId: string) {
  'use server'
  const [updated] = await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning()
  return updated ?? null
}

export async function markAllNotificationsRead(userId: string) {
  'use server'
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
}

export async function retryNotification(notificationId: string, userId: string) {
  'use server'
  const [notif] = await db.select().from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .limit(1)
  if (!notif) {
    throw new Error("Notification not found")
  }

  await db.insert(notificationAttempts).values({
    notificationId,
    channel: "in_app",
    outcome: "delivered",
    simulated: true,
    errorMessage: null,
  })

  return notif
}

export async function recordNotificationAttempt(
  notificationId: string,
  channel: string,
  outcome: string,
  simulated: boolean,
  errorMessage: string | null,
) {
  'use server'
  const [attempt] = await db.insert(notificationAttempts).values({
    notificationId,
    channel,
    outcome,
    simulated,
    errorMessage,
  }).returning()
  return attempt
}

export type NotificationType =
  | "referral_assigned"
  | "referral_awaiting_acknowledgement"
  | "referral_acknowledged"
  | "case_overdue"
  | "case_approaching_due_date"
  | "patient_communication"
  | "provider_update"
  | "case_escalated"

export async function triggerReferralNotification({
  referralId,
  userId,
  type,
  title,
  content,
  channel = "in_app",
}: {
  referralId?: string | null
  userId: string
  type: NotificationType
  title: string
  content: string
  channel?: string
}) {
  'use server'
  const notification = await createNotification({
    referralId,
    userId,
    type,
    title,
    content,
    simulated: true,
  })

  // Simulated delivery: always succeeds in the prototype, clearly flagged as simulated
  await recordNotificationAttempt(notification.id, channel, "delivered", true, null)

  return notification
}
