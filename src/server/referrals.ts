import { db } from "@/lib/db"
import { referrals, careEvents, auditLogs, patients, screeningEvents, notificationAttempts, notifications, confirmatoryFollowUps, escalations } from "@/db/schema"
import { eq, and, desc, isNull } from "drizzle-orm"
import { z } from "zod"
import { getCurrentUser, requireRole } from "./permissions"

export type ReferralStatus =
  | "draft"
  | "pending_assignment"
  | "ready_to_send"
  | "sent"
  | "awaiting_acknowledgement"
  | "acknowledged"
  | "in_progress"
  | "awaiting_patient_action"
  | "awaiting_followup_documentation"
  | "completed"
  | "declined_or_redirected"
  | "cancelled"

export const REFERRAL_STATUSES: ReferralStatus[] = [
  "draft",
  "pending_assignment",
  "ready_to_send",
  "sent",
  "awaiting_acknowledgement",
  "acknowledged",
  "in_progress",
  "awaiting_patient_action",
  "awaiting_followup_documentation",
  "completed",
  "declined_or_redirected",
  "cancelled",
]

// Valid lifecycle transitions per spec §8. Terminal statuses have no outgoing transitions.
const VALID_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  draft: ["pending_assignment", "ready_to_send", "cancelled"],
  pending_assignment: ["ready_to_send", "draft", "declined_or_redirected", "cancelled"],
  ready_to_send: ["sent", "pending_assignment", "declined_or_redirected", "cancelled"],
  sent: ["awaiting_acknowledgement", "declined_or_redirected", "cancelled"],
  awaiting_acknowledgement: ["acknowledged", "declined_or_redirected", "cancelled"],
  acknowledged: ["in_progress", "awaiting_patient_action", "declined_or_redirected", "cancelled"],
  in_progress: ["awaiting_patient_action", "awaiting_followup_documentation", "completed", "declined_or_redirected", "cancelled"],
  awaiting_patient_action: ["in_progress", "awaiting_followup_documentation", "declined_or_redirected", "cancelled"],
  awaiting_followup_documentation: ["completed", "in_progress", "declined_or_redirected", "cancelled"],
  completed: [],
  declined_or_redirected: [],
  cancelled: [],
}

export const createReferralSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  sourceScreeningEventId: z.string().optional().nullable(),
  receivingOrganizationId: z.string().optional().nullable(),
  receivingProvider: z.string().optional().nullable(),
  assignedOwnerId: z.string().optional().nullable(),
  priority: z.enum(["routine", "urgent", "high"]).default("routine"),
  dueDate: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
})

export type CreateReferralInput = z.infer<typeof createReferralSchema>

export async function createReferral(input: CreateReferralInput, referringOrganizationId: string) {
  'use server'
  const user = await getCurrentUser()
  const parsed = createReferralSchema.parse(input)

  const [referral] = await db.insert(referrals).values({
    patientId: parsed.patientId,
    sourceScreeningEventId: parsed.sourceScreeningEventId ?? null,
    referringOrganizationId,
    receivingOrganizationId: parsed.receivingOrganizationId ?? null,
    receivingProvider: parsed.receivingProvider ?? null,
    assignedOwnerId: parsed.assignedOwnerId ?? null,
    priority: parsed.priority,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    status: "draft",
    instructions: parsed.instructions ?? null,
    patientCommunicationStatus: "not_contacted",
    providerAcknowledgementStatus: "not_acknowledged",
  }).returning()

  await db.insert(careEvents).values({
    referralId: referral.id,
    patientId: parsed.patientId,
    actorId: user?.id ?? "system",
    actorRole: "system",
    eventType: "Referral created",
    details: `Referral created in draft status (priority: ${parsed.priority})`,
  })

  await db.insert(auditLogs).values({
    actorId: user?.id ?? "system",
    action: "referral.create",
    entityType: "referral",
    entityId: referral.id,
    details: `Created referral for patient ${parsed.patientId} in draft status`,
  })

  return referral
}

