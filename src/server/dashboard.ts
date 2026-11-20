import { db } from "@/lib/db"
import {
  referrals,
  screeningEvents,
  careEvents,
  patients,
  notifications,
  notificationAttempts,
} from "@/db/schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"

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

export interface DashboardMetrics {
  screeningEventsRecorded: number
  resultsRequiringFollowUp: number
  openReferrals: number
  unassignedCases: number
  referralsAwaitingAcknowledgement: number
  overdueCases: number
  completedReferrals: number
  casesWithExceptions: number
  referralAcknowledgementRate: number
  followUpCompletionRate: number
  averageTimeToAcknowledgementHours: number | null
  patientCommunicationCoverageRate: number
  patientAcknowledgementRate: number
  documentedOutcomeRate: number
  period: { start: string; end: string }
}

const TERMINAL_STATUSES: ReferralStatus[] = [
  "completed",
  "declined_or_redirected",
  "cancelled",
]
const OPEN_STATUSES: ReferralStatus[] = [
  "draft",
  "pending_assignment",
  "ready_to_send",
  "sent",
  "awaiting_acknowledgement",
  "acknowledged",
  "in_progress",
  "awaiting_patient_action",
  "awaiting_followup_documentation",
]

export async function getDashboardMetrics(
  organizationId: string,
  daysBack = 30,
  opts?: { start?: Date | string; end?: Date | string }
): Promise<DashboardMetrics> {
  'use server'
  const end = opts?.end ? new Date(opts.end) : new Date()
  const start = opts?.start
    ? new Date(opts.start)
    : new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000)

  const screenings = await db
    .select()
    .from(screeningEvents)
    .where(eq(screeningEvents.organizationId, organizationId))
  const referralsOrg = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referringOrganizationId, organizationId))

  const screeningEventsRecorded = screenings.length
  const resultsRequiringFollowUp = screenings.filter(
    (s) => s.requiresClinicalReview
  ).length

  const openReferrals = referralsOrg.filter((r) =>
    OPEN_STATUSES.includes(r.status as ReferralStatus)
  ).length
  const unassignedCases = referralsOrg.filter(
    (r) =>
      !r.assignedOwnerId &&
      OPEN_STATUSES.includes(r.status as ReferralStatus)
  ).length
  const referralsAwaitingAcknowledgement = referralsOrg.filter(
    (r) => r.status === "awaiting_acknowledgement"
  ).length

  const now = new Date()
  const overdueCases = referralsOrg.filter((r) => {
    if (!r.dueDate || TERMINAL_STATUSES.includes(r.status as ReferralStatus))
      return false
    return new Date(r.dueDate) < now
  }).length

  const completedReferrals = referralsOrg.filter(
    (r) => r.status === "completed"
  ).length
  const casesWithExceptions = referralsOrg.filter(
    (r) =>
      r.status === "declined_or_redirected" || r.status === "cancelled"
  ).length

  const sentReferrals = referralsOrg.filter(
    (r) =>
      r.status === "sent" ||
      r.status === "acknowledged" ||
      r.status === "in_progress" ||
      r.status === "completed" ||
      r.status === "declined_or_redirected"
  )
  const acknowledgedReferrals = referralsOrg.filter(
    (r) =>
      r.status === "acknowledged" ||
      r.status === "in_progress" ||
      r.status === "completed"
  )
  const referralAcknowledgementRate = sentReferrals.length > 0
    ? Math.round((acknowledgedReferrals.length / sentReferrals.length) * 100)
    : 0

  const eligibleReferrals = referralsOrg.filter(
    (r) =>
      OPEN_STATUSES.includes(r.status as ReferralStatus) ||
      r.status === "completed"
  )
  const followUpCompletionRate = eligibleReferrals.length > 0
    ? Math.round((completedReferrals / eligibleReferrals.length) * 100)
    : 0

  const acknowledgedWithTimes = referralsOrg.filter(
    (r) =>
      r.status === "acknowledged" ||
      r.status === "in_progress" ||
      r.status === "completed"
  )
  let averageTimeToAcknowledgementHours: number | null = null
  if (acknowledgedWithTimes.length > 0) {
    const totalHours = acknowledgedWithTimes.reduce((sum, r) => {
      const created = new Date(r.createdAt).getTime()
      const diffHours = (now.getTime() - created) / (1000 * 60 * 60)
      return sum + diffHours
    }, 0)
    averageTimeToAcknowledgementHours = Math.round(totalHours / acknowledgedWithTimes.length)
  }

  // Patient communication coverage rate: % of sent+ referrals (created in window) with patientCommunicationStatus === 'contacted'
  const SENT_STATUSES: ReferralStatus[] = [
    "sent",
    "acknowledged",
    "in_progress",
    "awaiting_patient_action",
    "awaiting_followup_documentation",
    "completed",
    "declined_or_redirected",
  ]
  const sentInWindow = referralsOrg.filter((r) => {
    const status = r.status as ReferralStatus
    const created = new Date(r.createdAt)
    return SENT_STATUSES.includes(status) && created >= start && created <= end
  })
  const communicatedInWindow = sentInWindow.filter(
    (r) => r.patientCommunicationStatus === "contacted"
  )
  const patientCommunicationCoverageRate = sentInWindow.length > 0
    ? Math.round((communicatedInWindow.length / sentInWindow.length) * 100)
    : 0

  // Documented outcome rate: % of completed referrals (created in window) with closureOutcome set
  const completedInWindow = referralsOrg.filter((r) => {
    const status = r.status as ReferralStatus
    const created = new Date(r.createdAt)
    return status === "completed" && created >= start && created <= end
  })
  const documentedOutcomeInWindow = completedInWindow.filter(
    (r) => Boolean(r.closureOutcome)
  )
  const documentedOutcomeRate = completedInWindow.length > 0
    ? Math.round((documentedOutcomeInWindow.length / completedInWindow.length) * 100)
    : 0

  // Patient acknowledgement rate: % of notification attempts (in window) with acknowledgementAt set
  const attemptRows = await db
    .select({
      id: notificationAttempts.id,
      acknowledgementAt: notificationAttempts.acknowledgementAt,
      attemptAt: notificationAttempts.attemptAt,
    })
    .from(notificationAttempts)
    .innerJoin(notifications, eq(notificationAttempts.notificationId, notifications.id))
    .innerJoin(referrals, eq(notifications.referralId, referrals.id))
    .where(
      and(
        eq(referrals.referringOrganizationId, organizationId),
        gte(notificationAttempts.attemptAt, start),
        lte(notificationAttempts.attemptAt, end)
      )
    )
  const patientAcknowledgementRate = attemptRows.length > 0
    ? Math.round(
        (attemptRows.filter((a) => a.acknowledgementAt !== null).length /
          attemptRows.length) *
          100
      )
    : 0

  return {
    screeningEventsRecorded,
    resultsRequiringFollowUp,
    openReferrals,
    unassignedCases,
    referralsAwaitingAcknowledgement,
    overdueCases,
    completedReferrals,
    casesWithExceptions,
    referralAcknowledgementRate,
    followUpCompletionRate,
    averageTimeToAcknowledgementHours,
    patientCommunicationCoverageRate,
    patientAcknowledgementRate,
    documentedOutcomeRate,
    period: { start: start.toISOString(), end: end.toISOString() },
  }
}

