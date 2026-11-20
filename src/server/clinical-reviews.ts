import { db } from "@/lib/db"
import {
  clinicalReviews,
  screeningEvents,
  auditLogs,
  clinicalConsultations,
  confirmatoryFollowUps,
  referrals,
} from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"
import { getCurrentUser, requireRole } from "./permissions"

export const createClinicalReviewSchema = z.object({
  screeningEventId: z.string().min(1, "Screening event is required"),
  followUpRequired: z.boolean(),
  nextStepRecommendation: z.string().optional(),
  clinicalPriority: z.enum(["routine", "urgent", "high"]).optional(),
})

export type CreateClinicalReviewInput = z.infer<typeof createClinicalReviewSchema>

export async function createClinicalReview(input: CreateClinicalReviewInput) {
  'use server'
  const user = await getCurrentUser()
  await requireRole(["clinician"])

  const parsed = createClinicalReviewSchema.parse(input)

  // Verify the screening event exists
  const [screening] = await db.select().from(screeningEvents)
    .where(eq(screeningEvents.id, parsed.screeningEventId)).limit(1)
  if (!screening) {
    throw new Error("Screening event not found")
  }

  const [review] = await db.insert(clinicalReviews).values({
    screeningEventId: parsed.screeningEventId,
    clinicianId: user!.id,
    followUpRequired: parsed.followUpRequired,
    nextStepRecommendation: parsed.nextStepRecommendation ?? null,
    clinicalPriority: parsed.clinicalPriority ?? null,
  }).returning()

  // Mark the screening as clinically reviewed
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, parsed.screeningEventId))

  await db.insert(auditLogs).values({
    actorId: user!.id,
    action: "clinical_review.create",
    entityType: "clinical_review",
    entityId: review.id,
    details: `Clinical decision for screening ${parsed.screeningEventId}: followUpRequired=${parsed.followUpRequired}, priority=${parsed.clinicalPriority ?? "none"}`,
  })

  return review
}

export async function getClinicalReviewsForScreening(screeningEventId: string) {
  'use server'
  return db.select().from(clinicalReviews)
    .where(eq(clinicalReviews.screeningEventId, screeningEventId))
    .orderBy(clinicalReviews.createdAt)
}

export async function getPendingClinicalReviews(organizationId: string) {
  'use server'
  return db.select().from(screeningEvents)
    .where(
      and(
        eq(screeningEvents.organizationId, organizationId),
        eq(screeningEvents.requiresClinicalReview, true),
        eq(screeningEvents.clinicianConfirmedFollowUp, false)
      )
    )
    .orderBy(screeningEvents.createdAt)
}

export const createClinicalConsultationSchema = z.object({
  referralId: z.string().min(1, "Referral is required"),
  consultingClinicianId: z.string().min(1, "Consulting clinician is required"),
  requestingClinicianOrFacility: z.string().min(1, "Requesting clinician/facility is required"),
  consultationDate: z.string().min(1, "Consultation date is required"),
  reason: z.string().min(1, "Reason is required"),
  outcome: z.enum([
    "assessment_completed",
    "more_information_requested",
    "further_review_required",
    "redirected",
    "other",
  ]),
  summaryRecommendation: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionOwnerId: z.string().optional(),
  nextActionDueDate: z.string().optional(),
})

export type CreateClinicalConsultationInput = z.infer<typeof createClinicalConsultationSchema>

