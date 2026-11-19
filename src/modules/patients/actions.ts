"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getCurrentMembership } from "@/server/permissions"
import { createPatient as createPatientServer } from "@/server/patients"

export type CreatePatientState = { error: string | null }

const schema = z.object({
  internalId: z.string().min(1, "Internal ID is required."),
  name: z.string().min(1, "Name is required."),
  dateOfBirth: z.string().optional(),
  contactDetails: z.string().optional(),
  administrativeNotes: z.string().optional(),
})

export async function createPatient(
  _prev: CreatePatientState,
  formData: FormData
): Promise<CreatePatientState> {
  const membership = await getCurrentMembership()
  if (!membership) {
    return { error: "No organisation membership found." }
  }

  const parsed = schema.safeParse({
    internalId: formData.get("internalId"),
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth") ?? undefined,
    contactDetails: formData.get("contactDetails") ?? undefined,
    administrativeNotes: formData.get("administrativeNotes") ?? undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    }
  }

  try {
    await createPatientServer(
      {
        internalId: parsed.data.internalId,
        name: parsed.data.name,
        dateOfBirth: parsed.data.dateOfBirth,
        contactDetails: parsed.data.contactDetails,
        administrativeNotes: parsed.data.administrativeNotes,
      },
      membership.organizationId
    )
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create patient.",
    }
  }

  redirect(`/dashboard/patients`)
}
