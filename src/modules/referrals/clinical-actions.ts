"use server"

import { z } from "zod"

import {
  createClinicalConsultation as createClinicalConsultationServer,
  createConfirmatoryFollowUp as createConfirmatoryFollowUpServer,
  updateConfirmatoryFollowUp as updateConfirmatoryFollowUpServer,
} from "@/server/clinical-reviews"
import {
  AuthorizationError,
  getCurrentMembership,
  requireRole,
} from "@/server/permissions"

export type ClinicalResult = { error: string | null; id?: string }

const date = (msg: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, msg)
const dateTime = (msg: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, msg)

// Empty form fields become undefined so "optional" works.
const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "" ? undefined : s
}
const first = (e: { issues: { message: string }[] }) =>
  e.issues[0]?.message ?? "Check the form and try again."

// Only clinicians can document consultations and follow-up. Enforced here on the server.
// TODO: confirm the referral belongs to the clinician's organisation,
// write an audit entry that names the action and record but does NOT copy the clinical
// text, then revalidatePath(`/dashboard/referrals/${referralId}`).

const consultationSchema = z
  .object({
    consultingClinicianId: z
      .string()
      .min(1, "Choose the consulting clinician."),
    requestingFrom: z
      .string()
      .trim()
      .min(2, "Enter the requesting clinician or facility.")
      .max(200),
    date: date("Enter the consultation date."),
    reason: z
      .string()
      .trim()
      .min(3, "Enter the reason for the consultation.")
      .max(1000),
    outcome: z.enum([
      "assessment_completed",
      "more_information_requested",
      "further_review_required",
      "redirected",
      "other",
    ]),
    summary: z
      .string()
      .trim()
      .min(3, "Enter a summary or recommendation.")
      .max(2000),
    nextAction: z.string().max(1000).optional(),
    nextActionOwnerId: z.string().optional(),
    nextActionDue: date("Enter a valid due date.").optional(),
  })
  .superRefine((v, ctx) => {
    if (v.nextAction && (!v.nextActionOwnerId || !v.nextActionDue)) {
      ctx.addIssue({
        code: "custom",
        message: "Add an owner and a due date for the next action.",
      })
    }
  })

export async function createClinicalConsultation(
  referralId: string,
  formData: FormData
): Promise<ClinicalResult> {
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

  const parsed = consultationSchema.safeParse({
    consultingClinicianId: String(formData.get("consultingClinicianId") ?? ""),
    requestingFrom: formData.get("requestingFrom") ?? "",
    date: formData.get("date") ?? "",
    reason: formData.get("reason") ?? "",
    outcome: formData.get("outcome"),
    summary: formData.get("summary") ?? "",
    nextAction: opt(formData.get("nextAction")),
    nextActionOwnerId: opt(formData.get("nextActionOwnerId")),
    nextActionDue: opt(formData.get("nextActionDue")),
  })
  if (!parsed.success) return { error: first(parsed.error) }

  try {
    const created = await createClinicalConsultationServer({
      referralId,
      consultingClinicianId: parsed.data.consultingClinicianId,
      requestingClinicianOrFacility: parsed.data.requestingFrom,
      consultationDate: parsed.data.date,
      reason: parsed.data.reason,
      outcome: parsed.data.outcome,
      summaryRecommendation: parsed.data.summary ?? null,
      nextAction: parsed.data.nextAction,
      nextActionOwnerId: parsed.data.nextActionOwnerId,
      nextActionDueDate: parsed.data.nextActionDue,
    })
    return { error: null, id: created.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to record consultation.",
    }
  }
}

const followUpSchema = z
  .object({
    required: z.enum([
      "yes",
      "no",
      "undetermined",
    ]).default("yes"),
    label: z.string().trim().max(200).optional(),
    expectedDate: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.required !== "no" && (!v.label || v.label.length < 2)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a label for the test or assessment.",
      })
    }
  })

export async function createConfirmatoryFollowUp(
  referralId: string,
  formData: FormData
): Promise<ClinicalResult> {
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

  const parsed = followUpSchema.safeParse({
    required: String(formData.get("required") ?? "yes"),
    label: opt(formData.get("label")),
    expectedDate: opt(formData.get("expectedDate")),
  })
  if (!parsed.success) return { error: first(parsed.error) }

  try {
    const created = await createConfirmatoryFollowUpServer({
      referralId,
      required: parsed.data.required,
      testAssessmentLabel: parsed.data.label ?? "",
      expectedDate: parsed.data.expectedDate,
    })
    return { error: null, id: created.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to record follow-up.",
    }
  }
}

const updateSchema = z
  .object({
    status: z.enum([
      "not_ordered",
      "ordered",
      "scheduled",
      "completed",
      "result_pending_review",
      "reviewed",
      "cancelled",
    ]),
    completedAt: z.string().optional(),
    reviewedById: z.string().optional(),
    reviewedAt: z.string().optional(),
    outcomeSummary: z.string().max(2000).optional(),
  })
  .superRefine((v, ctx) => {
    if (
      [
        "completed",
        "result_pending_review",
        "reviewed",
      ].includes(v.status) &&
      !v.completedAt
    ) {
      ctx.addIssue({ code: "custom", message: "Enter when it was completed." })
    }
    if (v.status === "reviewed") {
      if (!v.reviewedById)
        ctx.addIssue({ code: "custom", message: "Choose who reviewed it." })
      if (!v.reviewedAt)
        ctx.addIssue({ code: "custom", message: "Enter when it was reviewed." })
      if (!v.outcomeSummary)
        ctx.addIssue({ code: "custom", message: "Add an outcome summary." })
      if (v.completedAt && v.reviewedAt && v.reviewedAt < v.completedAt) {
        ctx.addIssue({
          code: "custom",
          message: "Reviewed time cannot be before the completed time.",
        })
      }
    }
  })

export async function updateConfirmatoryFollowUp(
  followUpId: string,
  formData: FormData
): Promise<ClinicalResult> {
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

  const parsed = updateSchema.safeParse({
    status: formData.get("status"),
    completedAt: opt(formData.get("completedAt")),
    reviewedById: opt(formData.get("reviewedById")),
    reviewedAt: opt(formData.get("reviewedAt")),
    outcomeSummary: opt(formData.get("outcomeSummary")),
  })
  if (!parsed.success) return { error: first(parsed.error) }

  try {
    await updateConfirmatoryFollowUpServer({
      followUpId,
      status: parsed.data.status,
      completedAt: parsed.data.completedAt,
      reviewedBy: parsed.data.reviewedById,
      reviewedAt: parsed.data.reviewedAt,
      outcomeSummary: parsed.data.outcomeSummary,
    })
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update follow-up.",
    }
  }

  return { error: null }
}