"use server"

import {
  AuthorizationError,
  getCurrentMembership,
  requireRole,
} from "@/server/permissions"
import {
  recordPatientCommunication as recordPatientCommunicationServer,
  acknowledgeReferral as acknowledgeReferralServer,
  closeReferral as closeReferralServer,
} from "@/server/referrals"

export type ActionResult = { error: string | null }

export async function recordPatientCommunication(
  referralId: string,
  formData: FormData
): Promise<ActionResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole([
      "care_coordinator",
      "clinician",
      "screening_staff",
    ])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const channel = formData.get("channel")
  const language = formData.get("language")
  const outcome = formData.get("outcome")
  const acknowledgementAt = formData.get("acknowledgementAt")
  const understanding = formData.get("understanding")
  const concernQuestion = formData.get("concernQuestion")
  const nextStepExplained = formData.get("nextStepExplained") === "on"
  const notes = formData.get("notes") ?? ""

  const allowedChannels = ["Phone call", "SMS (simulated)", "WhatsApp (simulated)", "In person"]
  const allowedOutcomes = [
    "Reached, informed of next step",
    "Reached, needs assistance",
    "No answer",
    "Number unavailable",
    "Declined to proceed",
  ]

  if (!allowedChannels.includes(String(channel))) {
    return { error: "Choose a channel." }
  }
  if (!allowedOutcomes.includes(String(outcome))) {
    return { error: "Choose an outcome." }
  }

  try {
    await recordPatientCommunicationServer(
      referralId,
      String(channel),
      String(language) || null,
      String(outcome),
      String(acknowledgementAt) || null,
      String(understanding) || null,
      String(concernQuestion) || null,
      nextStepExplained,
      String(notes).trim() || null,
      membership.userId ?? ""
    )
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to record contact.",
    }
  }

  return { error: null }
}

export async function acknowledgeReferral(
  referralId: string,
  formData: FormData
): Promise<ActionResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole(["receiving_provider_staff"])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const decision = formData.get("decision")
  const reason = formData.get("reason") ?? ""

  const allowedDecisions = ["acknowledge", "request_info", "decline"]
  if (!allowedDecisions.includes(String(decision))) {
    return { error: "Choose a response." }
  }
  if (String(decision) !== "acknowledge" && String(reason).trim().length < 3) {
    return {
      error: "Add a reason so the referring team knows what to do next.",
    }
  }

  try {
    await acknowledgeReferralServer(
      referralId,
      membership.userId ?? "",
      String(decision) as "acknowledge" | "decline" | "request_info",
      String(reason).trim() || null
    )
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to record response.",
    }
  }

  return { error: null }
}

export async function closeReferral(
  referralId: string,
  formData: FormData,
  acknowledged: boolean
): Promise<ActionResult> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }
  try {
    await requireRole(["clinician"])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const outcome = formData.get("outcome")
  const reason = formData.get("reason")

  const exceptionOutcomes = [
    "Patient declined or could not proceed",
    "Patient could not be reached after the documented process",
    "Other approved exception",
  ]
  const furtherActionOutcomes = ["Further care arranged", "Referral redirected"]
  const closingOutcomes = [
    "Follow-up completed and documented",
    "Referral declined with an alternative plan documented",
    "Patient declined or could not proceed",
    "Patient could not be reached after the documented process",
    "Other approved exception",
  ]
  const allOutcomes = [...closingOutcomes, ...furtherActionOutcomes]

  if (!allOutcomes.includes(String(outcome))) {
    return { error: "Choose an outcome." }
  }
  if (!String(reason).trim() || String(reason).trim().length < 3) {
    return {
      error: "Document the reason for this outcome.",
    }
  }

  if (!acknowledged && !exceptionOutcomes.includes(String(outcome))) {
    return {
      error:
        "This referral has not been acknowledged yet. Only an exception outcome can be recorded.",
    }
  }

  try {
    await closeReferralServer(
      referralId,
      String(outcome),
      String(reason).trim(),
      membership.userId ?? "",
      acknowledged
    )
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to close referral.",
    }
  }

  return { error: null }
}
