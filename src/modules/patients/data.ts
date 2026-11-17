// Fictional demo data. Replace with Drizzle queries later.

export type ScreeningStatus =
  | "Awaiting review"
  | "Follow-up required"
  | "No follow-up needed"
  | "Result recorded"

export type ReferralStatus =
  | "Awaiting acknowledgement"
  | "Acknowledged"
  | "In progress"
  | "Awaiting patient action"
  | "Completed"
  | "Declined or redirected"

export type Patient = {
  id: string
  internalId: string
  name: string
  dob: string // ISO
  phone: string
  email?: string
  notes?: string
  organization: string
  latestScreening?: { type: string; date: string; status: ScreeningStatus }
  screenings: {
    id: string
    type: string
    date: string
    location: string
    recordedBy: string
    status: ScreeningStatus
  }[]
  referrals: {
    id: string
    destination: string
    owner: string
    created: string
    due: string
    status: ReferralStatus
    overdue?: boolean
  }[]
  timeline: {
    id: string
    type: string
    title: string
    actor: string
    at: string
    detail?: string
  }[]
}

export const patients: Patient[] = [
  {
    id: "p_01",
    internalId: "MC-00124",
    name: "Adaeze Okonkwo",
    dob: "1984-03-12",
    phone: "+234 803 555 0142",
    email: "adaeze.o@example.com",
    notes: "Prefers phone calls in the afternoon. Speaks English and Igbo.",
    organization: "Ibadan Community Clinic",
    latestScreening: {
      type: "Cervical screening",
      date: "2026-11-09",
      status: "Follow-up required",
    },
    screenings: [
      {
        id: "s_01",
        type: "Cervical screening",
        date: "2026-11-09",
        location: "Ibadan Community Clinic",
        recordedBy: "Funke Adebayo",
        status: "Follow-up required",
      },
      {
        id: "s_02",
        type: "Blood pressure check",
        date: "2025-06-21",
        location: "Mobile outreach, Bodija",
        recordedBy: "Tunde Bello",
        status: "No follow-up needed",
      },
    ],
    referrals: [
      {
        id: "r_01",
        destination: "UCH Ibadan, Gynaecology Clinic",
        owner: "Ngozi Eze",
        created: "2026-11-11",
        due: "2026-11-14",
        status: "Awaiting acknowledgement",
        overdue: true,
      },
    ],
    timeline: [
      {
        id: "t7",
        type: "alert",
        title: "Referral flagged overdue",
        actor: "System",
        at: "2026-11-15T08:00:00Z",
        detail: "No acknowledgement received by due date.",
      },
      {
        id: "t6",
        type: "referral",
        title: "Referral sent",
        actor: "Ngozi Eze",
        at: "2026-11-11T14:20:00Z",
        detail: "Sent to UCH Ibadan, Gynaecology Clinic.",
      },
      {
        id: "t5",
        type: "contact",
        title: "Patient informed",
        actor: "Ngozi Eze",
        at: "2026-11-11T11:05:00Z",
        detail: "Phone call. Patient confirmed next steps.",
      },
      {
        id: "t4",
        type: "case",
        title: "Follow-up case created",
        actor: "Ngozi Eze",
        at: "2026-11-10T16:40:00Z",
      },
      {
        id: "t3",
        type: "review",
        title: "Clinician decision documented",
        actor: "Dr. Emeka Obi",
        at: "2026-11-10T10:12:00Z",
        detail: "Follow-up required.",
      },
      {
        id: "t2",
        type: "review",
        title: "Submitted for clinical review",
        actor: "Funke Adebayo",
        at: "2026-11-09T13:30:00Z",
      },
      {
        id: "t1",
        type: "screening",
        title: "Screening event recorded",
        actor: "Funke Adebayo",
        at: "2026-11-09T13:10:00Z",
      },
    ],
  },
  {
    id: "p_02",
    internalId: "MC-00125",
    name: "Ibrahim Musa",
    dob: "1971-08-30",
    phone: "+234 806 555 0178",
    notes: "",
    organization: "Ibadan Community Clinic",
    latestScreening: {
      type: "Blood pressure check",
      date: "2026-11-12",
      status: "Awaiting review",
    },
    screenings: [
      {
        id: "s_03",
        type: "Blood pressure check",
        date: "2026-11-12",
        location: "Ibadan Community Clinic",
        recordedBy: "Funke Adebayo",
        status: "Awaiting review",
      },
    ],
    referrals: [],
    timeline: [
      {
        id: "t1",
        type: "screening",
        title: "Screening event recorded",
        actor: "Funke Adebayo",
        at: "2026-11-12T09:45:00Z",
      },
    ],
  },
  {
    id: "p_03",
    internalId: "MC-00126",
    name: "Chiamaka Nwosu",
    dob: "1992-01-04",
    phone: "+234 812 555 0109",
    email: "chiamaka.nwosu@example.com",
    organization: "Ibadan Community Clinic",
    latestScreening: {
      type: "Breast screening",
      date: "2026-10-28",
      status: "Follow-up required",
    },
    screenings: [
      {
        id: "s_04",
        type: "Breast screening",
        date: "2026-10-28",
        location: "Ibadan Community Clinic",
        recordedBy: "Tunde Bello",
        status: "Follow-up required",
      },
    ],
    referrals: [
      {
        id: "r_02",
        destination: "Adeoyo Maternity Hospital",
        owner: "Ngozi Eze",
        created: "2026-10-30",
        due: "2026-11-20",
        status: "In progress",
      },
    ],
    timeline: [
      {
        id: "t3",
        type: "referral",
        title: "Referral acknowledged",
        actor: "Adeoyo Maternity Hospital",
        at: "2026-11-02T09:00:00Z",
      },
      {
        id: "t2",
        type: "referral",
        title: "Referral sent",
        actor: "Ngozi Eze",
        at: "2026-10-30T15:00:00Z",
      },
      {
        id: "t1",
        type: "screening",
        title: "Screening event recorded",
        actor: "Tunde Bello",
        at: "2026-10-28T10:20:00Z",
      },
    ],
  },
  {
    id: "p_04",
    internalId: "MC-00127",
    name: "Oluwaseun Adeyemi",
    dob: "1965-11-19",
    phone: "+234 701 555 0166",
    organization: "Ibadan Community Clinic",
    latestScreening: {
      type: "Diabetes screening",
      date: "2026-10-15",
      status: "No follow-up needed",
    },
    screenings: [
      {
        id: "s_05",
        type: "Diabetes screening",
        date: "2026-10-15",
        location: "Mobile outreach, Agodi",
        recordedBy: "Tunde Bello",
        status: "No follow-up needed",
      },
    ],
    referrals: [],
    timeline: [
      {
        id: "t1",
        type: "screening",
        title: "Screening event recorded",
        actor: "Tunde Bello",
        at: "2026-10-15T11:00:00Z",
      },
    ],
  },
  {
    id: "p_05",
    internalId: "MC-00128",
    name: "Halima Yusuf",
    dob: "2001-05-22",
    phone: "+234 909 555 0133",
    organization: "Ibadan Community Clinic",
    screenings: [],
    referrals: [],
    timeline: [],
  },
]

export function getPatient(id: string) {
  return patients.find((p) => p.id === id)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export function ageFromDob(iso: string, today = new Date("2026-11-16")) {
  const d = new Date(iso)
  let age = today.getUTCFullYear() - d.getUTCFullYear()
  const m = today.getUTCMonth() - d.getUTCMonth()
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--
  return age
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
