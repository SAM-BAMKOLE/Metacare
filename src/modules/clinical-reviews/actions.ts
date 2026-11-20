"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import {
  AuthorizationError,
  getCurrentMembership,
  requireRole,
} from "@/server/permissions"
import { createClinicalReview as createClinicalReviewServer } from "@/server/clinical-reviews"

export type ReviewState = { error: string | null }

const schema = z.object({
  screeningId: z.string().min(1),
  followUp: z.enum(["yes", "no"], {
    message: "Choose whether follow-up is required.",
  }),
  recommendation: z.string().trim().min(3, "Enter a next-step recommendation."),
  priority: z.enum(["routine", "urgent", "high"]).optional(),
})

export async function createClinicalReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  // Only clinicians can document a clinical decision. Enforced on the server.
  try {
    await requireRole(["clinician"])
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { error: err.message }
    }
    throw err
  }

  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }

  const priority = formData.get("priority")
  const parsed = schema.safeParse({
    screeningId: formData.get("screeningId"),
    followUp: formData.get("followUp"),
    recommendation: formData.get("recommendation"),
    priority: priority ? priority : undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }
  if (parsed.data.followUp === "yes" && !parsed.data.priority) {
    return { error: "Choose a clinical priority." }
  }

  try {
    await createClinicalReviewServer({
      screeningEventId: parsed.data.screeningId,
      followUpRequired: parsed.data.followUp === "yes",
      nextStepRecommendation: parsed.data.recommendation,
      clinicalPriority: parsed.data.priority ?? undefined,
    })
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to document decision.",
    }
  }

  redirect("/dashboard/screenings")
}
