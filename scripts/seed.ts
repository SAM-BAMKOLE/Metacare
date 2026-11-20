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
  notifications,
  notificationAttempts,
  auditLogs,
  clinicalConsultations,
  confirmatoryFollowUps,
  escalations,
} from "@/db/schema"

const DEMO_PASSWORD = "Demo1234!"

type DemoUser = {
  email: string
  name: string
  role: string
  org: "referring" | "receiving" | "myclinic"
}

const DEMO_USERS: DemoUser[] = [
  { email: "admin@community.clinic", name: "Clinic Administrator", role: "organization_admin", org: "referring" },
  { email: "screener@community.clinic", name: "Screening Staff Member", role: "screening_staff", org: "referring" },
  { email: "clinician@community.clinic", name: "Reviewing Clinician", role: "clinician", org: "referring" },
  { email: "coordinator@community.clinic", name: "Care Coordinator", role: "care_coordinator", org: "referring" },
  { email: "admin@receiving.facility", name: "Receiving Facility Admin", role: "organization_admin", org: "receiving" },
  { email: "receiver@receiving.facility", name: "Receiving Provider Staff", role: "receiving_provider_staff", org: "receiving" },
  { email: "admin.myclinic@gmail.com", name: "My Clinic Admin", role: "organization_admin", org: "myclinic" },
  { email: "clinician.myclinic@gmail.com", name: "My Clinic Clinician", role: "clinician", org: "myclinic" },
]