export interface AttentionItem {
  id: string
  patientName: string
  internalId: string
  destination: string
  reason: "Overdue" | "Unassigned"
  detail: string
}

export async function getAttentionItems(
  organizationId: string
): Promise<AttentionItem[]> {
  'use server'
  const now = new Date()
  const rows = await db
    .select({
      id: referrals.id,
      patientName: patients.name,
      internalId: patients.internalId,
      destination: referrals.receivingProvider,
      status: referrals.status,
      assignedOwnerId: referrals.assignedOwnerId,
      dueDate: referrals.dueDate,
    })
    .from(referrals)
    .innerJoin(patients, eq(referrals.patientId, patients.id))
    .where(eq(referrals.referringOrganizationId, organizationId))

  const items: AttentionItem[] = []
  for (const r of rows) {
    const status = r.status as ReferralStatus
    if (TERMINAL_STATUSES.includes(status)) continue
    if (!r.dueDate || new Date(r.dueDate) >= now) continue
    if (!r.assignedOwnerId) {
      items.push({
        id: r.id,
        patientName: r.patientName,
        internalId: r.internalId,
        destination: r.destination ?? "Not set",
        reason: "Unassigned",
        detail: "No owner assigned",
      })
    } else {
      items.push({
        id: r.id,
        patientName: r.patientName,
        internalId: r.internalId,
        destination: r.destination ?? "Not set",
        reason: "Overdue",
        detail: "Past due date",
      })
    }
  }
  return items
}