export async function transitionReferral(
  referralId: string,
  toStatus: ReferralStatus,
  actorId: string,
  details?: string,
) {
  'use server'
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const fromStatus = referral.status as ReferralStatus
  const allowed = VALID_TRANSITIONS[fromStatus]
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`)
  }

  const [updated] = await db.update(referrals)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(eq(referrals.id, referralId))
    .returning()

  await db.insert(careEvents).values({
    referralId,
    patientId: referral.patientId,
    actorId,
    actorRole: "system",
    eventType: `Referral status changed: ${fromStatus} → ${toStatus}`,
    details: details ?? `Status transitioned from ${fromStatus} to ${toStatus}`,
  })

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.transition",
    entityType: "referral",
    entityId: referralId,
    details: `Referral ${referralId} transitioned ${fromStatus} → ${toStatus}`,
  })

  return updated
}

export interface ReferralFilters {
  status?: ReferralStatus | ReferralStatus[]
  ownerId?: string
  receivingOrganizationId?: string
  referringOrganizationId?: string
  patientId?: string
  overdue?: boolean
  awaitingAcknowledgement?: boolean
  unassigned?: boolean
}

export async function listReferrals(filters: ReferralFilters = {}) {
  'use server'
  const conditions = []

  if (filters.status && !Array.isArray(filters.status)) {
    conditions.push(eq(referrals.status, filters.status))
  }
  if (filters.ownerId) conditions.push(eq(referrals.assignedOwnerId, filters.ownerId))
  if (filters.receivingOrganizationId) conditions.push(eq(referrals.receivingOrganizationId, filters.receivingOrganizationId))
  if (filters.referringOrganizationId) conditions.push(eq(referrals.referringOrganizationId, filters.referringOrganizationId))
  if (filters.patientId) conditions.push(eq(referrals.patientId, filters.patientId))
  if (filters.unassigned === true) conditions.push(isNull(referrals.assignedOwnerId))
  if (filters.awaitingAcknowledgement === true) conditions.push(eq(referrals.status, "awaiting_acknowledgement"))

  let rows
  if (conditions.length > 0) {
    rows = await db.select().from(referrals).where(and(...conditions)).orderBy(desc(referrals.createdAt))
  } else {
    rows = await db.select().from(referrals).orderBy(desc(referrals.createdAt))
  }

  // Multi-status filter applied in JS (drizzle eq doesn't support IN arrays directly)
  if (filters.status && Array.isArray(filters.status)) {
    rows = rows.filter((r) => filters.status!.includes(r.status as ReferralStatus))
  }

  // Overdue is a computed flag, not a stored status
  if (filters.overdue === true) {
    const now = new Date()
    rows = rows.filter((r) => r.dueDate && new Date(r.dueDate) < now && !["completed", "declined_or_redirected", "cancelled"].includes(r.status as ReferralStatus))
  }

  return rows
}

export async function getReferral(id: string) {
  'use server'
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1)
  return referral ?? null
}

export async function isOverdue(referral: { dueDate: Date | null | string; status: ReferralStatus }) {
  'use server'
  if (!referral.dueDate) return false
  if (["completed", "declined_or_redirected", "cancelled"].includes(referral.status)) return false
  return new Date(referral.dueDate) < new Date()
}

export async function getCareEventsForReferral(referralId: string) {
  'use server'
  return db.select().from(careEvents)
    .where(eq(careEvents.referralId, referralId))
    .orderBy(careEvents.timestamp)
}

export async function getCareEventsForPatient(patientId: string) {
  'use server'
  return db.select().from(careEvents)
    .where(eq(careEvents.patientId, patientId))
    .orderBy(desc(careEvents.timestamp))
}

export async function recordPatientCommunication(
  referralId: string,
  channel: string,
  language: string | null,
  outcome: string,
  acknowledgementAt: string | null,
  understanding: string | null,
  concernQuestion: string | null,
  nextStepExplained: boolean,
  notes: string | null,
  actorId: string,
) {
  'use server'
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1)
  if (!referral) throw new Error("Referral not found")

  await db.insert(careEvents).values({
    referralId,
    patientId: referral.patientId,
    actorId,
    actorRole: "system",
    eventType: "Patient contact attempted",
    details: notes ?? `Patient contact via ${channel}: ${outcome}`,
  })

  const [notification] = await db.insert(notifications).values({
    referralId,
    userId: actorId,
    type: "patient_communication",
    title: `Patient contact via ${channel}`,
    content: notes ?? `Patient contact via ${channel}: ${outcome}`,
    read: false,
    simulated: true,
  }).returning()

  await db.insert(notificationAttempts).values({
    notificationId: notification.id,
    channel,
    language,
    outcome,
    acknowledgementAt: acknowledgementAt ? new Date(acknowledgementAt) : null,
    understanding,
    concernQuestion,
    nextStepExplained,
    simulated: true,
    attemptAt: new Date(),
  })

  const communicationStatus = outcome === "contacted" ? "contacted" : "not_contacted"

  const [updated] = await db.update(referrals)
    .set({ patientCommunicationStatus: communicationStatus, updatedAt: new Date() })
    .where(eq(referrals.id, referralId))
    .returning()

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.patient_communication",
    entityType: "referral",
    entityId: referralId,
    details: `Patient communication recorded: ${channel} -> ${outcome}`,
  })

  return updated
}

export async function acknowledgeReferral(
  referralId: string,
  actorId: string,
  decision: "acknowledge" | "decline" | "request_info",
  reason: string | null,
) {
  'use server'
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1)
  if (!referral) throw new Error("Referral not found")

  let toStatus: ReferralStatus
  switch (decision) {
    case "acknowledge":
      toStatus = "acknowledged"
      break
    case "decline":
      toStatus = "declined_or_redirected"
      break
    case "request_info":
      toStatus = "awaiting_acknowledgement"
      break
  }

  await transitionReferral(referralId, toStatus, actorId, reason ?? `Receiving provider decision: ${decision}`)

  const [updated] = await db.update(referrals)
    .set({ providerAcknowledgementStatus: decision === "acknowledge" ? "acknowledged" : "not_acknowledged" })
    .where(eq(referrals.id, referralId))
    .returning()

  return updated
}

export async function getOverdueReferrals(organizationId: string) {
  'use server'
  const rows = await listReferrals({ referringOrganizationId: organizationId, overdue: true })
  return rows
}

export async function getUnassignedReferrals(organizationId: string) {
  'use server'
  return listReferrals({ referringOrganizationId: organizationId, unassigned: true })
}

export async function getAwaitingAcknowledgementReferrals(organizationId: string) {
  'use server'
  return listReferrals({ referringOrganizationId: organizationId, awaitingAcknowledgement: true })
}

export interface ReferralQueueItem {
  id: string
  patientId: string
  patientName: string
  internalId: string
  destination: string
  owner: string | null
  priority: string
  due: string | null
  status: string
  patientCommunicationStatus: string
  providerAcknowledgementStatus: string
  createdAt: string
}

export async function listReferralsWithDetails(
  organizationId: string
): Promise<ReferralQueueItem[]> {
  'use server'
  const rows = await db.select({
    id: referrals.id,
    patientId: referrals.patientId,
    patientName: patients.name,
    internalId: patients.internalId,
    destination: referrals.receivingProvider,
    ownerId: referrals.assignedOwnerId,
    priority: referrals.priority,
    dueDate: referrals.dueDate,
    status: referrals.status,
    patientCommunicationStatus: referrals.patientCommunicationStatus,
    providerAcknowledgementStatus: referrals.providerAcknowledgementStatus,
    createdAt: referrals.createdAt,
  })
    .from(referrals)
    .innerJoin(patients, eq(referrals.patientId, patients.id))
    .where(eq(referrals.referringOrganizationId, organizationId))
    .orderBy(referrals.createdAt)

  const userIds = new Set<string>()
  rows.forEach((r) => {
    if (r.ownerId) userIds.add(r.ownerId)
  })

  const { user: authUser } = await import("@/db/schema/auth")
  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (userIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }

  const statusLabelMap: Record<string, string> = {
    draft: "Draft",
    pending_assignment: "Pending assignment",
    ready_to_send: "Ready to send",
    sent: "Sent",
    awaiting_acknowledgement: "Awaiting acknowledgement",
    acknowledged: "Acknowledged",
    in_progress: "In progress",
    awaiting_patient_action: "Awaiting patient action",
    awaiting_followup_documentation: "Awaiting follow-up documentation",
    completed: "Completed",
    declined_or_redirected: "Declined or redirected",
    cancelled: "Cancelled",
  }

  const now = new Date()

  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: r.patientName,
    internalId: r.internalId,
    destination: r.destination ?? "Not set",
    owner: r.ownerId ? userMap.get(r.ownerId) ?? null : null,
    priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
    due: r.dueDate ? r.dueDate.toISOString() : null,
    status: statusLabelMap[r.status] ?? r.status,
    patientCommunicationStatus: r.patientCommunicationStatus,
    providerAcknowledgementStatus: r.providerAcknowledgementStatus,
    createdAt: r.createdAt.toISOString(),
    _overdue:
      Boolean(
        r.dueDate &&
          new Date(r.dueDate) < now &&
          !["completed", "declined_or_redirected", "cancelled"].includes(
            r.status as ReferralStatus
          )
      ),
  }))
}

export async function assignOwnerByName(
  referralId: string,
  ownerName: string,
  actorId: string
) {
  'use server'
  const { user: authUser } = await import("@/db/schema/auth")
  const [user] = await db
    .select()
    .from(authUser)
    .where(eq(authUser.name, ownerName))
    .limit(1)
  if (!user) {
    throw new Error(`User "${ownerName}" not found`)
  }

  const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const [updated] = await db.update(referrals)
    .set({ assignedOwnerId: user.id, updatedAt: new Date() })
    .where(eq(referrals.id, referralId))
    .returning()

  if (referral.status === "pending_assignment") {
    await db.update(referrals)
      .set({ status: "ready_to_send", updatedAt: new Date() })
      .where(eq(referrals.id, referralId))
  }

  await db.insert(careEvents).values({
    referralId,
    patientId: referral.patientId,
    actorId,
    actorRole: "system",
    eventType: "Referral assigned",
    details: `Assigned to ${ownerName}`,
  })

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.assign_owner",
    entityType: "referral",
    entityId: referralId,
    details: `Referral ${referralId} assigned to ${ownerName}`,
  })

  return updated
}

export interface ReferralDetail {
  id: string
  code: string
  patientId: string
  patientName: string
  internalId: string
  destination: string
  owner: string | null
  priority: string
  due: string | null
  status: string
  patientCommunicationStatus: string
  providerAcknowledgementStatus: string
  createdAt: string
  referringOrganizationId: string
  sourceScreeningEventId: string | null
  sourceScreening?: {
    id: string
    type: string
    date: string
    patientId: string
  }
  instructions: string | null
}

export async function getReferralDetail(
  id: string,
  organizationId: string
): Promise<ReferralDetail | null> {
  'use server'
  const [row] = await db.select({
    id: referrals.id,
    patientId: referrals.patientId,
    patientName: patients.name,
    internalId: patients.internalId,
    destination: referrals.receivingProvider,
    ownerId: referrals.assignedOwnerId,
    priority: referrals.priority,
    dueDate: referrals.dueDate,
    status: referrals.status,
    patientCommunicationStatus: referrals.patientCommunicationStatus,
    providerAcknowledgementStatus: referrals.providerAcknowledgementStatus,
    createdAt: referrals.createdAt,
    referringOrganizationId: referrals.referringOrganizationId,
    sourceScreeningEventId: referrals.sourceScreeningEventId,
    instructions: referrals.instructions,
  })
    .from(referrals)
    .innerJoin(patients, eq(referrals.patientId, patients.id))
    .where(
      and(
        eq(referrals.id, id),
        eq(referrals.referringOrganizationId, organizationId)
      )
    )
    .limit(1)

  if (!row) return null

  const userIds = new Set<string>()
  if (row.ownerId) userIds.add(row.ownerId)

  const { user: authUser } = await import("@/db/schema/auth")
  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (userIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }

  const statusLabelMap: Record<string, string> = {
    draft: "Draft",
    pending_assignment: "Pending assignment",
    ready_to_send: "Ready to send",
    sent: "Sent",
    awaiting_acknowledgement: "Awaiting acknowledgement",
    acknowledged: "Acknowledged",
    in_progress: "In progress",
    awaiting_patient_action: "Awaiting patient action",
    awaiting_followup_documentation: "Awaiting follow-up documentation",
    completed: "Completed",
    declined_or_redirected: "Declined or redirected",
    cancelled: "Cancelled",
  }

  let sourceScreening: ReferralDetail["sourceScreening"] | undefined
  if (row.sourceScreeningEventId) {
    const [scr] = await db.select({
      id: screeningEvents.id,
      type: screeningEvents.screeningType,
      date: screeningEvents.screeningDate,
      patientId: screeningEvents.patientId,
    })
      .from(screeningEvents)
      .where(eq(screeningEvents.id, row.sourceScreeningEventId))
      .limit(1)
    if (scr) {
      sourceScreening = {
        id: scr.id,
        type: scr.type,
        date: scr.date.toISOString(),
        patientId: scr.patientId,
      }
    }
  }

  const code = `REF-${row.id.replace(/\D/g, "").padStart(4, "0")}`

  return {
    id: row.id,
    code,
    patientId: row.patientId,
    patientName: row.patientName,
    internalId: row.internalId,
    destination: row.destination ?? "Not set",
    owner: row.ownerId ? userMap.get(row.ownerId) ?? null : null,
    priority: row.priority.charAt(0).toUpperCase() + row.priority.slice(1),
    due: row.dueDate ? row.dueDate.toISOString() : null,
    status: statusLabelMap[row.status] ?? row.status,
    patientCommunicationStatus: row.patientCommunicationStatus,
    providerAcknowledgementStatus: row.providerAcknowledgementStatus,
    createdAt: row.createdAt.toISOString(),
    referringOrganizationId: row.referringOrganizationId,
    sourceScreeningEventId: row.sourceScreeningEventId,
    sourceScreening,
    instructions: row.instructions ?? null,
  }
}

export interface ReferralClosureReadiness {
  clinicalReviewDocumented: boolean
  confirmatoryFollowUpRequired: boolean
  confirmatoryFollowUpReviewed: boolean
  patientCommunicationRecorded: boolean
  allPrerequisitesMet: boolean
  missingPrerequisites: string[]
}

export async function getReferralClosureReadiness(
  referralId: string,
  organizationId: string
): Promise<ReferralClosureReadiness | null> {
  'use server'
  const [referral] = await db.select().from(referrals)
    .where(eq(referrals.id, referralId)).limit(1)
  if (!referral) return null

  // 1. Check clinical review documented
  let clinicalReviewDocumented = true // no screening event = no review needed
  if (referral.sourceScreeningEventId) {
    const [screening] = await db.select().from(screeningEvents)
      .where(eq(screeningEvents.id, referral.sourceScreeningEventId)).limit(1)
    clinicalReviewDocumented = screening?.clinicianConfirmedFollowUp ?? false
  }

  // 2. Check confirmatory follow-up
  const [followUp] = await db.select().from(confirmatoryFollowUps)
    .where(eq(confirmatoryFollowUps.referralId, referralId)).limit(1)
  const confirmatoryFollowUpRequired = followUp ? followUp.required === "yes" : false
  const confirmatoryFollowUpReviewed = followUp ? followUp.status === "reviewed" : false

  // 3. Check patient communication recorded
  const patientCommunicationRecorded = referral.patientCommunicationStatus === "contacted"

  const missingPrerequisites: string[] = []
  if (!clinicalReviewDocumented) missingPrerequisites.push("Clinical review")
  if (confirmatoryFollowUpRequired && !confirmatoryFollowUpReviewed) missingPrerequisites.push("Confirmatory follow-up review")
  if (!patientCommunicationRecorded) missingPrerequisites.push("Patient communication")

  return {
    clinicalReviewDocumented,
    confirmatoryFollowUpRequired,
    confirmatoryFollowUpReviewed,
    patientCommunicationRecorded,
    allPrerequisitesMet: missingPrerequisites.length === 0,
    missingPrerequisites,
  }
}

export async function closeReferral(
  referralId: string,
  outcome: string,
  reason: string,
  actorId: string,
  acknowledged: boolean
) {
  'use server'
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const currentStatus = referral.status as ReferralStatus

  // Validate: not acknowledged referrals can only be closed with exception outcomes
  const exceptionOutcomes = [
    "Patient declined or could not proceed",
    "Patient could not be reached after the documented process",
    "Other approved exception",
  ]
  const furtherActionOutcomes = ["Further care arranged", "Referral redirected"]

  if (!acknowledged && !exceptionOutcomes.includes(outcome)) {
    throw new Error("This referral has not been acknowledged yet. Only an exception outcome can be recorded.")
  }

  // ---- Prerequisite checks (evidence-based closure) ----

  // 1. Clinical review must be documented (if there's a source screening event)
  let clinicalReviewDocumented = true // no screening event = no review needed
  if (referral.sourceScreeningEventId) {
    const [screening] = await db.select().from(screeningEvents)
      .where(eq(screeningEvents.id, referral.sourceScreeningEventId)).limit(1)
    if (!screening) {
      throw new Error("Source screening event not found")
    }
    if (!screening.clinicianConfirmedFollowUp) {
      throw new Error("Closure blocked: clinician review has not been documented for the source screening event.")
    }
    clinicalReviewDocumented = true
  }

  // 2. If confirmatory follow-up is required, it must be reviewed
  const [followUp] = await db.select().from(confirmatoryFollowUps)
    .where(eq(confirmatoryFollowUps.referralId, referralId)).limit(1)
  if (followUp && followUp.required === "yes" && followUp.status !== "reviewed") {
    throw new Error("Closure blocked: confirmatory follow-up must be reviewed before closure.")
  }

  // 3. Patient communication must be recorded
  if (referral.patientCommunicationStatus !== "contacted") {
    throw new Error("Closure blocked: patient communication has not been recorded.")
  }

  let toStatus: ReferralStatus
  if (furtherActionOutcomes.includes(outcome)) {
    toStatus = "awaiting_followup_documentation"
  } else {
    toStatus = "completed"
  }

  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${toStatus}`)
  }

  const [updated] = await db.update(referrals)
    .set({ status: toStatus, closureOutcome: outcome, closureReason: reason, updatedAt: new Date() })
    .where(eq(referrals.id, referralId))
    .returning()

  await db.insert(careEvents).values({
    referralId,
    patientId: referral.patientId,
    actorId,
    actorRole: "system",
    eventType: `Referral closed: ${toStatus}`,
    details: `Outcome: ${outcome}. Reason: ${reason}`,
  })

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.close",
    entityType: "referral",
    entityId: referralId,
    details: `Referral ${referralId} closed with outcome: ${outcome}`,
  })

  return updated
}

