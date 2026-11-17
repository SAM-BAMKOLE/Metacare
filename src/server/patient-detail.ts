import { db } from "@/lib/db"
import { patients, screeningEvents, referrals as referralsTable, careEvents, user as authUser, organizations } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

export interface DetailScreening {
  id: string
  type: string
  date: string
  location: string
  recordedBy: string
  status: string
}

export interface DetailReferral {
  id: string
  destination: string
  owner: string
  created: string
  due: string | null
  status: string
  overdue: boolean
}

export interface DetailTimelineEvent {
  id: string
  type: "screening" | "review" | "case" | "contact" | "referral" | "alert"
  title: string
  actor: string
  at: string
  detail?: string
}

export interface PatientDetail {
  id: string
  internalId: string
  name: string
  dob: string
  phone: string
  email?: string | null
  notes?: string | null
  organization: string
  screenings: DetailScreening[]
  referrals: DetailReferral[]
  timeline: DetailTimelineEvent[]
}

function screeningStatus(s: { clinicianConfirmedFollowUp: boolean; requiresClinicalReview: boolean }) {
  if (s.clinicianConfirmedFollowUp) return "Follow-up required"
  if (s.requiresClinicalReview) return "Awaiting review"
  return "No follow-up needed"
}

export async function getPatientDetail(id: string, organizationId: string): Promise<PatientDetail | null> {
  'use server'
  const [patient] = await db.select().from(patients)
    .where(and(eq(patients.id, id), eq(patients.organizationId, organizationId))).limit(1)
  if (!patient) return null

  const [orgRow] = await db.select().from(organizations).where(eq(organizations.id, patient.organizationId)).limit(1)
  const orgName = orgRow?.name ?? ""

  // Screenings for this patient
  const dbScreenings = await db.select().from(screeningEvents)
    .where(eq(screeningEvents.patientId, id))
    .orderBy(desc(screeningEvents.createdAt))

  // User names for recordedBy / actors
  const userIds = new Set<string>()
  dbScreenings.forEach((s) => userIds.add(s.recordedById))

  const dbReferrals = await db.select().from(referralsTable)
    .where(eq(referralsTable.patientId, id))
    .orderBy(desc(referralsTable.createdAt))
  dbReferrals.forEach((r) => {
    if (r.assignedOwnerId) userIds.add(r.assignedOwnerId)
  })

  const dbCareEvents = await db.select().from(careEvents)
    .where(eq(careEvents.patientId, id))
    .orderBy(desc(careEvents.timestamp))
  dbCareEvents.forEach((e) => userIds.add(e.actorId))

  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (userIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }
  const getName = (id: string) => userMap.get(id) ?? id

  const now = new Date()

  const screenings: DetailScreening[] = dbScreenings.map((s) => ({
    id: s.id,
    type: s.screeningType,
    date: s.screeningDate.toISOString(),
    location: s.location ?? "",
    recordedBy: getName(s.recordedById),
    status: screeningStatus(s),
  }))

  const referrals: DetailReferral[] = dbReferrals.map((r) => ({
    id: r.id,
    destination: r.receivingProvider ?? r.receivingOrganizationId ?? "Not set",
    owner: r.assignedOwnerId ? getName(r.assignedOwnerId) : "Unassigned",
    created: r.createdAt.toISOString(),
    due: r.dueDate ? r.dueDate.toISOString() : null,
    status: r.status,
    overdue: Boolean(r.dueDate && new Date(r.dueDate) < now && !["completed", "declined_or_redirected", "cancelled"].includes(r.status)),
  }))

  const timeline: DetailTimelineEvent[] = dbCareEvents.map((e) => {
    let type: DetailTimelineEvent["type"] = "case"
    if (e.eventType.includes("Screening")) type = "screening"
    else if (e.eventType.includes("Clinician")) type = "review"
    else if (e.eventType.includes("Referral created") || e.eventType.includes("Referral sent")) type = "referral"
    else if (e.eventType.includes("contact")) type = "contact"
    return {
      id: e.id,
      type,
      title: e.eventType,
      actor: getName(e.actorId),
      at: e.timestamp.toISOString(),
      detail: e.details,
    }
  })

  // Prepend screening events as timeline entries
  for (const s of dbScreenings) {
    timeline.unshift({
      id: `screening-${s.id}`,
      type: "screening",
      title: "Screening event recorded",
      actor: getName(s.recordedById),
      at: s.createdAt.toISOString(),
      detail: `${s.screeningType} · ${s.resultCategory}`,
    })
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return {
    id: patient.id,
    internalId: patient.internalId,
    name: patient.name,
    dob: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : "",
    phone: patient.contactDetails ?? "",
    email: undefined,
    notes: patient.administrativeNotes ?? null,
    organization: orgName,
    screenings,
    referrals,
    timeline,
  }
}
