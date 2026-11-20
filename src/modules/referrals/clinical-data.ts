// Fictional demo data. Replace the getters with Drizzle queries later.
// Metacare records what a clinician documents. It never interprets results or suggests tests.

// ---- Consultation -------------------------------------------------------------

export const consultationOutcomes = [
  "assessment_completed",
  "more_information_requested",
  "further_review_required",
  "redirected",
  "other",
] as const
export type ConsultationOutcome = (typeof consultationOutcomes)[number]

export const consultationOutcomeLabels: Record<ConsultationOutcome, string> = {
  assessment_completed: "Assessment completed",
  more_information_requested: "More information requested",
  further_review_required: "Further review required",
  redirected: "Redirected",
  other: "Other",
}

export type Consultation = {
  id: string
  consultingClinician: string
  requestingFrom: string
  date: string // YYYY-MM-DD
  reason: string
  outcome: ConsultationOutcome
  summary: string
  nextAction: string | null
  nextActionOwner: string | null
  nextActionDue: string | null // YYYY-MM-DD
}

// ---- Confirmatory follow-up -----------------------------------------------------

export const followUpRequiredOptions = ["yes", "no", "undetermined"] as const
export type FollowUpRequired = (typeof followUpRequiredOptions)[number]
export const followUpRequiredLabels: Record<FollowUpRequired, string> = {
  yes: "Yes",
  no: "No",
  undetermined: "Undetermined",
}

export const followUpStatuses = [
  "not_ordered",
  "ordered",
  "scheduled",
  "completed",
  "result_pending_review",
  "reviewed",
  "cancelled",
] as const
export type FollowUpStatus = (typeof followUpStatuses)[number]

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  not_ordered: "Not ordered",
  ordered: "Ordered",
  scheduled: "Scheduled",
  completed: "Completed",
  result_pending_review: "Result pending review",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
}

// Valid next statuses. Enforced by the server action as well as the form.
export const followUpTransitions: Record<FollowUpStatus, FollowUpStatus[]> = {
  not_ordered: ["ordered", "cancelled"],
  ordered: ["scheduled", "completed", "cancelled"],
  scheduled: ["completed", "cancelled"],
  completed: ["result_pending_review", "reviewed"],
  result_pending_review: ["reviewed"],
  reviewed: [],
  cancelled: [],
}

export const terminalFollowUpStatuses: FollowUpStatus[] = [
  "reviewed",
  "cancelled",
]

// Statuses that need a completed-at time.
export const completedStatuses: FollowUpStatus[] = [
  "completed",
  "result_pending_review",
  "reviewed",
]

export function isValidFollowUpTransition(
  from: FollowUpStatus,
  to: FollowUpStatus
) {
  if (from === to) return !terminalFollowUpStatuses.includes(from) // edit details in place
  return followUpTransitions[from].includes(to)
}

export type FollowUp = {
  id: string
  required: FollowUpRequired
  label: string
  status: FollowUpStatus
  expectedDate: string | null // YYYY-MM-DD
  orderedBy: string | null
  orderedAt: string | null // YYYY-MM-DDTHH:mm
  completedAt: string | null // YYYY-MM-DDTHH:mm
  reviewedBy: string | null
  reviewedAt: string | null // YYYY-MM-DDTHH:mm
  outcomeSummary: string | null
}

// ---- Helpers ------------------------------------------------------------------------

export type Person = { id: string; name: string }

export function lagosToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date()
  )
}

// "YYYY-MM-DDTHH:mm" in the browser's local time, for datetime-local inputs.
export function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// Naive "YYYY-MM-DDTHH:mm" strings are shown as written, e.g. "16 Nov, 14:00".
// Full ISO strings (from toISOString()) ending in "Z" are used as-is.
export function formatLocalDateTime(s: string) {
  const iso = s.endsWith("Z") ? s : `${s}:00Z`
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso))
}

// ---- Mock data ------------------------------------------------------------------------

export function getClinicianOptions(): Person[] {
  return [
    { id: "u_03", name: "Dr. Emeka Obi" },
    { id: "u_08", name: "Dr. Bisi Alade" },
  ]
}

export function getStaffOptions(): Person[] {
  return [
    { id: "u_03", name: "Dr. Emeka Obi" },
    { id: "u_04", name: "Ngozi Eze" },
    { id: "u_05", name: "Kemi Salami" },
    { id: "u_08", name: "Dr. Bisi Alade" },
  ]
}

export function getConsultations(referralId: string): Consultation[] {
  if (referralId === "r_01") {
    return [
      {
        id: "c1",
        consultingClinician: "Dr. Emeka Obi",
        requestingFrom: "Ibadan Community Clinic",
        date: "2026-11-12",
        reason: "Confirm the next step before the referral appointment.",
        outcome: "further_review_required",
        summary:
          "Further assessment recommended at the receiving facility. Referral priority unchanged.",
        nextAction: "Confirm the appointment date with the receiving facility.",
        nextActionOwner: "Ngozi Eze",
        nextActionDue: "2026-11-18",
      },
    ]
  }
  return []
}

export function getFollowUps(referralId: string): FollowUp[] {
  if (referralId === "r_01") {
    return [
      {
        id: "f1",
        required: "yes",
        label: "Confirmatory assessment (demo)",
        status: "result_pending_review",
        expectedDate: "2026-11-16",
        orderedBy: "Dr. Emeka Obi",
        orderedAt: "2026-11-12T10:30",
        completedAt: "2026-11-16T14:00",
        reviewedBy: null,
        reviewedAt: null,
        outcomeSummary: null,
      },
      {
        id: "f2",
        required: "undetermined",
        label: "Repeat measurement (demo)",
        status: "not_ordered",
        expectedDate: "2026-11-27",
        orderedBy: null,
        orderedAt: null,
        completedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        outcomeSummary: null,
      },
    ]
  }
  if (referralId === "r_02") {
    return [
      {
        id: "f3",
        required: "yes",
        label: "Confirmatory assessment (demo)",
        status: "reviewed",
        expectedDate: "2026-11-09",
        orderedBy: "Dr. Bisi Alade",
        orderedAt: "2026-11-02T11:00",
        completedAt: "2026-11-09T09:30",
        reviewedBy: "Dr. Bisi Alade",
        reviewedAt: "2026-11-10T16:15",
        outcomeSummary:
          "Reviewed by the clinician. No further follow-up recorded.",
      },
    ]
  }
  return []
}