export const createEscalationSchema = z.object({
  referralId: z.string().min(1, "Referral is required"),
  escalatedToId: z.string().min(1, "Escalated to user is required"),
  reason: z.string().min(1, "Escalation reason is required"),
})

export type CreateEscalationInput = z.infer<typeof createEscalationSchema>

export async function createEscalation(
  referralId: string,
  actorId: string,
  escalatedToId: string,
  reason: string,
) {
  'use server'

  // Verify the referral exists
  const [referral] = await db.select().from(referrals)
    .where(eq(referrals.id, referralId)).limit(1)
  if (!referral) {
    throw new Error("Referral not found")
  }

  const [escalation] = await db.insert(escalations).values({
    referralId: referralId,
    escalatedBy: actorId,
    escalatedTo: escalatedToId,
    reason,
  }).returning()

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.escalate",
    entityType: "referral",
    entityId: referralId,
    details: `Referral ${referralId} escalated: ${reason}`,
  })

  return escalation
}

export const acknowledgeEscalationSchema = z.object({
  escalationId: z.string().min(1, "Escalation is required"),
})

export type AcknowledgeEscalationInput = z.infer<typeof acknowledgeEscalationSchema>

export async function acknowledgeEscalation(
  escalationId: string,
  actorId: string,
) {
  'use server'

  const [escalation] = await db.select().from(escalations)
    .where(eq(escalations.id, escalationId)).limit(1)
  if (!escalation) {
    throw new Error("Escalation not found")
  }

  const [updated] = await db.update(escalations)
    .set({ acknowledgedAt: new Date(), acknowledgedBy: actorId })
    .where(eq(escalations.id, escalationId))
    .returning()

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.escalation.acknowledge",
    entityType: "escalation",
    entityId: escalationId,
    details: `Escalation ${escalationId} acknowledged`,
  })

  return updated
}

