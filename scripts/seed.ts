import { db } from "@/lib/db"
import { auth } from "@/server/auth"
import { eq } from "drizzle-orm"
import {
  organizations,
  organizationMemberships,
  patients,
  screeningEvents,
  clinicalReviews,
  referrals,
  careEvents,
  user as authUser,
  account as authAccount,
  session as authSession,
} from "@/db/schema"

const DEMO_PASSWORD = "Demo1234!"

type DemoUser = {
  email: string
  name: string
  role: string
  org: "referring" | "receiving"
}

const DEMO_USERS: DemoUser[] = [
  { email: "admin@community.clinic", name: "Clinic Administrator", role: "organization_admin", org: "referring" },
  { email: "screener@community.clinic", name: "Screening Staff Member", role: "screening_staff", org: "referring" },
  { email: "clinician@community.clinic", name: "Reviewing Clinician", role: "clinician", org: "referring" },
  { email: "coordinator@community.clinic", name: "Care Coordinator", role: "care_coordinator", org: "referring" },
  { email: "admin@receiving.facility", name: "Receiving Facility Admin", role: "organization_admin", org: "receiving" },
  { email: "receiver@receiving.facility", name: "Receiving Provider Staff", role: "receiving_provider_staff", org: "receiving" },
]

async function ensureUser(email: string, name: string, role: string, orgId: string) {
  const existing = await db.select().from(authUser).where(eq(authUser.email, email)).limit(1)
  let userId: string
  if (existing.length > 0) {
    userId = existing[0].id
  } else {
    const created = await auth.api.signUpEmail({
      body: { email, password: DEMO_PASSWORD, name },
    })
    userId = created.user.id
  }
    await db.insert(organizationMemberships).values({
      userId,
      organizationId: orgId,
      role,
    })
  return userId
}

