// Fictional demo data. Replace with Drizzle queries later.
import type { TimelineEvent } from "@/components/shared/care-timeline"
import {
  isOpen,
  referrals,
  type QueueReferral,
  type ReferralStatus,
} from "@/modules/referrals/data"
import { getScreening } from "@/modules/screenings/data"

export function refCode(id: string) {
  return `REF-${id.replace(/\D/g, "").padStart(4, "0")}`
}

// ---- Communication ---------------------------------------------------------

export const channels = [
  "Phone call",
  "SMS (simulated)",
  "WhatsApp (simulated)",
  "In person",
] as const
export type Channel = (typeof channels)[number]

export const communicationOutcomes = [
  "Reached, informed of next step",
  "Reached, needs assistance",
  "No answer",
  "Number unavailable",
  "Declined to proceed",
] as const
export type CommOutcome = (typeof communicationOutcomes)[number]

export const notReachedOutcomes: readonly CommOutcome[] = [
  "No answer",
  "Number unavailable",
]

export type Communication = {
  id: string
  channel: Channel
  outcome: CommOutcome
  notes: string
  by: string
  at: string
}

// ---- Acknowledgement -------------------------------------------------------

export type AckState = {
  state: "not_sent" | "pending" | "acknowledged" | "declined" | "info_requested"
  by?: string
  at?: string
  reason?: string
}

// ---- Closure ---------------------------------------------------------------

export const closingOutcomes = [
  "Follow-up completed and documented",
  "Referral declined with an alternative plan documented",
  "Patient declined or could not proceed",
  "Patient could not be reached after the documented process",
  "Other approved exception",
] as const

// Outcomes that need another action, so the case stays open.
export const furtherActionOutcomes = [
  "Further care arranged",
  "Referral redirected",
] as const

// Exceptions can be recorded before the receiving facility has acknowledged.
export const exceptionOutcomes: readonly string[] = [
  "Patient declined or could not proceed",
  "Patient could not be reached after the documented process",
  "Other approved exception",
]

export const allOutcomes: readonly string[] = [
  ...closingOutcomes,
  ...furtherActionOutcomes,
]

// ---- Mock builders ---------------------------------------------------------

const sentStatuses: ReferralStatus[] = [
  "Sent",
  "Awaiting acknowledgement",
  "Acknowledged",
  "In progress",
  "Awaiting patient action",
  "Awaiting follow-up documentation",
  "Completed",
  "Declined or redirected",
]
const ackedStatuses: ReferralStatus[] = [
  "Acknowledged",
  "In progress",
  "Awaiting patient action",
  "Awaiting follow-up documentation",
  "Completed",
]

const sourceScreeningByReferral: Record<string, string> = {
  r_01: "s_01",
  r_02: "s_04",
}

function at(date: string, offsetDays: number, time: string) {
  const d = new Date(`${date}T${time}:00Z`)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString()
}

function find(id: string): QueueReferral | undefined {
  return referrals.find((r) => r.id === id)
}

export function getReferralDetail(id: string) {
  const referral = find(id)
  if (!referral) return undefined

  const screening = sourceScreeningByReferral[id]
    ? getScreening(sourceScreeningByReferral[id])
    : undefined

  return {
    referral,
    code: refCode(id),
    source: screening
      ? {
          type: screening.type,
          date: screening.date,
          patientId: screening.patientId,
        }
      : null,
    referringOrg: "Ibadan Community Clinic",
    instructions:
      "Please attend the receiving facility on the date they confirm with you. Bring a form of identification and keep your phone nearby so the facility can reach you. If you cannot attend, contact the clinic as soon as you can.",
  }
}

