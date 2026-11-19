/**
 * Metacare E2E Demo Verification Script
 *
 * Tests the full screening-to-care journey per spec §14,
 * plus the exception path per spec §6.7 / §8.
 *
 * Runs against the seeded Neon database. Tests server-action business logic
 * directly where possible (functions that don't require Next.js session
 * context), and better-auth sign-in/sign-up via the auth API.
 */

import { db } from "@/lib/db"
import { auth } from "@/server/auth"
import { eq, and, desc } from "drizzle-orm"
import {
  organizations,
  organizationMemberships,
  patients,
  screeningEvents,
  clinicalReviews,
  referrals,
  careEvents,
  auditLogs,
  user as authUser,
} from "@/db/schema"

// Import server actions that don't require Next.js session context
import {
  listPatients,
  getPatient,
} from "@/server/patients"
import {
  listScreenings,
  listScreeningsWithPatients,
  listAwaitingClinicalReview,
} from "@/server/screenings"
import {
  listReferralsWithDetails,
  listReferrals,
  getReferralDetail,
  transitionReferral,
  recordPatientCommunication,
  acknowledgeReferral,
  closeReferral,
  getOverdueReferrals,
  getUnassignedReferrals,
  getAwaitingAcknowledgementReferrals,
  isOverdue,
  type ReferralStatus,
} from "@/server/referrals"
import {
  getDashboardMetrics,
  getAttentionItems,
  getRecentActivity,
} from "@/server/dashboard"
import { getAuditLogsForAdmin } from "@/server/audit"

