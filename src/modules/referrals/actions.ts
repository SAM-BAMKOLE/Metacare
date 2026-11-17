"use server"

import { getCurrentMembership, requireRole } from "@/server/permissions"
import {
  assignOwnerByName as assignOwnerByNameServer,
  transitionReferral as transitionReferralServer,
  type ReferralStatus,
} from "@/server/referrals"

const statusLabelToSnake: Record<string, string> = {
  Draft: "draft",
  "Pending assignment": "pending_assignment",
  "Ready to send": "ready_to_send",
  Sent: "sent",
  "Awaiting acknowledgement": "awaiting_acknowledgement",
  Acknowledged: "acknowledged",
  "In progress": "in_progress",
  "Awaiting patient action": "awaiting_patient_action",
  "Awaiting follow-up documentation": "awaiting_followup_documentation",
  Completed: "completed",
  "Declined or redirected": "declined_or_redirected",
  Cancelled: "cancelled",
}

const allowedRoles = ["care_coordinator", "clinician"] as const

export type QueueActionResult = { ok: boolean; error?: string }

export async function assignOwner(
  referralId: string,
  owner: string
): Promise<QueueActionResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { ok: false, error: "No organisation membership found." }
  }
  await requireRole([...allowedRoles])

  if (!referralId || !owner) {
    return { ok: false, error: "Choose an owner." }
  }

  try {
    await assignOwnerByNameServer(referralId, owner, membership.userId ?? "")
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to assign owner.",
    }
  }

  return { ok: true }
}

export async function transitionReferral(
  referralId: string,
  from: string,
  to: string
): Promise<QueueActionResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { ok: false, error: "No organisation membership found." }
  }
  await requireRole([...allowedRoles])

  const toSnake = statusLabelToSnake[to]
  if (!toSnake) {
    return { ok: false, error: `Unknown status "${to}".` }
  }

  try {
    await transitionReferralServer(
      referralId,
      toSnake as ReferralStatus,
      membership.userId ?? "",
      `Status transitioned via work queue`
    )
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to transition referral.",
    }
  }

  return { ok: true }
}