export const resolveEscalationSchema = z.object({
  escalationId: z.string().min(1, "Escalation is required"),
  actionTaken: z.string().min(1, "Action taken is required"),
})

export type ResolveEscalationInput = z.infer<typeof resolveEscalationSchema>

export async function resolveEscalation(
  escalationId: string,
  actorId: string,
  actionTaken: string,
) {
  'use server'

  const [escalation] = await db.select().from(escalations)
    .where(eq(escalations.id, escalationId)).limit(1)
  if (!escalation) {
    throw new Error("Escalation not found")
  }

  const [updated] = await db.update(escalations)
    .set({ actionTaken })
    .where(eq(escalations.id, escalationId))
    .returning()

  await db.insert(auditLogs).values({
    actorId,
    action: "referral.escalation.resolve",
    entityType: "escalation",
    entityId: escalationId,
    details: `Escalation ${escalationId} resolved: ${actionTaken}`,
  })

  return updated
}

export async function getEscalationsForReferral(referralId: string) {
  'use server'
  return db.select().from(escalations)
    .where(eq(escalations.referralId, referralId))
    .orderBy(escalations.createdAt)
}

export async function getEscalationsForOrg(organizationId: string) {
  'use server'
  const rows = await db.select({
    id: escalations.id,
    referralId: escalations.referralId,
    reason: escalations.reason,
    escalatedBy: escalations.escalatedBy,
    escalatedTo: escalations.escalatedTo,
    createdAt: escalations.createdAt,
    acknowledgedAt: escalations.acknowledgedAt,
    acknowledgedBy: escalations.acknowledgedBy,
    actionTaken: escalations.actionTaken,
  })
    .from(escalations)
    .innerJoin(referrals, eq(escalations.referralId, referrals.id))
    .where(eq(referrals.referringOrganizationId, organizationId))
    .orderBy(escalations.createdAt)

  const userIds = new Set<string>()
  rows.forEach((r) => {
    if (r.escalatedBy) userIds.add(r.escalatedBy)
    if (r.escalatedTo) userIds.add(r.escalatedTo)
    if (r.acknowledgedBy) userIds.add(r.acknowledgedBy)
  })

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
    referralId: r.referralId,
    reason: r.reason,
    escalatedBy: userMap.get(r.escalatedBy) ?? r.escalatedBy,
    escalatedTo: userMap.get(r.escalatedTo) ?? r.escalatedTo,
    createdAt: r.createdAt.toISOString(),
    acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: r.acknowledgedBy ? userMap.get(r.acknowledgedBy) ?? r.acknowledgedBy : "",
    actionTaken: r.actionTaken,
  }))
}

