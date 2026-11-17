"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getCurrentMembership } from "@/server/permissions"
import { createScreening as createScreeningServer, type CreateScreeningInput } from "@/server/screenings"

export type ActionState = { error: string | null }

const schema = z.object({
  patientId: z.string().min(1, "Select a patient."),
  type: z.string().min(1, "Choose a screening type."),
  date: z.string().min(1, "Enter the screening date."),
  location: z.string().trim().min(1, "Enter the screening location."),
  resultCategory: z.enum(
    ["Within expected range", "Outside expected range", "Inconclusive"],
    {
      message: "Choose a result category.",
    }
  ),
  notes: z.string().optional(),
  requiresReview: z.boolean(),
})

export async function createScreening(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }

  const parsed = schema.safeParse({
    patientId: formData.get("patientId"),
    type: formData.get("type"),
    date: formData.get("date"),
    location: formData.get("location"),
    resultCategory: formData.get("resultCategory"),
    notes: formData.get("notes") ?? "",
    requiresReview: formData.get("requiresReview") === "on",
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }

  const input: CreateScreeningInput = {
    patientId: parsed.data.patientId,
    screeningType: parsed.data.type,
    screeningDate: parsed.data.date,
    location: parsed.data.location,
    resultCategory: parsed.data.resultCategory,
    resultNotes: parsed.data.notes,
    requiresClinicalReview: parsed.data.requiresReview,
  }

  try {
    await createScreeningServer(input, membership.organizationId)
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to record screening.",
    }
  }

  redirect(`/dashboard/patients/${parsed.data.patientId}`)
}