const DEMO_PASSWORD = "Demo1234!"

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.log(`  ❌ ${name}` + (detail ? ` — ${detail}` : ""))
  }
}

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("  METACARE E2E DEMO VERIFICATION — Step 19")
  console.log("  Screening-to-Care Journey + Exception Path")
  console.log("═══════════════════════════════════════════════════════════════\n")

  // ── 1. AUTH VERIFICATION ────────────────────────────────────────
  console.log("\n1. AUTHENTICATION (better-auth)\n")

  // Test sign-in as different roles
  const users = [
    { email: "screener@community.clinic", role: "screening_staff" },
    { email: "clinician@community.clinic", role: "clinician" },
    { email: "coordinator@community.clinic", role: "care_coordinator" },
    { email: "receiver@receiving.facility", role: "receiving_provider_staff" },
    { email: "admin@community.clinic", role: "organization_admin" },
  ]

  for (const u of users) {
    try {
      const result: any = await auth.api.signInEmail({
        body: { email: u.email, password: DEMO_PASSWORD },
      })
      check(
        `Sign-in: ${u.email} (${u.role})`,
        result.user?.email === u.email,
        result.user ? "" : "no user returned"
      )
    } catch (e: any) {
      check(`Sign-in: ${u.email}`, false, e.message)
    }
  }

  // Test sign-up of a new user
  const newEmail = `e2e.${Date.now()}@example.com`
  try {
    const created: any = await auth.api.signUpEmail({
      body: { email: newEmail, password: DEMO_PASSWORD, name: "E2E Test User" },
    })
    check(
      "Sign-up: new user created",
      !!created.user?.id,
      created.user ? "" : "no user"
    )
  } catch (e: any) {
    check("Sign-up: new user", false, e.message)
  }

  // ── 2. SEED DATA VERIFICATION ───────────────────────────────────
  console.log("\n2. SEED DATA\n")

  const orgs = await db.select().from(organizations)
  check("Organizations exist", orgs.length >= 2, `found ${orgs.length}`)

  const usersDb = await db.select().from(authUser)
  check("Users exist", usersDb.length >= 6, `found ${usersDb.length}`)

  const pts = await db.select().from(patients)
  check("Patients exist", pts.length >= 2, `found ${pts.length}`)

  const scr = await db.select().from(screeningEvents)
  check("Screening events exist", scr.length >= 2, `found ${scr.length}`)

  const refs = await db.select().from(referrals)
  check("Referrals exist", refs.length >= 3, `found ${refs.length}`)

  const cr = await db.select().from(clinicalReviews)
  check("Clinical reviews exist", cr.length >= 1, `found ${cr.length}`)

  const ce = await db.select().from(careEvents)
  check("Care events exist", ce.length >= 3, `found ${ce.length}`)

  const al = await db.select().from(auditLogs)
  check("Audit logs exist", al.length >= 5, `found ${al.length}`)

  // ── 3. FULL JOURNEY — SCREENING STAFF ───────────────────────────
  console.log("\n3. SCREENING STAFF — Record Screening Event\n")

  const patientA = await db
    .select()
    .from(patients)
    .where(eq(patients.internalId, "PAT-0001"))
    .limit(1)

  if (patientA.length > 0) {
    const patient = patientA[0]
    const orgId = patient.organizationId

    // List patients for org
    const dir = await listPatients(orgId)
    check("List patients for org", dir.length > 0, `found ${dir.length}`)

    // Get patient detail
    const pDetail = await getPatient(patient.id, orgId)
    check("Get patient detail", !!pDetail, pDetail ? pDetail.name : "null")

    // List screenings
    const screenings = await listScreenings(orgId)
    check("List screenings", screenings.length > 0, `found ${screenings.length}`)

    // List screenings with patients
    const scrWithPat = await listScreeningsWithPatients(orgId)
    check("List screenings with patients", scrWithPat.length > 0)

    // Create a NEW screening event FIRST (simulating what the UI would do)
    const [newScreening] = await db.insert(screeningEvents).values({
      patientId: patient.id,
      organizationId: orgId,
      screeningType: "Diabetes screening",
      screeningDate: new Date("2026-11-15T10:00:00Z"),
      location: "Community Health Clinic",
      recordedById: "system-test",
      resultCategory: "Outside expected range",
      resultNotes: "E2E test screening result.",
      requiresClinicalReview: true,
      clinicianConfirmedFollowUp: false,
      nextStepRecommendation: null,
    }).returning()

    check("Create screening event (DB)", !!newScreening.id)

    // Verify it shows in awaiting clinical review
    const awaitingReview = await listAwaitingClinicalReview(orgId)
    check(
      "List awaiting clinical review",
      awaitingReview.length > 0,
      `found ${awaitingReview.length}`
    )
    check(
      "New screening appears in awaiting review",
      awaitingReview.some((s) => s.id === newScreening.id)
    )
  }

  // ── 4. CLINICAL REVIEW — CLINICIAN ──────────────────────────────
  console.log("\n4. CLINICAL REVIEW — Clinician Documents Decision\n")

  const screeningNeedingReview = await db
    .select()
    .from(screeningEvents)
    .where(
      and(
        eq(screeningEvents.requiresClinicalReview, true),
        eq(screeningEvents.clinicianConfirmedFollowUp, false)
      )
    )
    .limit(1)

  if (screeningNeedingReview.length > 0) {
    const scr = screeningNeedingReview[0]

    // Create clinical review (bypassing auth role check, testing DB logic)
    const [review] = await db.insert(clinicalReviews).values({
      screeningEventId: scr.id,
      clinicianId: "system-test-clinician",
      followUpRequired: true,
      nextStepRecommendation: "Refer for further assessment",
      clinicalPriority: "high",
    }).returning()

    check("Create clinical review (DB)", !!review.id)

    // Mark screening as reviewed
    await db.update(screeningEvents)
      .set({ clinicianConfirmedFollowUp: true })
      .where(eq(screeningEvents.id, scr.id))

    const updatedScr = await db.select().from(screeningEvents)
      .where(eq(screeningEvents.id, scr.id)).limit(1)
    check("Screening marked as clinically reviewed", updatedScr[0]?.clinicianConfirmedFollowUp === true)
  }

  // ── 5. REFERRAL MANAGEMENT — CARE COORDINATOR ───────────────────
  console.log("\n5. REFERRAL MANAGEMENT — Create & Transition\n")

  const orgRef = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Community Health Clinic"))
    .limit(1)

  if (orgRef.length > 0 && patientA.length > 0) {
    const orgId = orgRef[0].id
    const patientId = patientA[0].id
    const screeningId = screeningNeedingReview.length > 0
      ? screeningNeedingReview[0].id
      : null

    // Create referral
    const [referral] = await db.insert(referrals).values({
      patientId,
      sourceScreeningEventId: screeningId,
      referringOrganizationId: orgId,
      receivingOrganizationId: orgRef[0].id,
      receivingProvider: "Cardiology Department",
      assignedOwnerId: null,
      priority: "high",
      dueDate: new Date("2026-11-30T00:00:00Z"),
      status: "draft",
      instructions: "E2E test referral instructions.",
      patientCommunicationStatus: "not_contacted",
      providerAcknowledgementStatus: "not_acknowledged",
    }).returning()

    check("Create referral (draft)", referral.status === "draft")

    // Valid transition: draft → pending_assignment
    const t1 = await transitionReferral(referral.id, "pending_assignment", "system-test-coordinator", "Assigning owner")
    check("Transition draft → pending_assignment", t1.status === "pending_assignment")

    // Valid transition: pending_assignment → ready_to_send
    const t2 = await transitionReferral(referral.id, "ready_to_send", "system-test-coordinator", "Ready to send")
    check("Transition pending_assignment → ready_to_send", t2.status === "ready_to_send")

    // Valid transition: ready_to_send → sent
    const t3 = await transitionReferral(referral.id, "sent", "system-test-coordinator", "Transmitted to receiving facility")
    check("Transition ready_to_send → sent", t3.status === "sent")

    // Valid transition: sent → awaiting_acknowledgement
    const t4 = await transitionReferral(referral.id, "awaiting_acknowledgement", "system-test-coordinator", "Sent to receiving provider")
    check("Transition sent → awaiting_acknowledgement", t4.status === "awaiting_acknowledgement")

    // INVALID transition: awaiting_acknowledgement → completed (skipping steps)
    try {
      await transitionReferral(referral.id, "completed", "system-test-coordinator", "Invalid skip")
      check("Block invalid transition: awaiting_acknowledgement → completed", false, "should have thrown")
    } catch (e: any) {
      check("Block invalid transition: awaiting_acknowledgement → completed", true, e.message)
    }

    // Valid transition: awaiting_acknowledgement → acknowledged
    const t5 = await transitionReferral(referral.id, "acknowledged", "system-test-receiver", "Receiving provider acknowledged")
    check("Transition awaiting_acknowledgement → acknowledged", t5.status === "acknowledged")

    // Valid transition: acknowledged → in_progress
    const t6 = await transitionReferral(referral.id, "in_progress", "system-test-receiver", "Assessment started")
    check("Transition acknowledged → in_progress", t6.status === "in_progress")

    // Valid transition: in_progress → completed
    const t7 = await transitionReferral(referral.id, "completed", "system-test-coordinator", "Follow-up documented")
    check("Transition in_progress → completed", t7.status === "completed")

    // Verify care events were created for transitions
    const events = await db.select().from(careEvents)
      .where(eq(careEvents.referralId, referral.id))
    check("Care events created for referral transitions", events.length >= 6, `found ${events.length}`)

    // Verify audit logs exist
    const auditRef = await db.select().from(auditLogs)
      .where(eq(auditLogs.entityId, referral.id))
    check("Audit logs exist for referral", auditRef.length > 0, `found ${auditRef.length}`)
  }

  // ── 6. PATIENT COMMUNICATION ────────────────────────────────────
  console.log("\n6. PATIENT COMMUNICATION RECORD\n")

  const refForComm = await db.select().from(referrals)
    .where(eq(referrals.status, "acknowledged"))
    .limit(1)

  if (refForComm.length > 0) {
    const ref = refForComm[0]
    const updated = await recordPatientCommunication(
      ref.id,
      "Phone call",
      "contacted",
      "Patient acknowledged instructions.",
      "system-test-coordinator"
    )
    check("Record patient communication", updated.patientCommunicationStatus === "contacted")

    const refCheck = await db.select().from(referrals)
      .where(eq(referrals.id, ref.id)).limit(1)
    check("Communication status persisted", refCheck[0]?.patientCommunicationStatus === "contacted")

    // Verify care event was created
    const commEvent = await db.select().from(careEvents)
      .where(
        and(
          eq(careEvents.referralId, ref.id),
          eq(careEvents.eventType, "Patient contact attempted")
        )
      ).limit(1)
    check("Care event for communication recorded", commEvent.length > 0)
  }

  // ── 7. OVERRIDE DETECTION & WORK QUEUES ─────────────────────────
  console.log("\n7. OVERDUE DETECTION & WORK QUEUES\n")

  const orgForQueue = orgRef.length > 0 ? orgRef[0].id : null
  if (orgForQueue) {
    const overdue = await getOverdueReferrals(orgForQueue)
    check("Get overdue referrals", Array.isArray(overdue))

    const unassigned = await getUnassignedReferrals(orgForQueue)
    check("Get unassigned referrals", Array.isArray(unassigned))

    const awaitingAck = await getAwaitingAcknowledgementReferrals(orgForQueue)
    check("Get awaiting acknowledgement referrals", Array.isArray(awaitingAck))

    // Test isOverdue function (it's async because of 'use server')
    const now = new Date()
    const pastDue = new Date(now.getTime() - 86400000) // yesterday
    const futureDue = new Date(now.getTime() + 86400000) // tomorrow

    check("isOverdue: past due date, open status", await isOverdue({ dueDate: pastDue, status: "sent" as ReferralStatus }) === true)
    check("isOverdue: future due date", await isOverdue({ dueDate: futureDue, status: "sent" as ReferralStatus }) === false)
    check("isOverdue: no due date", await isOverdue({ dueDate: null, status: "sent" as ReferralStatus }) === false)
    check("isOverdue: completed status", await isOverdue({ dueDate: pastDue, status: "completed" as ReferralStatus }) === false)
  }

  // ── 8. DASHBOARD METRICS ────────────────────────────────────────
  console.log("\n8. DASHBOARD METRICS\n")

  if (orgRef.length > 0) {
    const metrics = await getDashboardMetrics(orgRef[0].id)
    check("Dashboard metrics returned", !!metrics)
    check("Screening events recorded", typeof metrics.screeningEventsRecorded === "number")
    check("Results requiring follow-up", typeof metrics.resultsRequiringFollowUp === "number")
    check("Open referrals", typeof metrics.openReferrals === "number")
    check("Unassigned cases", typeof metrics.unassignedCases === "number")
    check("Referrals awaiting acknowledgement", typeof metrics.referralsAwaitingAcknowledgement === "number")
    check("Overdue cases", typeof metrics.overdueCases === "number")
    check("Completed referrals", typeof metrics.completedReferrals === "number")
    check("Acknowledgement rate %", typeof metrics.referralAcknowledgementRate === "number")
    check("Follow-up completion rate %", typeof metrics.followUpCompletionRate === "number")

    const attention = await getAttentionItems(orgRef[0].id)
    check("Get attention items", Array.isArray(attention))

    const activity = await getRecentActivity(orgRef[0].id)
    check("Get recent activity", Array.isArray(activity))
  }

  // ── 9. AUDIT LOGS ───────────────────────────────────────────────
  console.log("\n9. AUDIT LOGS\n")

  const auditAll = await db.select().from(auditLogs)
  check("Audit logs table has entries", auditAll.length > 0, `found ${auditAll.length}`)

  // Check for expected action types
  const actions = [...new Set(auditAll.map((a) => a.action))]
  check("Audit: patient.create action", actions.includes("patient.create"))
  check("Audit: screening.create action", actions.includes("screening.create"))
  check("Audit: clinical_review.create action", actions.includes("clinical_review.create"))
  check("Audit: referral.create action", actions.includes("referral.create"))
  check("Audit: referral.transition action", actions.includes("referral.transition"))
  check("Audit: referral.patient_communication action", actions.includes("referral.patient_communication"))
  check("Audit: organization.create action", actions.includes("organization.create"))

  // Note: referral.close only exists if closeReferral() was called
  // (tested separately below)

  // ── 10. EXCEPTION PATH — Unacknowledged Referral ────────────────
  console.log("\n10. EXCEPTION PATH — Unacknowledged Referral\n")

  // Create a referral that's past due and unacknowledged
  const [excRef] = await db.insert(referrals).values({
    patientId: patientA[0].id,
    sourceScreeningEventId: null,
    referringOrganizationId: orgRef[0].id,
    receivingOrganizationId: orgRef[0].id,
    receivingProvider: "Exception Test Provider",
    assignedOwnerId: null,
    priority: "high",
    dueDate: new Date("2026-01-01T00:00:00Z"), // way in the past
    status: "sent",
    instructions: "Exception test - past due, unacknowledged",
    patientCommunicationStatus: "not_contacted",
    providerAcknowledgementStatus: "not_acknowledged",
  }).returning()

  check("Create exception referral (sent, past due)", excRef.status === "sent")

  const isExcOverdue = await isOverdue({ dueDate: excRef.dueDate, status: excRef.status as ReferralStatus })
  check("Exception referral detected as overdue", isExcOverdue === true)

  // Verify it appears in overdue queue
  const overdueList = await getOverdueReferrals(orgRef[0].id)
  check("Exception referral in overdue queue", overdueList.some((r) => r.id === excRef.id))

  // Correct lifecycle: sent → awaiting_acknowledgement → acknowledged
  const excAck1 = await transitionReferral(excRef.id, "awaiting_acknowledgement", "system-test-coordinator", "Sent to receiving facility")
  check("Exception referral → awaiting_acknowledgement", excAck1.status === "awaiting_acknowledgement")

  const excAck2 = await transitionReferral(excRef.id, "acknowledged", "system-test-receiver", "Late acknowledgement")
  check("Exception referral → acknowledged", excAck2.status === "acknowledged")

  // An acknowledged referral with a past due date is STILL overdue
  // (acknowledgement ≠ completion; the due date has passed)
  const excCheck = await db.select().from(referrals).where(eq(referrals.id, excRef.id)).limit(1)
  const stillOverdue = await isOverdue({ dueDate: excCheck[0]!.dueDate, status: excCheck[0]!.status as ReferralStatus })
  check("Acknowledged but past-due referral is still overdue", stillOverdue === true)

  // ── 11. REFERRAL CLOSURE ────────────────────────────────────────
  console.log("\n11. REFERRAL CLOSURE\n")

  // Create a referral specifically for closure testing (in_progress, acknowledged)
  const [closeRef] = await db.insert(referrals).values({
    patientId: patientA[0].id,
    sourceScreeningEventId: null,
    referringOrganizationId: orgRef[0].id,
    receivingOrganizationId: orgRef[0].id,
    receivingProvider: "Closure Test Provider",
    assignedOwnerId: null,
    priority: "routine",
    dueDate: new Date("2026-12-31T00:00:00Z"),
    status: "in_progress",
    instructions: "Closure test referral.",
    patientCommunicationStatus: "contacted",
    providerAcknowledgementStatus: "acknowledged",
  }).returning()

  check("Create closure referral (in_progress, acknowledged)", closeRef.status === "in_progress")

  const closed = await closeReferral(
    closeRef.id,
    "Follow-up completed and documented",
    "Patient attended all appointments. Condition resolved.",
    "system-test-coordinator",
    true // acknowledged
  )
  check("Close referral (completed)", closed.status === "completed")
  check("Close referral records outcome", closed.closureOutcome === "Follow-up completed and documented")
  check("Close referral records reason", closed.closureReason === "Patient attended all appointments. Condition resolved.")

  // Verify audit log for closure
  const closeAudit = await db.select().from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityId, closeRef.id),
        eq(auditLogs.action, "referral.close")
      )
    ).limit(1)
  check("Audit: referral.close action exists", closeAudit.length > 0)

  // ── SUMMARY ─────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`)
  console.log("═══════════════════════════════════════════════════════════════\n")

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("\n❌ E2E TEST FAILED:", e)
  process.exit(1)
})
