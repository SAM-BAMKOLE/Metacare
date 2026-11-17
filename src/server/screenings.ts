import { db } from "@/lib/db"
import { patients, screeningEvents, auditLogs } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"
import { getCurrentUser } from "./permissions"

export interface ScreeningWithPatient {
  id: string
  patientId: string
  patientName: string
  internalId: string
  type: string
  date: string
  location: string
  recordedBy: string
  resultCategory: string
  notes: string | null
  requiresReview: boolean
  status: string
  organizationId: string
}

export interface ScreeningDetail {
  id: string
  patientId: string
  patientName: string
  internalId: string
  type: string
  date: string
  location: string
  recordedBy: string
  resultCategory: string
  notes: string | null
  requiresReview: boolean
  status: string
  organizationId: string
}

export const createScreeningSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  screeningType: z.string().min(1, "Screening type is required"),
  screeningDate: z.string().min(1, "Screening date is required"),
  location: z.string().optional(),
  resultCategory: z.string().min(1, "Result category is required"),
  resultNotes: z.string().optional(),
  requiresClinicalReview: z.boolean().default(false),
})

export type CreateScreeningInput = z.infer<typeof createScreeningSchema>

export async function createScreening(input: CreateScreeningInput, organizationId: string) {
  'use server'
  const user = await getCurrentUser()
  const parsed = createScreeningSchema.parse(input)

  const [screening] = await db.insert(screeningEvents).values({
    patientId: parsed.patientId,
    organizationId,
    screeningType: parsed.screeningType,
    screeningDate: new Date(parsed.screeningDate),
    location: parsed.location ?? null,
    resultCategory: parsed.resultCategory,
    resultNotes: parsed.resultNotes ?? null,
    recordedById: user?.id ?? "system",
    requiresClinicalReview: parsed.requiresClinicalReview ?? false,
    clinicianConfirmedFollowUp: false,
    nextStepRecommendation: null,
  }).returning()

  await db.insert(auditLogs).values({
    actorId: user?.id ?? "system",
    action: "screening.create",
    entityType: "screening_event",
    entityId: screening.id,
    details: `Created screening event ${parsed.screeningType} for patient ${parsed.patientId}`,
  })

  return screening
}

export async function listScreenings(organizationId: string) {
  'use server'
  return db.select().from(screeningEvents)
    .where(eq(screeningEvents.organizationId, organizationId))
    .orderBy(screeningEvents.createdAt)
}

export async function getScreening(id: string, organizationId: string) {
  'use server'
  const [screening] = await db.select().from(screeningEvents)
    .where(and(eq(screeningEvents.id, id), eq(screeningEvents.organizationId, organizationId))).limit(1)
  return screening ?? null
}

export async function listAwaitingClinicalReview(organizationId: string) {
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

export async function listScreeningsWithPatients(organizationId: string): Promise<ScreeningWithPatient[]> {
  'use server'
  const rows = await db.select({
    id: screeningEvents.id,
    patientId: screeningEvents.patientId,
    patientName: patients.name,
    internalId: patients.internalId,
    type: screeningEvents.screeningType,
    date: screeningEvents.screeningDate,
    location: screeningEvents.location,
    recordedById: screeningEvents.recordedById,
    resultCategory: screeningEvents.resultCategory,
    resultNotes: screeningEvents.resultNotes,
    requiresClinicalReview: screeningEvents.requiresClinicalReview,
    clinicianConfirmedFollowUp: screeningEvents.clinicianConfirmedFollowUp,
    createdAt: screeningEvents.createdAt,
  })
    .from(screeningEvents)
    .innerJoin(patients, eq(screeningEvents.patientId, patients.id))
    .where(eq(screeningEvents.organizationId, organizationId))
    .orderBy(desc(screeningEvents.createdAt))

  // Fetch user names for recordedBy
  const userIds = new Set(rows.map((r) => r.recordedById))
  const { user: authUser } = await import("@/db/schema/auth")
  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (userIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: r.patientName,
    internalId: r.internalId,
    type: r.type,
    date: r.date.toISOString(),
    location: r.location ?? "",
    recordedBy: userMap.get(r.recordedById) ?? r.recordedById,
    resultCategory: r.resultCategory,
    notes: r.resultNotes ?? "",
    requiresReview: r.requiresClinicalReview,
    status: r.clinicianConfirmedFollowUp
      ? "Follow-up required"
      : r.requiresClinicalReview
        ? "Awaiting review"
        : "Result recorded",
    organizationId,
  }))
}

export async function getScreeningWithPatient(
  id: string,
  organizationId: string
): Promise<ScreeningDetail | null> {
  'use server'
  const [row] = await db.select({
    id: screeningEvents.id,
    patientId: screeningEvents.patientId,
    patientName: patients.name,
    internalId: patients.internalId,
    type: screeningEvents.screeningType,
    date: screeningEvents.screeningDate,
    location: screeningEvents.location,
    recordedById: screeningEvents.recordedById,
    resultCategory: screeningEvents.resultCategory,
    resultNotes: screeningEvents.resultNotes,
    requiresClinicalReview: screeningEvents.requiresClinicalReview,
    clinicianConfirmedFollowUp: screeningEvents.clinicianConfirmedFollowUp,
  })
    .from(screeningEvents)
    .innerJoin(patients, eq(screeningEvents.patientId, patients.id))
    .where(
      and(
        eq(screeningEvents.id, id),
        eq(screeningEvents.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!row) return null

  const { user: authUser } = await import("@/db/schema/auth")
  const [user] = await db
    .select()
    .from(authUser)
    .where(eq(authUser.id, row.recordedById))
    .limit(1)

  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    internalId: row.internalId,
    type: row.type,
    date: row.date.toISOString(),
    location: row.location ?? "",
    recordedBy: user?.name ?? user?.email ?? row.recordedById,
    resultCategory: row.resultCategory,
    notes: row.resultNotes ?? "",
    requiresReview: row.requiresClinicalReview,
    status: row.clinicianConfirmedFollowUp
      ? "Follow-up required"
      : row.requiresClinicalReview
        ? "Awaiting review"
        : "Result recorded",
    organizationId,
  }
}