export async function createClinicalConsultation(input: CreateClinicalConsultationInput) {
  'use server'
  const user = await getCurrentUser()
  await requireRole(["clinician"])

  const parsed = createClinicalConsultationSchema.parse(input)

  // Verify the referral exists
  const [referral] = await db.select().from(referrals)
    .where(eq(referrals.id, parsed.referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const [consultation] = await db.insert(clinicalConsultations).values({
    referralId: parsed.referralId,
    consultingClinicianId: parsed.consultingClinicianId,
    requestingClinicianOrFacility: parsed.requestingClinicianOrFacility,
    consultationDate: new Date(parsed.consultationDate),
    reason: parsed.reason,
    outcome: parsed.outcome,
    summaryRecommendation: parsed.summaryRecommendation ?? null,
    nextAction: parsed.nextAction ?? null,
    nextActionOwnerId: parsed.nextActionOwnerId ?? null,
    nextActionDueDate: parsed.nextActionDueDate ? new Date(parsed.nextActionDueDate) : null,
  }).returning()

  await db.insert(auditLogs).values({
    actorId: user!.id,
    action: "clinical_consultation.create",
    entityType: "clinical_consultation",
    entityId: consultation.id,
    details: `Clinical consultation for referral ${parsed.referralId}: outcome=${parsed.outcome}`,
  })

  return consultation
}

export const confirmatoryFollowUpSchema = z.object({
  referralId: z.string().min(1, "Referral is required"),
  required: z.enum(["yes", "no", "undetermined"]),
  testAssessmentLabel: z.string().min(1, "Test/assessment label is required"),
  expectedDate: z.string().optional(),
})

export type CreateConfirmatoryFollowUpInput = z.infer<typeof confirmatoryFollowUpSchema>

export async function createConfirmatoryFollowUp(input: CreateConfirmatoryFollowUpInput) {
  'use server'
  const user = await getCurrentUser()
  await requireRole(["clinician"])

  const parsed = confirmatoryFollowUpSchema.parse(input)

  // Verify the referral exists
  const [referral] = await db.select().from(referrals)
    .where(eq(referrals.id, parsed.referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const [followUp] = await db.insert(confirmatoryFollowUps).values({
    referralId: parsed.referralId,
    required: parsed.required,
    testAssessmentLabel: parsed.testAssessmentLabel,
    orderedBy: user!.id,
    orderedAt: new Date(),
    expectedDate: parsed.expectedDate ? new Date(parsed.expectedDate) : null,
    status: "ordered",
  }).returning()

  await db.insert(auditLogs).values({
    actorId: user!.id,
    action: "confirmatory_follow_up.create",
    entityType: "confirmatory_follow_up",
    entityId: followUp.id,
    details: `Confirmatory follow-up for referral ${parsed.referralId}: ${parsed.testAssessmentLabel}, required=${parsed.required}`,
  })

  return followUp
}

export const updateConfirmatoryFollowUpSchema = z.object({
  followUpId: z.string().min(1, "Follow-up is required"),
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
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  outcomeSummary: z.string().optional(),
})

export type UpdateConfirmatoryFollowUpInput = z.infer<typeof updateConfirmatoryFollowUpSchema>

export async function updateConfirmatoryFollowUp(input: UpdateConfirmatoryFollowUpInput) {
  'use server'
  const user = await getCurrentUser()
  await requireRole(["clinician"])

  const parsed = updateConfirmatoryFollowUpSchema.parse(input)

  const [followUp] = await db.select().from(confirmatoryFollowUps)
    .where(eq(confirmatoryFollowUps.id, parsed.followUpId)).limit(1)
  if (!followUp) {
    throw new Error("Follow-up not found")
  }

  const [updated] = await db.update(confirmatoryFollowUps)
    .set({
      status: parsed.status,
      completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null,
      reviewedBy: parsed.reviewedBy ?? user!.id,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : new Date(),
      outcomeSummary: parsed.outcomeSummary ?? null,
    })
    .where(eq(confirmatoryFollowUps.id, parsed.followUpId))
    .returning()

  await db.insert(auditLogs).values({
    actorId: user!.id,
    action: "confirmatory_follow_up.update",
    entityType: "confirmatory_follow_up",
    entityId: parsed.followUpId,
    details: `Confirmatory follow-up updated: status=${parsed.status}`,
  })

  return updated
}

export async function getClinicalConsultationsForReferral(referralId: string) {
  'use server'
  return db.select().from(clinicalConsultations)
    .where(eq(clinicalConsultations.referralId, referralId))
    .orderBy(clinicalConsultations.createdAt)
}

export async function getConfirmatoryFollowUpsForReferral(referralId: string) {
  'use server'
  return db.select().from(confirmatoryFollowUps)
    .where(eq(confirmatoryFollowUps.referralId, referralId))
    .orderBy(confirmatoryFollowUps.createdAt)
}
