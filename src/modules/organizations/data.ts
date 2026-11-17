// Fictional demo data. Replace with Drizzle queries later.

export const roleKeys = [
  "organization_admin",
  "screening_staff",
  "clinician",
  "care_coordinator",
  "receiving_provider_staff",
] as const
export type RoleKey = (typeof roleKeys)[number]

export const roleMeta: Record<RoleKey, { label: string; description: string }> =
  {
    organization_admin: {
      label: "Organisation admin",
      description:
        "Manages the workspace and members. Does not automatically see clinical details.",
    },
    screening_staff: {
      label: "Screening staff",
      description: "Registers patients and records screening events.",
    },
    clinician: {
      label: "Clinician",
      description: "Reviews screenings and documents clinical decisions.",
    },
    care_coordinator: {
      label: "Care coordinator",
      description: "Manages referrals, patient contact and escalations.",
    },
    receiving_provider_staff: {
      label: "Receiving provider staff",
      description: "Acknowledges and updates referrals sent to the facility.",
    },
  }

export type MemberStatus = "active" | "invited" | "deactivated"

export type Member = {
  id: string
  name: string // empty for a pending invite
  email: string
  role: RoleKey
  status: MemberStatus
}

export const organization = { id: "org_01", name: "Ibadan Community Clinic" }

export const members: Member[] = [
  {
    id: "u_demo",
    name: "Adaobi Nwankwo",
    email: "adaobi@ibadanclinic.example",
    role: "organization_admin",
    status: "active",
  },
  {
    id: "u_02",
    name: "Funke Adebayo",
    email: "funke@ibadanclinic.example",
    role: "screening_staff",
    status: "active",
  },
  {
    id: "u_03",
    name: "Dr. Emeka Obi",
    email: "emeka@ibadanclinic.example",
    role: "clinician",
    status: "active",
  },
  {
    id: "u_04",
    name: "Ngozi Eze",
    email: "ngozi@ibadanclinic.example",
    role: "care_coordinator",
    status: "active",
  },
  {
    id: "u_05",
    name: "Kemi Salami",
    email: "kemi@ibadanclinic.example",
    role: "care_coordinator",
    status: "active",
  },
  {
    id: "u_06",
    name: "Tunde Bello",
    email: "tunde@ibadanclinic.example",
    role: "screening_staff",
    status: "deactivated",
  },
  {
    id: "u_07",
    name: "",
    email: "ifeoma@ibadanclinic.example",
    role: "care_coordinator",
    status: "invited",
  },
]
