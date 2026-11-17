import { db } from "@/lib/db"
import { patients, screeningEvents, auditLogs, organizations } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"
import { getCurrentUser } from "./permissions"
import type { ReferralStatus, ScreeningStatus } from "@/modules/patients/data"

export const createPatientSchema = z.object({
  internalId: z.string().min(1, "Internal ID is required"),
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().optional(),
  contactDetails: z.string().optional(),
  administrativeNotes: z.string().optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

export async function createPatient(input: CreatePatientInput, organizationId: string) {
  'use server'
  const user = await getCurrentUser()
  const parsed = createPatientSchema.parse(input)

  const [patient] = await db.insert(patients).values({
    organizationId,
    internalId: parsed.internalId,
    name: parsed.name,
    dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
    contactDetails: parsed.contactDetails ?? null,
    administrativeNotes: parsed.administrativeNotes ?? null,
  }).returning()

  await db.insert(auditLogs).values({
    actorId: user?.id ?? "system",
    action: "patient.create",
    entityType: "patient",
    entityId: patient.id,
    details: `Created patient ${parsed.name} (${parsed.internalId})`,
  })

  return patient
}

export async function listPatients(organizationId: string) {
  'use server'
  return db.select().from(patients).where(eq(patients.organizationId, organizationId)).orderBy(patients.name)
}

export async function getPatient(id: string, organizationId: string) {
  'use server'
  const [patient] = await db.select().from(patients)
    .where(and(eq(patients.id, id), eq(patients.organizationId, organizationId))).limit(1)
  return patient ?? null
}

export interface DirectoryPatient {
  id: string
  internalId: string
  name: string
  dob: string
  phone: string
  email?: string
  notes?: string
  organization: string
  screenings: { id: string; type: string; date: string; location: string; recordedBy: string; status: ScreeningStatus }[]
  referrals: { id: string; destination: string; owner: string; created: string; due: string; status: ReferralStatus; overdue: boolean }[]
  timeline: { id: string; type: string; title: string; actor: string; at: string; detail?: string }[]
  latestScreening?: {
    type: string
    date: string
    status: ScreeningStatus
  }
}

export async function getPatientsForDirectory(organizationId: string): Promise<DirectoryPatient[]> {
  'use server'
  const dbPatients = await listPatients(organizationId)

  const screenings = await db.select().from(screeningEvents)
    .where(eq(screeningEvents.organizationId, organizationId))
    .orderBy(desc(screeningEvents.createdAt))

  const latestByPatient = new Map<string, (typeof screenings)[number]>()
  for (const s of screenings) {
    const cur = latestByPatient.get(s.patientId)
    if (!cur || new Date(s.createdAt) > new Date(cur.createdAt)) {
      latestByPatient.set(s.patientId, s)
    }
  }

  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
  const orgName = org?.name ?? ""

  return dbPatients.map((p) => {
    const latest = latestByPatient.get(p.id)
    return {
      id: p.id,
      internalId: p.internalId,
      name: p.name,
      dob: p.dateOfBirth ? p.dateOfBirth.toISOString() : "",
      phone: p.contactDetails ?? "",
      email: undefined,
      notes: p.administrativeNotes ?? undefined,
      organization: orgName,
      screenings: [],
      referrals: [],
      timeline: [],
      latestScreening: latest
        ? {
            type: latest.screeningType,
            date: latest.screeningDate.toISOString(),
            status: (latest.clinicianConfirmedFollowUp ? "Follow-up required" : "No follow-up needed") as ScreeningStatus,
          }
        : undefined,
    }
  })
}
