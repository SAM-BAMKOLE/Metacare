"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  AuthorizationError,
  getCurrentMembership,
  requireRole,
} from "@/server/permissions"
import {
  assignOwnerByName as assignOwnerByNameServer,
  createReferral as createReferralServer,
  transitionReferral as transitionReferralServer,
  createEscalation as createEscalationServer,
  acknowledgeEscalation as acknowledgeEscalationServer,
  resolveEscalation as resolveEscalationServer,
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
  try {
    await requireRole([...allowedRoles])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { ok: false, error: err.message }
    }
    throw err
  }

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
  try {
    await requireRole([...allowedRoles])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { ok: false, error: err.message }
    }
    throw err
  }

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

export type CreateReferralResult = { error: string | null; referralId?: string }

export async function createReferral(
  _prev: CreateReferralResult,
  formData: FormData
): Promise<CreateReferralResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole(["care_coordinator", "clinician"])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const schema = z.object({
    patientId: z.string().min(1, "Patient is required."),
    sourceScreeningEventId: z.string().optional().nullable(),
    receivingProvider: z.string().min(1, "Receiving provider is required."),
    priority: z.enum(["routine", "urgent", "high"]).default("routine"),
    dueDate: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
  })

  const parsed = schema.safeParse({
    patientId: formData.get("patientId"),
    sourceScreeningEventId: formData.get("sourceScreeningEventId") ?? undefined,
    receivingProvider: formData.get("receivingProvider"),
    priority: formData.get("priority") ?? "routine",
    dueDate: formData.get("dueDate") ?? undefined,
    instructions: formData.get("instructions") ?? undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }

  try {
    const referral = await createReferralServer(
      {
        patientId: parsed.data.patientId,
        sourceScreeningEventId: parsed.data.sourceScreeningEventId,
        receivingProvider: parsed.data.receivingProvider,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate,
        instructions: parsed.data.instructions,
      },
      membership.organizationId
    )
    return { error: null, referralId: referral.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create referral.",
    }
  }
}

export async function createEscalation(
  referralId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole(["care_coordinator", "clinician", "organization_admin"])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const schema = z.object({
    escalatedToId: z.string().min(1, "Choose the user to escalate to."),
    reason: z.string().min(1, "Escalation reason is required."),
  })

  const parsed = schema.safeParse({
    escalatedToId: formData.get("escalatedToId"),
    reason: formData.get("reason"),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }

  try {
    await createEscalationServer(
      referralId,
      membership.userId ?? "",
      parsed.data.escalatedToId,
      parsed.data.reason,
    )
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to escalate referral.",
    }
  }

  return { error: null }
}

export async function acknowledgeEscalation(
  escalationId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole([
      "care_coordinator",
      "clinician",
      "organization_admin",
      "receiving_provider_staff",
    ])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  try {
    await acknowledgeEscalationServer(escalationId, membership.userId ?? "")
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to acknowledge escalation.",
    }
  }

  return { error: null }
}

export async function resolveEscalation(
  escalationId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole([
      "care_coordinator",
      "clinician",
      "organization_admin",
      "receiving_provider_staff",
    ])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const schema = z.object({
    actionTaken: z.string().min(1, "Action taken is required."),
  })

  const parsed = schema.safeParse({
    actionTaken: formData.get("actionTaken"),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }

  try {
    await resolveEscalationServer(escalationId, membership.userId ?? "", parsed.data.actionTaken)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to resolve escalation.",
    }
  }

  return { error: null }
}