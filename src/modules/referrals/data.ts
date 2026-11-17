// Fictional demo data. Replace with Drizzle queries later.

export type ReferralStatus =
  | "Draft"
  | "Pending assignment"
  | "Ready to send"
  | "Sent"
  | "Awaiting acknowledgement"
  | "Acknowledged"
  | "In progress"
  | "Awaiting patient action"
  | "Awaiting follow-up documentation"
  | "Completed"
  | "Declined or redirected"
  | "Cancelled"

export const terminalStatuses: ReferralStatus[] = [
  "Completed",
  "Declined or redirected",
  "Cancelled",
]

// Valid transitions are enforced by application logic, not free-form edits.
export const transitions: Record<ReferralStatus, ReferralStatus[]> = {
  Draft: ["Pending assignment", "Ready to send", "Cancelled"],
  "Pending assignment": ["Ready to send", "Cancelled"],
  "Ready to send": ["Sent", "Cancelled"],
  Sent: ["Awaiting acknowledgement", "Cancelled"],
  "Awaiting acknowledgement": [
    "Acknowledged",
    "Declined or redirected",
    "Cancelled",
  ],
  Acknowledged: ["In progress", "Declined or redirected"],
  "In progress": [
    "Awaiting patient action",
    "Awaiting follow-up documentation",
    "Declined or redirected",
  ],
  "Awaiting patient action": [
    "In progress",
    "Awaiting follow-up documentation",
    "Cancelled",
  ],
  "Awaiting follow-up documentation": ["In progress", "Completed"],
  Completed: [],
  "Declined or redirected": [],
  Cancelled: [],
}

export function isValidTransition(from: ReferralStatus, to: ReferralStatus) {
  return transitions[from].includes(to)
}

export type Priority = "Routine" | "Urgent" | "High"

export type QueueReferral = {
  id: string
  patientName: string
  internalId: string
  destination: string
  owner: string | null
  priority: Priority
  due: string // ISO date
  status: ReferralStatus
  patientContacted: boolean
  blocked?: string // reason, when blocked by missing information
  closureReview?: boolean
}

export const owners = ["Ngozi Eze", "Kemi Salami", "Tunde Bello"]
export const destinations = [
  "UCH Ibadan, Gynaecology Clinic",
  "UCH Ibadan, Cardiology",
  "UCH Ibadan, Endocrinology",
  "Adeoyo Maternity Hospital",
]

export const referrals: QueueReferral[] = [
  {
    id: "r_01",
    patientName: "Adaeze Okonkwo",
    internalId: "MC-00124",
    destination: "UCH Ibadan, Gynaecology Clinic",
    owner: "Ngozi Eze",
    priority: "High",
    due: "2026-11-14",
    status: "Awaiting acknowledgement",
    patientContacted: true,
  },
  {
    id: "r_07",
    patientName: "Kelechi Obiora",
    internalId: "MC-00131",
    destination: "Adeoyo Maternity Hospital",
    owner: "Kemi Salami",
    priority: "Urgent",
    due: "2026-11-15",
    status: "Awaiting follow-up documentation",
    patientContacted: true,
  },
  {
    id: "r_09",
    patientName: "Bola Ajayi",
    internalId: "MC-00133",
    destination: "UCH Ibadan, Cardiology",
    owner: null,
    priority: "Routine",
    due: "2026-11-23",
    status: "Pending assignment",
    patientContacted: false,
  },
  {
    id: "r_10",
    patientName: "Sadiq Lawal",
    internalId: "MC-00135",
    destination: "Adeoyo Maternity Hospital",
    owner: null,
    priority: "Urgent",
    due: "2026-11-21",
    status: "Pending assignment",
    patientContacted: false,
  },
  {
    id: "r_02",
    patientName: "Chiamaka Nwosu",
    internalId: "MC-00126",
    destination: "Adeoyo Maternity Hospital",
    owner: "Ngozi Eze",
    priority: "Urgent",
    due: "2026-11-20",
    status: "In progress",
    patientContacted: true,
  },
  {
    id: "r_11",
    patientName: "Funmi Adebisi",
    internalId: "MC-00137",
    destination: "UCH Ibadan, Endocrinology",
    owner: "Kemi Salami",
    priority: "Routine",
    due: "2026-11-19",
    status: "Ready to send",
    patientContacted: true,
  },
  {
    id: "r_12",
    patientName: "Emeka Nnadi",
    internalId: "MC-00138",
    destination: "UCH Ibadan, Cardiology",
    owner: "Ngozi Eze",
    priority: "Urgent",
    due: "2026-11-18",
    status: "Awaiting patient action",
    patientContacted: false,
  },
  {
    id: "r_13",
    patientName: "Taiwo Balogun",
    internalId: "MC-00139",
    destination: "Adeoyo Maternity Hospital",
    owner: "Kemi Salami",
    priority: "Routine",
    due: "2026-11-25",
    status: "Draft",
    patientContacted: true,
    blocked: "Missing contact address for referral letter",
  },
  {
    id: "r_14",
    patientName: "Yetunde Alabi",
    internalId: "MC-00140",
    destination: "UCH Ibadan, Endocrinology",
    owner: "Kemi Salami",
    priority: "Routine",
    due: "2026-11-17",
    status: "In progress",
    patientContacted: true,
    closureReview: true,
  },
  {
    id: "r_15",
    patientName: "Rasheed Ogunleye",
    internalId: "MC-00141",
    destination: "UCH Ibadan, Cardiology",
    owner: "Ngozi Eze",
    priority: "Routine",
    due: "2026-11-10",
    status: "Completed",
    patientContacted: true,
  },
]

// ---- Queue logic -----------------------------------------------------------

export type QueueCategory =
  | "unassigned"
  | "transmission"
  | "acknowledgement"
  | "contact"
  | "approaching"
  | "overdue"
  | "blocked"
  | "documentation"
  | "closure"

export const categoryDefs: { key: QueueCategory; label: string }[] = [
  { key: "unassigned", label: "Unassigned" },
  { key: "transmission", label: "Awaiting transmission" },
  { key: "acknowledgement", label: "Awaiting acknowledgement" },
  { key: "contact", label: "Patients awaiting contact" },
  { key: "approaching", label: "Approaching due date" },
  { key: "overdue", label: "Overdue" },
  { key: "blocked", label: "Blocked" },
  { key: "documentation", label: "Awaiting documentation" },
  { key: "closure", label: "Awaiting closure review" },
]

export function isOpen(r: QueueReferral) {
  return !terminalStatuses.includes(r.status)
}

export function daysUntil(due: string, today: string) {
  return Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000)
}

export function isOverdue(r: QueueReferral, today: string) {
  return isOpen(r) && daysUntil(r.due, today) < 0
}

export function inCategory(
  r: QueueReferral,
  cat: QueueCategory,
  today: string
) {
  if (!isOpen(r)) return false
  switch (cat) {
    case "unassigned":
      return r.owner === null
    case "transmission":
      return r.status === "Ready to send"
    case "acknowledgement":
      return r.status === "Sent" || r.status === "Awaiting acknowledgement"
    case "contact":
      return !r.patientContacted
    case "approaching": {
      const d = daysUntil(r.due, today)
      return d >= 0 && d <= 5
    }
    case "overdue":
      return isOverdue(r, today)
    case "blocked":
      return Boolean(r.blocked)
    case "documentation":
      return r.status === "Awaiting follow-up documentation"
    case "closure":
      return Boolean(r.closureReview)
  }
}