export interface StatusCount {
  status: string
  count: number
}

export interface TrendPoint {
  week: string
  ackRate: number
  avgAckHours: number
}

export async function getStatusDistribution(
  organizationId: string
): Promise<StatusCount[]> {
  'use server'
  const rows = await db
    .select({
      status: referrals.status,
    })
    .from(referrals)
    .where(eq(referrals.referringOrganizationId, organizationId))

  const counts: Record<string, number> = {}
  for (const r of rows) {
    const s = r.status as string
    counts[s] = (counts[s] ?? 0) + 1
  }

  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }))
}

export async function getWeeklyTrend(
  organizationId: string,
  weeksBack = 12,
  opts?: { start?: Date | string; end?: Date | string }
): Promise<TrendPoint[]> {
  'use server'
  const now = new Date()
  const end = opts?.end ? new Date(opts.end) : now
  const start = opts?.start
    ? new Date(opts.start)
    : new Date(end.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .where(
      eq(referrals.referringOrganizationId, organizationId)
    )

  // Group by ISO week (YYYY-Www)
  const weekMap: Record<string, { sent: number; ack: number; ackHours: number }> = {}
  for (const r of rows) {
    const created = new Date(r.createdAt)
    if (created < start) continue
    const week = created.toISOString().slice(0, 10) // simple day bucketing
    if (!weekMap[week]) weekMap[week] = { sent: 0, ack: 0, ackHours: 0 }

    const status = r.status as ReferralStatus
    const isSent =
      status === "sent" ||
      status === "acknowledged" ||
      status === "in_progress" ||
      status === "completed" ||
      status === "declined_or_redirected"
    const isAck =
      status === "acknowledged" ||
      status === "in_progress" ||
      status === "completed"
    if (isSent) weekMap[week].sent++
    if (isAck) {
      weekMap[week].ack++
      const diffHours =
        (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      weekMap[week].ackHours += diffHours
    }
  }

  return Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({
      week,
      ackRate: v.sent > 0 ? Math.round((v.ack / v.sent) * 100) : 0,
      avgAckHours: v.ack > 0 ? Math.round(v.ackHours / v.ack) : 0,
    }))
}

export interface ActivityItem {
  id: string
  type: "screening" | "review" | "referral" | "contact" | "alert" | "case"
  title: string
  patientName: string
  actor: string
  at: string
}

export async function getRecentActivity(
  organizationId: string
): Promise<ActivityItem[]> {
  'use server'
  const rows = await db
    .select({
      id: careEvents.id,
      eventType: careEvents.eventType,
      details: careEvents.details,
      timestamp: careEvents.timestamp,
      actorId: careEvents.actorId,
      patientName: patients.name,
    })
    .from(careEvents)
    .innerJoin(patients, eq(careEvents.patientId, patients.id))
    .innerJoin(referrals, eq(careEvents.referralId, referrals.id))
    .where(eq(referrals.referringOrganizationId, organizationId))
    .orderBy(desc(careEvents.timestamp))
    .limit(10)

  // Fetch actor names
  const actorIds = new Set(rows.map((r) => r.actorId))
  const { user: authUser } = await import("@/db/schema/auth")
  const users = await db.select().from(authUser)
  const userMap = new Map<string, string>()
  for (const u of users) {
    if (actorIds.has(u.id)) {
      userMap.set(u.id, u.name ?? u.email ?? u.id)
    }
  }

  const typeMap: Record<string, ActivityItem["type"]> = {
    "Screening event recorded": "screening",
    "Clinician decision documented": "review",
    "Referral created": "referral",
    "Referral sent": "referral",
    "Patient contact attempted": "contact",
    "Patient informed": "contact",
    "Follow-up case created": "case",
    "Referral assigned": "case",
  }

  return rows.map((r) => {
    const type = typeMap[r.eventType] ?? "case"
    return {
      id: r.id,
      type,
      title: r.eventType,
      patientName: r.patientName,
      actor: userMap.get(r.actorId) ?? r.actorId,
      at: r.timestamp.toISOString(),
    }
  })
}