async function main() {
  // Clean previous seed data (FK-safe order)
  await db.delete(careEvents)
  await db.delete(notificationAttempts)
  await db.delete(notifications)
  await db.delete(clinicalConsultations)
  await db.delete(confirmatoryFollowUps)
  await db.delete(escalations)
  await db.delete(auditLogs)
  await db.delete(referrals)
  await db.delete(clinicalReviews)
  await db.delete(screeningEvents)
  await db.delete(patients)
  await db.delete(organizationMemberships)
  await db.delete(authAccount)
  await db.delete(authSession)
  await db.delete(authUser)
  await db.delete(organizations)

  // 1. Organizations
  let referringOrg: typeof organizations.$inferSelect | null = null
  let receivingOrg: typeof organizations.$inferSelect | null = null
  let myclinicOrg: typeof organizations.$inferSelect | null = null

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

  const existingMyClinic = await db.select().from(organizations).where(eq(organizations.name, "My Clinic")).limit(1)
  if (existingMyClinic.length > 0) myclinicOrg = existingMyClinic[0]
  else {
    [myclinicOrg] = await db.insert(organizations).values({ name: "My Clinic" }).returning()
  }

  const orgByKey = { referring: referringOrg!.id, receiving: receivingOrg!.id, myclinic: myclinicOrg!.id }

  // 2. Users + memberships
  const userIds: Record<string, string> = {}
  for (const u of DEMO_USERS) {
    const password = u.email === "admin.myclinic@gmail.com" ? "admin.myclinic" : u.email === "clinician.myclinic@gmail.com" ? "clinician.myclinic" : DEMO_PASSWORD
    const created = await auth.api.signUpEmail({
      body: { email: u.email, password, name: u.name },
    })
    userIds[u.email] = created.user.id
    await db.insert(organizationMemberships).values({
      userId: created.user.id,
      organizationId: orgByKey[u.org],
      role: u.role,
    })
  }

  // 3. Patients for My Clinic (10 patients)
  const upsertPatient = async (values: typeof patients.$inferInsert) => {
    const existing = await db.select().from(patients).where(eq(patients.internalId, values.internalId)).limit(1)
    if (existing.length > 0) return existing[0]
    const [created] = await db.insert(patients).values(values).returning()
    return created
  }

  const mcPatients = await Promise.all([
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0101",
      name: "Sarah Johnson",
      dateOfBirth: new Date("1985-03-12"),
      contactDetails: "+1 555-0101",
      administrativeNotes: "Prefers morning appointments. Speaks English.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0102",
      name: "Michael Chen",
      dateOfBirth: new Date("1972-07-18"),
      contactDetails: "+1 555-0102",
      administrativeNotes: "Diabetic, monitors blood sugar regularly.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0103",
      name: "Aisha Rahman",
      dateOfBirth: new Date("1990-11-05"),
      contactDetails: "+1 555-0103",
      administrativeNotes: "Pregnant, due March 2027.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0104",
      name: "David Okonkwo",
      dateOfBirth: new Date("1965-01-22"),
      contactDetails: "+1 555-0104",
      administrativeNotes: "Hypertension, on medication.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0105",
      name: "Elena Petrov",
      dateOfBirth: new Date("1988-09-30"),
      contactDetails: "+1 555-0105",
      administrativeNotes: "Allergic to penicillin.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0106",
      name: "James Wilson",
      dateOfBirth: new Date("1955-12-10"),
      contactDetails: "+1 555-0106",
      administrativeNotes: "Retired, lives alone, needs reminders.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0107",
      name: "Fatima Al-Sayed",
      dateOfBirth: new Date("1995-04-17"),
      contactDetails: "+1 555-0107",
      administrativeNotes: "Prefers female practitioners.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0108",
      name: "Robert Thompson",
      dateOfBirth: new Date("1978-06-25"),
      contactDetails: "+1 555-0108",
      administrativeNotes: "Smoker, advised to quit.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0109",
      name: "Grace Kim",
      dateOfBirth: new Date("1983-02-14"),
      contactDetails: "+1 555-0109",
      administrativeNotes: "Family history of breast cancer.",
    }),
    upsertPatient({
      organizationId: myclinicOrg!.id,
      internalId: "MC-0110",
      name: "Marcus Greene",
      dateOfBirth: new Date("1970-08-08"),
      contactDetails: "+1 555-0110",
      administrativeNotes: "Works night shifts, scheduling challenges.",
    }),
  ])

  const adminUserId = userIds["admin.myclinic@gmail.com"]
  const clinicianUserId = userIds["clinician.myclinic@gmail.com"]

  // 4. Screening events for My Clinic (spanning last 3 months)
  const insertScreening = async (values: typeof screeningEvents.$inferInsert) => {
    const [created] = await db.insert(screeningEvents).values(values).returning()
    return created
  }

  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  const mcScreenings = await Promise.all([
    // Sarah Johnson - abnormal cervical screening, 45 days ago
    insertScreening({
      patientId: mcPatients[0].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Cervical cancer screening",
      screeningDate: daysAgo(45),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "HPV positive, abnormal cytology. Colposcopy recommended.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Refer to gynaecology for colposcopy.",
    }),
    // Michael Chen - hypertension screening, 38 days ago
    insertScreening({
      patientId: mcPatients[1].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Hypertension screening",
      screeningDate: daysAgo(38),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "BP 160/95 mmHg on two readings. Repeat in 2 weeks.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Lifestyle counselling + medication review.",
    }),
    // Aisha Rahman - gestational diabetes screening, 30 days ago
    insertScreening({
      patientId: mcPatients[2].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Gestational diabetes screening",
      screeningDate: daysAgo(30),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Normal",
      resultNotes: "Glucose tolerance test within normal range.",
      requiresClinicalReview: false,
      clinicianConfirmedFollowUp: false,
      nextStepRecommendation: null,
    }),
    // David Okonkwo - cholesterol screening, 25 days ago
    insertScreening({
      patientId: mcPatients[3].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Cholesterol screening",
      screeningDate: daysAgo(25),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "LDL elevated at 4.2 mmol/L. Statin therapy discussed.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Start atorvastatin 20mg, recheck in 3 months.",
    }),
    // Elena Petrov - breast cancer screening, 20 days ago
    insertScreening({
      patientId: mcPatients[4].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Breast cancer screening (mammogram)",
      screeningDate: daysAgo(20),
      location: "My Clinic - Imaging Centre",
      recordedById: adminUserId,
      resultCategory: "Normal",
      resultNotes: "No suspicious masses detected. Routine follow-up in 2 years.",
      requiresClinicalReview: false,
      clinicianConfirmedFollowUp: false,
      nextStepRecommendation: null,
    }),
    // James Wilson - vision screening, 15 days ago
    insertScreening({
      patientId: mcPatients[5].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Vision screening",
      screeningDate: daysAgo(15),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "Visual acuity 20/60 in right eye. Cataract suspected.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Refer to ophthalmology for cataract assessment.",
    }),
    // Fatima Al-Sayed - STI screening, 12 days ago
    insertScreening({
      patientId: mcPatients[6].id,
      organizationId: myclinicOrg!.id,
      screeningType: "STI screening panel",
      screeningDate: daysAgo(12),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Normal",
      resultNotes: "All tests negative.",
      requiresClinicalReview: false,
      clinicianConfirmedFollowUp: false,
      nextStepRecommendation: null,
    }),
    // Robert Thompson - lung function screening, 10 days ago
    insertScreening({
      patientId: mcPatients[7].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Lung function screening (spirometry)",
      screeningDate: daysAgo(10),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "FEV1/FVC ratio 0.68. Consistent with COPD.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Refer to respiratory clinic. Smoking cessation support.",
    }),
    // Grace Kim - genetic screening consultation, 8 days ago
    insertScreening({
      patientId: mcPatients[8].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Breast cancer genetic screening (BRCA)",
      screeningDate: daysAgo(8),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Inconclusive",
      resultNotes: "Variant of uncertain significance found. Genetic counselling recommended.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: false,
      nextStepRecommendation: null,
    }),
    // Marcus Greene - diabetes screening, 5 days ago
    insertScreening({
      patientId: mcPatients[9].id,
      organizationId: myclinicOrg!.id,
      screeningType: "Diabetes screening (HbA1c)",
      screeningDate: daysAgo(5),
      location: "My Clinic - Main Campus",
      recordedById: adminUserId,
      resultCategory: "Abnormal - requires follow-up",
      resultNotes: "HbA1c 7.2%. Pre-diabetic range.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: true,
      nextStepRecommendation: "Dietary counselling + metformin trial.",
    }),
  ])

  // 5. Clinical reviews for screenings requiring review
  await db.insert(clinicalReviews).values([
    {
      screeningEventId: mcScreenings[0].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Urgent gynaecology referral for colposcopy.",
      clinicalPriority: "high",
    },
    {
      screeningEventId: mcScreenings[1].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Repeat BP in 2 weeks, consider antihypertensive.",
      clinicalPriority: "routine",
    },
    {
      screeningEventId: mcScreenings[3].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Atorvastatin 20mg daily, recheck lipids in 3 months.",
      clinicalPriority: "routine",
    },
    {
      screeningEventId: mcScreenings[5].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Ophthalmology referral for cataract surgery assessment.",
      clinicalPriority: "urgent",
    },
    {
      screeningEventId: mcScreenings[7].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Respiratory clinic referral, smoking cessation program.",
      clinicalPriority: "high",
    },
    {
      screeningEventId: mcScreenings[9].id,
      clinicianId: clinicianUserId,
      followUpRequired: true,
      nextStepRecommendation: "Metformin 500mg twice daily, dietary review.",
      clinicalPriority: "routine",
    },
  ])

  // Mark screenings as reviewed
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[0].id))
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[1].id))
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[3].id))
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[5].id))
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[7].id))
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: true })
    .where(eq(screeningEvents.id, mcScreenings[9].id))

  // Grace Kim's screening still awaiting review
  await db.update(screeningEvents)
    .set({ clinicianConfirmedFollowUp: false })
    .where(eq(screeningEvents.id, mcScreenings[8].id))

  // 6. Referrals for My Clinic (various statuses, spanning weeks)
  const insertReferral = async (values: typeof referrals.$inferInsert) => {
    const [created] = await db.insert(referrals).values(values).returning()
    return created
  }

  const mcReferrals = await Promise.all([
    // Sarah Johnson - completed, acknowledged, closed
    insertReferral({
      patientId: mcPatients[0].id,
      sourceScreeningEventId: mcScreenings[0].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: receivingOrg!.id,
      receivingProvider: "Gynaecology Department - Receiving Care Facility",
      assignedOwnerId: adminUserId,
      priority: "high",
      dueDate: daysAgo(30),
      status: "completed",
      instructions: "Patient to attend colposcopy appointment. Bring ID and insurance card.",
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "acknowledged",
      closureOutcome: "Follow-up completed and documented",
      closureReason: "Colposcopy performed, results normal, patient discharged.",
    }),
    // Michael Chen - acknowledged, in progress
    insertReferral({
      patientId: mcPatients[1].id,
      sourceScreeningEventId: mcScreenings[1].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: null,
      receivingProvider: null,
      assignedOwnerId: null,
      priority: "routine",
      dueDate: daysAgo(15),
      status: "pending_assignment",
      instructions: null,
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
    // David Okonkwo - sent, awaiting acknowledgement
    insertReferral({
      patientId: mcPatients[3].id,
      sourceScreeningEventId: mcScreenings[3].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: receivingOrg!.id,
      receivingProvider: "Cardiology Department - Receiving Care Facility",
      assignedOwnerId: null,
      priority: "routine",
      dueDate: daysAgo(5),
      status: "sent",
      instructions: "Patient to attend cardiology assessment. Fasting required before blood tests.",
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
    // Elena Petrov - completed
    insertReferral({
      patientId: mcPatients[4].id,
      sourceScreeningEventId: mcScreenings[4].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: null,
      receivingProvider: null,
      assignedOwnerId: null,
      priority: "routine",
      dueDate: null,
      status: "completed",
      instructions: null,
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "not_acknowledged",
      closureOutcome: "Follow-up completed and documented",
      closureReason: "Mammogram normal, routine screening in 2 years.",
    }),
    // James Wilson - awaiting acknowledgement, overdue
    insertReferral({
      patientId: mcPatients[5].id,
      sourceScreeningEventId: mcScreenings[5].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: receivingOrg!.id,
      receivingProvider: "Ophthalmology Department - Receiving Care Facility",
      assignedOwnerId: null,
      priority: "urgent",
      dueDate: daysAgo(35),
      status: "awaiting_acknowledgement",
      instructions: "Urgent cataract assessment. Patient drives, needs timely appointment.",
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
    // Fatima Al-Sayed - draft
    insertReferral({
      patientId: mcPatients[6].id,
      sourceScreeningEventId: null,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: null,
      receivingProvider: null,
      assignedOwnerId: null,
      priority: "routine",
      dueDate: null,
      status: "draft",
      instructions: null,
      patientCommunicationStatus: "not_contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
    // Robert Thompson - in progress, acknowledged
    insertReferral({
      patientId: mcPatients[7].id,
      sourceScreeningEventId: mcScreenings[7].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: receivingOrg!.id,
      receivingProvider: "Respiratory Clinic - Receiving Care Facility",
      assignedOwnerId: adminUserId,
      priority: "high",
      dueDate: daysAgo(12),
      status: "in_progress",
      instructions: "Patient smokes heavily, smoking cessation support essential.",
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "acknowledged",
    }),
    // Marcus Greene - awaiting follow-up documentation
    insertReferral({
      patientId: mcPatients[8].id,
      sourceScreeningEventId: mcScreenings[9].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: null,
      receivingProvider: null,
      assignedOwnerId: null,
      priority: "routine",
      dueDate: daysAgo(10),
      status: "awaiting_followup_documentation",
      instructions: null,
      patientCommunicationStatus: "contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
    // Aisha Rahman - cancelled
    insertReferral({
      patientId: mcPatients[2].id,
      sourceScreeningEventId: mcScreenings[2].id,
      referringOrganizationId: myclinicOrg!.id,
      receivingOrganizationId: null,
      receivingProvider: null,
      assignedOwnerId: null,
      priority: "routine",
      dueDate: null,
      status: "cancelled",
      instructions: null,
      patientCommunicationStatus: "not_contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }),
  ])

  // 7. Care events (timeline) for referrals
  await db.insert(careEvents).values([
    // Sarah Johnson referral timeline
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Screening event recorded",
      details: "Cervical cancer screening - HPV positive, abnormal cytology.",
      timestamp: daysAgo(45),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: clinicianUserId,
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Urgent gynaecology referral for colposcopy recommended.",
      timestamp: daysAgo(43),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral created",
      details: "Referral to Gynaecology Department at Receiving Care Facility.",
      timestamp: daysAgo(42),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral sent",
      details: "Referral transmitted to Receiving Care Facility.",
      timestamp: daysAgo(41),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Patient contact attempted",
      details: "Patient contacted by phone, colposcopy appointment confirmed.",
      timestamp: daysAgo(40),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: userIds["receiver@receiving.facility"],
      actorRole: "receiving_provider_staff",
      eventType: "Receiving provider acknowledged referral",
      details: "Gynaecology department confirmed receipt of referral.",
      timestamp: daysAgo(39),
    },
    {
      referralId: mcReferrals[0].id,
      patientId: mcPatients[0].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Case closed or exception documented",
      details: "Colposcopy performed, results normal, patient discharged.",
      timestamp: daysAgo(10),
    },
    // Michael Chen referral timeline
    {
      referralId: mcReferrals[1].id,
      patientId: mcPatients[1].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Screening event recorded",
      details: "Hypertension screening - BP 160/95 mmHg.",
      timestamp: daysAgo(38),
    },
    {
      referralId: mcReferrals[1].id,
      patientId: mcPatients[1].id,
      actorId: clinicianUserId,
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Repeat BP in 2 weeks, consider antihypertensive medication.",
      timestamp: daysAgo(36),
    },
    {
      referralId: mcReferrals[1].id,
      patientId: mcPatients[1].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral created",
      details: "Draft referral for hypertension management.",
      timestamp: daysAgo(35),
    },
    // David Okonkwo referral timeline
    {
      referralId: mcReferrals[2].id,
      patientId: mcPatients[3].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Screening event recorded",
      details: "Cholesterol screening - LDL 4.2 mmol/L.",
      timestamp: daysAgo(25),
    },
    {
      referralId: mcReferrals[2].id,
      patientId: mcPatients[3].id,
      actorId: clinicianUserId,
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Atorvastatin 20mg daily, recheck lipids in 3 months.",
      timestamp: daysAgo(23),
    },
    {
      referralId: mcReferrals[2].id,
      patientId: mcPatients[3].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral created",
      details: "Referral to Cardiology Department at Receiving Care Facility.",
      timestamp: daysAgo(22),
    },
    {
      referralId: mcReferrals[2].id,
      patientId: mcPatients[3].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral sent",
      details: "Referral transmitted to Receiving Care Facility.",
      timestamp: daysAgo(21),
    },
    // James Wilson referral timeline (overdue)
    {
      referralId: mcReferrals[4].id,
      patientId: mcPatients[5].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Screening event recorded",
      details: "Vision screening - visual acuity 20/60, cataract suspected.",
      timestamp: daysAgo(15),
    },
    {
      referralId: mcReferrals[4].id,
      patientId: mcPatients[5].id,
      actorId: clinicianUserId,
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Ophthalmology referral for cataract surgery assessment.",
      timestamp: daysAgo(13),
    },
    {
      referralId: mcReferrals[4].id,
      patientId: mcPatients[5].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral created",
      details: "Referral to Ophthalmology Department at Receiving Care Facility.",
      timestamp: daysAgo(12),
    },
    {
      referralId: mcReferrals[4].id,
      patientId: mcPatients[5].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral sent",
      details: "Referral transmitted to Receiving Care Facility.",
      timestamp: daysAgo(11),
    },
    {
      referralId: mcReferrals[4].id,
      patientId: mcPatients[5].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Patient contact attempted",
      details: "Patient contacted, urgent cataract assessment needed.",
      timestamp: daysAgo(10),
    },
    // Robert Thompson referral timeline
    {
      referralId: mcReferrals[6].id,
      patientId: mcPatients[7].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Screening event recorded",
      details: "Lung function screening - FEV1/FVC 0.68, COPD suspected.",
      timestamp: daysAgo(10),
    },
    {
      referralId: mcReferrals[6].id,
      patientId: mcPatients[7].id,
      actorId: clinicianUserId,
      actorRole: "clinician",
      eventType: "Clinician decision documented",
      details: "Respiratory clinic referral, smoking cessation program.",
      timestamp: daysAgo(8),
    },
    {
      referralId: mcReferrals[6].id,
      patientId: mcPatients[7].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral created",
      details: "Referral to Respiratory Clinic at Receiving Care Facility.",
      timestamp: daysAgo(7),
    },
    {
      referralId: mcReferrals[6].id,
      patientId: mcPatients[7].id,
      actorId: adminUserId,
      actorRole: "organization_admin",
      eventType: "Referral sent",
      details: "Referral transmitted to Receiving Care Facility.",
      timestamp: daysAgo(6),
    },
    {
      referralId: mcReferrals[6].id,
      patientId: mcPatients[7].id,
      actorId: userIds["receiver@receiving.facility"],
      actorRole: "receiving_provider_staff",
      eventType: "Receiving provider acknowledged referral",
      details: "Respiratory clinic confirmed receipt.",
      timestamp: daysAgo(5),
    },
  ])

  // 8. Notifications
  await db.insert(notifications).values([
    {
      referralId: mcReferrals[0].id,
      userId: adminUserId,
      type: "referral_created",
      title: "New referral: Sarah Johnson to Gynaecology",
      content: "Referral created and sent to Receiving Care Facility.",
      read: true,
      simulated: true,
      createdAt: daysAgo(41),
    },
    {
      referralId: mcReferrals[4].id,
      userId: adminUserId,
      type: "overdue",
      title: "Referral overdue: James Wilson to Ophthalmology",
      content: "No acknowledgement received by the due date. Follow up with receiving facility.",
      read: false,
      simulated: true,
      createdAt: daysAgo(34),
    },
    {
      referralId: mcReferrals[2].id,
      userId: adminUserId,
      type: "awaiting_ack",
      title: "Referral awaiting acknowledgement: David Okonkwo to Cardiology",
      content: "Receiving facility has not acknowledged this referral.",
      read: false,
      simulated: true,
      createdAt: daysAgo(20),
    },
    {
      referralId: mcReferrals[6].id,
      userId: adminUserId,
      type: "provider_update",
      title: "Referral acknowledged: Robert Thompson to Respiratory Clinic",
      content: "Receiving facility confirmed receipt and is acting on the referral.",
      read: true,
      simulated: true,
      createdAt: daysAgo(5),
    },
  ])

  // 9. Notification attempts
  await db.insert(notificationAttempts).values([
    {
      notificationId: (await db.select().from(notifications).where(eq(notifications.title, "New referral: Sarah Johnson to Gynaecology")).limit(1))[0].id,
      channel: "Phone call",
      language: "English",
      outcome: "contacted",
      acknowledgementAt: daysAgo(40),
      understanding: "confirmed",
      concernQuestion: null,
      nextStepExplained: true,
      simulated: true,
      attemptAt: daysAgo(40),
    },
    {
      notificationId: (await db.select().from(notifications).where(eq(notifications.title, "Referral overdue: James Wilson to Ophthalmology")).limit(1))[0].id,
      channel: "Phone call",
      language: "English",
      outcome: "no_answer",
      acknowledgementAt: null,
      understanding: null,
      concernQuestion: null,
      nextStepExplained: false,
      simulated: true,
      attemptAt: daysAgo(33),
    },
    {
      notificationId: (await db.select().from(notifications).where(eq(notifications.title, "Referral awaiting acknowledgement: David Okonkwo to Cardiology")).limit(1))[0].id,
      channel: "Email",
      language: "English",
      outcome: "sent",
      acknowledgementAt: null,
      understanding: null,
      concernQuestion: null,
      nextStepExplained: false,
      simulated: true,
      attemptAt: daysAgo(21),
    },
  ])

  // 10. Confirmatory follow-ups
  await db.insert(confirmatoryFollowUps).values([
    {
      referralId: mcReferrals[0].id,
      required: "yes",
      testAssessmentLabel: "Colposcopy biopsy",
      orderedBy: clinicianUserId,
      orderedAt: daysAgo(39),
      expectedDate: daysAgo(35),
      status: "reviewed",
      completedAt: daysAgo(35),
      reviewedBy: clinicianUserId,
      reviewedAt: daysAgo(34),
      outcomeSummary: "Biopsy results normal, no malignancy found.",
    },
    {
      referralId: mcReferrals[2].id,
      required: "yes",
      testAssessmentLabel: "Echocardiogram",
      orderedBy: clinicianUserId,
      orderedAt: daysAgo(20),
      expectedDate: daysAgo(15),
      status: "not_ordered",
      completedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      outcomeSummary: null,
    },
    {
      referralId: mcReferrals[4].id,
      required: "yes",
      testAssessmentLabel: "Cataract surgery assessment",
      orderedBy: clinicianUserId,
      orderedAt: daysAgo(10),
      expectedDate: daysAgo(5),
      status: "not_ordered",
      completedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      outcomeSummary: null,
    },
    {
      referralId: mcReferrals[6].id,
      required: "yes",
      testAssessmentLabel: "Chest CT scan",
      orderedBy: clinicianUserId,
      orderedAt: daysAgo(5),
      expectedDate: daysAgo(2),
      status: "result_pending_review",
      completedAt: daysAgo(2),
      reviewedBy: null,
      reviewedAt: null,
      outcomeSummary: null,
    },
  ])

  // 11. Clinical consultations
  await db.insert(clinicalConsultations).values([
    {
      referralId: mcReferrals[0].id,
      consultingClinicianId: clinicianUserId,
      requestingClinicianOrFacility: "My Clinic",
      consultationDate: daysAgo(43),
      reason: "Pre-colposcopy assessment",
      outcome: "assessment_completed",
      summaryRecommendation: "Patient suitable for colposcopy. No contraindications.",
      nextAction: "Attend colposcopy appointment",
      nextActionOwnerId: adminUserId,
      nextActionDueDate: daysAgo(40),
    },
    {
      referralId: mcReferrals[6].id,
      consultingClinicianId: clinicianUserId,
      requestingClinicianOrFacility: "My Clinic",
      consultationDate: daysAgo(8),
      reason: "COPD assessment",
      outcome: "further_review_required",
      summaryRecommendation: "Chest CT scan required to assess extent of lung damage.",
      nextAction: "Chest CT scan",
      nextActionOwnerId: adminUserId,
      nextActionDueDate: daysAgo(2),
    },
  ])

  // 12. Escalations
  await db.insert(escalations).values([
    {
      referralId: mcReferrals[4].id,
      escalatedBy: adminUserId,
      escalatedTo: clinicianUserId,
      reason: "Ophthalmology referral overdue by 3 weeks, patient's vision deteriorating.",
      createdAt: daysAgo(30),
      acknowledgedAt: daysAgo(29),
      acknowledgedBy: clinicianUserId,
      actionTaken: "Contacted ophthalmology department directly, urgent appointment scheduled.",
    },
  ])

  // 13. Audit logs
  await db.insert(auditLogs).values([
    {
      actorId: adminUserId,
      action: "patient.create",
      entityType: "patient",
      entityId: mcPatients[0].id,
      details: "Created patient Sarah Johnson (MC-0101)",
      createdAt: daysAgo(50),
    },
    {
      actorId: adminUserId,
      action: "patient.create",
      entityType: "patient",
      entityId: mcPatients[1].id,
      details: "Created patient Michael Chen (MC-0102)",
      createdAt: daysAgo(49),
    },
    {
      actorId: clinicianUserId,
      action: "clinical_review.create",
      entityType: "clinical_review",
      entityId: "clin-review-1",
      details: "Clinical decision for cervical screening: followUpRequired=true, priority=high",
      createdAt: daysAgo(43),
    },
    {
      actorId: adminUserId,
      action: "referral.create",
      entityType: "referral",
      entityId: mcReferrals[0].id,
      details: "Created referral for Sarah Johnson to Gynaecology Department",
      createdAt: daysAgo(42),
    },
    {
      actorId: adminUserId,
      action: "referral.transition",
      entityType: "referral",
      entityId: mcReferrals[0].id,
      details: "Referral MC-REF-0001 transitioned sent → acknowledged",
      createdAt: daysAgo(39),
    },
    {
      actorId: adminUserId,
      action: "referral.patient_communication",
      entityType: "referral",
      entityId: mcReferrals[0].id,
      details: "Patient communication recorded: Phone call -> contacted",
      createdAt: daysAgo(40),
    },
    {
      actorId: adminUserId,
      action: "referral.close",
      entityType: "referral",
      entityId: mcReferrals[0].id,
      details: "Referral MC-REF-0001 closed with outcome: Follow-up completed and documented",
      createdAt: daysAgo(10),
    },
    {
      actorId: adminUserId,
      action: "referral.escalate",
      entityType: "escalation",
      entityId: mcReferrals[4].id,
      details: "Escalation created: Ophthalmology referral overdue by 3 weeks",
      createdAt: daysAgo(30),
    },
  ])

  console.log("Seed complete.")
  console.log("Organization: My Clinic")
  console.log("Admin: admin.myclinic@gmail.com / admin.myclinic")
  console.log("Clinician: clinician.myclinic@gmail.com / clinician.myclinic")
  console.log("Patients: 10 (MC-0101 to MC-0110)")
  console.log("Screenings: 10 (mix of normal/abnormal, some awaiting review)")
  console.log("Referrals: 9 (mix of statuses including completed, overdue, pending, draft)")
  console.log("Care events, notifications, escalations, confirmatory follow-ups, audit logs all seeded.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