async function main() {
  // Clean previous seed data (FK-safe order)
  await db.delete(careEvents)
  await db.delete(referrals)
  await db.delete(clinicalReviews)
  await db.delete(screeningEvents)
  await db.delete(patients)
  await db.delete(organizationMemberships)
  await db.delete(authAccount)
  await db.delete(authSession)
  await db.delete(authUser)
  await db.delete(organizations)
  // 1. Organizations (idempotent by name)
  type OrgSelect = typeof organizations.$inferSelect
  let referringOrg: OrgSelect | null = null
  let receivingOrg: OrgSelect | null = null
  const existingReferring = await db.select().from(organizations).where(eq(organizations.name, "Community Health Clinic")).limit(1)
  if (existingReferring.length > 0) referringOrg = existingReferring[0]
  else {
    [referringOrg] = await db.insert(organizations).values({ name: "Community Health Clinic" }).returning()
  }
  const existingReceiving = await db.select().from(organizations).where(eq(organizations.name, "Receiving Care Facility")).limit(1)
  if (existingReceiving.length > 0) receivingOrg = existingReceiving[0]
  else {
    [receivingOrg] = await db.insert(organizations).values({ name: "Receiving Care Facility" }).returning()
  }

  const orgByKey = { referring: referringOrg!.id, receiving: receivingOrg!.id }

  // 2. Users + memberships
  const userIds: Record<string, string> = {}
  for (const u of DEMO_USERS) {
    userIds[u.email] = await ensureUser(u.email, u.name, u.role, orgByKey[u.org])
  }

  // 3. Patients
  const upsertPatient = async (values: typeof patients.$inferInsert) => {
    const existing = await db.select().from(patients).where(eq(patients.internalId, values.internalId)).limit(1)
    if (existing.length > 0) return existing[0]
    const [created] = await db.insert(patients).values(values).returning()
    return created
  }

  const patientA = await upsertPatient({
    organizationId: referringOrg.id,
    internalId: "PAT-0001",
    name: "Amara Okonkwo",
    dateOfBirth: new Date("1985-03-12"),
    contactDetails: "08012345678",
    administrativeNotes: "Fictional demonstration patient",
  })
  const patientB = await upsertPatient({
    organizationId: referringOrg.id,
    internalId: "PAT-0002",
    name: "Chidi Bello",
    dateOfBirth: new Date("1972-11-03"),
    contactDetails: "08098765432",
    administrativeNotes: "Fictional demonstration patient",
  })

  // 4. Screening events
  const insertScreening = async (values: typeof screeningEvents.$inferInsert) => {
    const existing = await db.select().from(screeningEvents)
      .where(eq(screeningEvents.patientId, values.patientId)).limit(1)
    if (existing.length > 0) return existing[0]
    const [created] = await db.insert(screeningEvents).values(values).returning()
    return created
  }
  const screeningA = await insertScreening({
    patientId: patientA.id,
    organizationId: referringOrg.id,
    screeningType: "Cervical cancer screening",
    screeningDate: new Date("2026-10-01T09:00:00Z"),
    location: "Community Health Clinic",
    recordedById: userIds["screener@community.clinic"],
    resultCategory: "Abnormal - requires follow-up",
    resultNotes: "Fictional screening result for demonstration.",
    requiresClinicalReview: true,
    clinicianConfirmedFollowUp: false,
    nextStepRecommendation: null,
  })
  const screeningB = await insertScreening({
    patientId: patientB.id,
    organizationId: referringOrg.id,
    screeningType: "Hypertension screening",
    screeningDate: new Date("2026-09-20T10:00:00Z"),
    location: "Community Health Clinic",
    recordedById: userIds["screener@community.clinic"],
    resultCategory: "Normal",
    resultNotes: "Fictional normal screening result.",
    requiresClinicalReview: false,
    clinicianConfirmedFollowUp: false,
    nextStepRecommendation: null,
  })

  // 5. Clinical review for screeningA
  await db.insert(clinicalReviews).values({
    screeningEventId: screeningA.id,
    clinicianId: userIds["clinician@community.clinic"],
    followUpRequired: true,
    nextStepRecommendation: "Refer for further assessment",
    clinicalPriority: "high",
  })
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, screeningA.id))

  // 6. Referrals (mix of statuses to demonstrate queues)
  const insertReferral = async (values: typeof referrals.$inferInsert) => {
    if (values.sourceScreeningEventId) {
      const existing = await db.select().from(referrals)
        .where(eq(referrals.sourceScreeningEventId, values.sourceScreeningEventId)).limit(1)
      if (existing.length > 0) return existing[0]
    }
    const [created] = await db.insert(referrals).values(values).returning()
    return created
  }
  const referralOverdue = await insertReferral({
    patientId: patientA.id,
    sourceScreeningEventId: screeningA.id,
    referringOrganizationId: referringOrg.id,
    receivingOrganizationId: receivingOrg.id,
    receivingProvider: "Cardiology Department",
    assignedOwnerId: userIds["coordinator@community.clinic"],
    priority: "high",
    dueDate: new Date("2026-10-10T00:00:00Z"),
    status: "sent",
    instructions: "Fictional referral instructions for demonstration.",
    patientCommunicationStatus: "contacted",
    providerAcknowledgementStatus: "not_acknowledged",
  })
  await insertReferral({
    patientId: patientB.id,
    sourceScreeningEventId: screeningB.id,
    referringOrganizationId: referringOrg.id,
    receivingOrganizationId: receivingOrg.id,
    receivingProvider: "General Medicine",
    assignedOwnerId: userIds["coordinator@community.clinic"],
    priority: "routine",
    dueDate: new Date("2026-11-30T00:00:00Z"),
    status: "acknowledged",
    instructions: "Fictional referral instructions for demonstration.",
    patientCommunicationStatus: "contacted",
    providerAcknowledgementStatus: "acknowledged",
  })
  await insertReferral({
    patientId: patientA.id,
    sourceScreeningEventId: screeningA.id,
    referringOrganizationId: referringOrg.id,
    receivingOrganizationId: null,
    receivingProvider: null,
    assignedOwnerId: null,
    priority: "routine",
    dueDate: null,
    status: "draft",
    instructions: null,
    patientCommunicationStatus: "not_contacted",
    providerAcknowledgementStatus: "not_acknowledged",
  })

  // 7. Care events (timeline)
  await db.insert(careEvents).values([
    {
      referralId: referralOverdue.id,
      patientId: patientA.id,
      actorId: userIds["screener@community.clinic"],
      actorRole: "screening_staff",
      eventType: "Screening event recorded",
      details: "Fictional: abnormal screening result recorded.",
    },
    {
      referralId: referralOverdue.id,
      patientId: patientA.id,
      actorId: userIds["clinician@community.clinic"],
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Fictional: clinician confirmed follow-up required.",
    },
    {
      referralId: referralOverdue.id,
      patientId: patientA.id,
      actorId: userIds["coordinator@community.clinic"],
      actorRole: "care_coordinator",
      eventType: "Referral created",
      details: "Fictional: referral drafted to receiving facility.",
    },
    {
      referralId: referralOverdue.id,
      patientId: patientA.id,
      actorId: userIds["coordinator@community.clinic"],
      actorRole: "care_coordinator",
      eventType: "Referral sent",
      details: "Fictional: referral transmitted to receiving facility.",
    },
    {
      referralId: referralOverdue.id,
      patientId: patientA.id,
      actorId: userIds["coordinator@community.clinic"],
      actorRole: "care_coordinator",
      eventType: "Patient contact attempted",
      details: "Fictional: patient contacted; acknowledged instructions.",
    },
  ])

  console.log("Seed complete.")
  console.log("Organizations:", referringOrg!.name, "|", receivingOrg!.name)
  console.log("Demo users (password:", DEMO_PASSWORD, "):", Object.keys(userIds).join(", "))
  console.log("Referrals: overdue (unacknowledged), acknowledged, draft")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