export interface NotificationAttemptItem {
  id: string
  channel: string
  language: string | null
  outcome: string
  acknowledgementAt: string | null
  understanding: string | null
  concernQuestion: string | null
  nextStepExplained: boolean
  attemptAt: string
  actor: string
}

export async function getNotificationAttemptsForReferral(
  referralId: string
): Promise<NotificationAttemptItem[]> {
  'use server'
  const rows = await db
    .select({
      id: notificationAttempts.id,
      channel: notificationAttempts.channel,
      language: notificationAttempts.language,
      outcome: notificationAttempts.outcome,
      acknowledgementAt: notificationAttempts.acknowledgementAt,
      understanding: notificationAttempts.understanding,
      concernQuestion: notificationAttempts.concernQuestion,
      nextStepExplained: notificationAttempts.nextStepExplained,
      attemptAt: notificationAttempts.attemptAt,
      actorId: notifications.userId,
    })
    .from(notificationAttempts)
    .innerJoin(notifications, eq(notificationAttempts.notificationId, notifications.id))
    .where(eq(notifications.referralId, referralId))
    .orderBy(notificationAttempts.attemptAt)

  const actorIds = new Set(rows.map((r) => r.actorId))
  const { user: authUser } = await import("@/db/schema/auth")
  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (actorIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    channel: r.channel,
    language: r.language,
    outcome: r.outcome,
    acknowledgementAt: r.acknowledgementAt?.toISOString() ?? null,
    understanding: r.understanding,
    concernQuestion: r.concernQuestion,
    nextStepExplained: r.nextStepExplained,
    attemptAt: r.attemptAt.toISOString(),
    actor: userMap.get(r.actorId) ?? r.actorId,
  }))
}

