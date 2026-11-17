"use server"

import { getCurrentMembership } from "@/server/permissions"
import {
  markNotificationRead as markNotificationReadServer,
  markAllNotificationsRead as markAllNotificationsReadServer,
  retryNotification as retryNotificationServer,
} from "@/server/notifications"

export type NotificationResult = { ok: boolean }

export async function setNotificationRead(
  id: string,
  read: boolean
): Promise<NotificationResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { ok: false }
  }

  if (read) {
    try {
      await markNotificationReadServer(id, membership.userId ?? "")
    } catch {
      return { ok: false }
    }
  }

  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<NotificationResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { ok: false }
  }

  try {
    await markAllNotificationsReadServer(membership.userId ?? "")
  } catch {
    return { ok: false }
  }

  return { ok: true }
}

export async function retryNotification(
  id: string
): Promise<NotificationResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { ok: false }
  }

  try {
    await retryNotificationServer(id, membership.userId ?? "")
  } catch {
    return { ok: false }
  }

  return { ok: true }
}
