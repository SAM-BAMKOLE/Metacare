import { db } from "@/lib/db"
import { clinicalReviews, screeningEvents, auditLogs } from "@/db/schema"
import { eq, and } from "drizzle-orm"
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