export function getCareEventsForReferral(id: string): TimelineEvent[] {
  const r = find(id)
  if (!r) return []

  const today = new Date().toISOString().slice(0, 10)
  const events: TimelineEvent[] = []
  const add = (
    type: string,
    title: string,
    actor: string,
    day: number,
    time: string,
    detail?: string
  ) =>
    events.push({
      id: `${id}-${events.length + 1}`,
      type,
      title,
      actor,
      at: at(r.due, day, time),
      detail,
    })

  const screening = sourceScreeningByReferral[id]
    ? getScreening(sourceScreeningByReferral[id])
    : undefined
  if (screening) {
    add(
      "screening",
      "Screening event recorded",
      screening.recordedBy,
      -9,
      "10:20"
    )
    add(
      "review",
      "Clinician decision documented",
      "Dr. Emeka Obi",
      -8,
      "10:12",
      "Follow-up required."
    )
  }

  const coordinator = r.owner ?? "Care coordinator"
  add("case", "Follow-up case created", coordinator, -7, "16:40")
  if (r.owner)
    add(
      "case",
      "Referral assigned",
      "Care coordinator",
      -7,
      "16:55",
      `Assigned to ${r.owner}.`
    )
  if (r.patientContacted)
    add("contact", "Patient informed", coordinator, -6, "11:05")
  if (sentStatuses.includes(r.status)) {
    add(
      "referral",
      "Referral sent",
      coordinator,
      -5,
      "14:20",
      `Sent to ${r.destination}.`
    )
  }
  if (ackedStatuses.includes(r.status))
    add("referral", "Referral acknowledged", r.destination, -4, "09:00")
  if (r.status === "Declined or redirected") {
    add(
      "referral",
      "Referral declined or redirected",
      r.destination,
      -3,
      "09:30",
      "Reason recorded by the receiving facility."
    )
  }
  if (r.status === "Completed") {
    add(
      "closure",
      "Outcome documented",
      coordinator,
      -1,
      "15:30",
      "Follow-up completed and documented."
    )
  }
  if (r.blocked)
    add("alert", "Referral blocked", "System", -2, "08:00", r.blocked)
  if (isOpen(r) && r.due < today) {
    add(
      "alert",
      "Referral flagged overdue",
      "System",
      1,
      "08:00",
      "Passed its due date with action still outstanding."
    )
  }

  return events.sort((a, b) => b.at.localeCompare(a.at))
}

export function getCommunications(id: string): Communication[] {
  const r = find(id)
  if (!r) return []

  const by = r.owner ?? "Care coordinator"
  const c = (
    n: number,
    channel: Channel,
    outcome: CommOutcome,
    notes: string,
    day: number,
    time: string
  ): Communication => ({
    id: `${id}-c${n}`,
    channel,
    outcome,
    notes,
    by,
    at: at(r.due, day, time),
  })

  if (id === "r_01") {
    return [
      c(
        2,
        "Phone call",
        "Reached, informed of next step",
        "Patient confirmed next steps. Prefers afternoon calls.",
        -6,
        "11:05"
      ),
      c(
        1,
        "Phone call",
        "No answer",
        "No answer. Will retry later today.",
        -6,
        "09:30"
      ),
    ]
  }
  if (id === "r_12") {
    return [
      c(
        2,
        "SMS (simulated)",
        "No answer",
        "Reminder sent. No reply yet.",
        -2,
        "10:00"
      ),
      c(1, "Phone call", "No answer", "Line rang out.", -3, "15:10"),
    ]
  }
  if (r.patientContacted)
    return [
      c(1, "Phone call", "Reached, informed of next step", "", -6, "11:05"),
    ]
  return []
}

export function getAcknowledgement(id: string): AckState {
  const r = find(id)
  if (!r) return { state: "not_sent" }
  if (ackedStatuses.includes(r.status)) {
    return {
      state: "acknowledged",
      by: r.destination,
      at: at(r.due, -4, "09:00"),
    }
  }
  if (r.status === "Declined or redirected") {
    return {
      state: "declined",
      by: r.destination,
      at: at(r.due, -3, "09:30"),
      reason: "Service not available at this facility.",
    }
  }
  if (r.status === "Sent" || r.status === "Awaiting acknowledgement")
    return { state: "pending" }
  return { state: "not_sent" }
}

export function isAcknowledgedStatus(status: ReferralStatus) {
  return ackedStatuses.includes(status)
}
