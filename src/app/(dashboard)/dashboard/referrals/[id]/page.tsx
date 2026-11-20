import Link from "next/link"
import { notFound } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  Flag,
  ScrollText,
  UserCheck,
  UserX,
} from "lucide-react"

import { CareTimeline } from "@/components/shared/care-timeline"
import { PriorityBadge } from "@/components/shared/priority-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/modules/patients/data"
import { AcknowledgementPanel } from "@/modules/referrals/acknowledgement-panel"
import { ClosurePanel } from "@/modules/referrals/closure-panel"
import { CommunicationPanel } from "@/modules/referrals/communication-panel"
import { ConsultationPanel } from "@/modules/referrals/consultation-panel"
import { EscalationPanel } from "@/modules/referrals/escalation-panel"
import { FollowUpPanel } from "@/modules/referrals/followup-panel"
import { daysUntil } from "@/modules/referrals/data"
import { isAcknowledgedStatus } from "@/modules/referrals/detail-data"
import { type ReferralStatus } from "@/modules/referrals/data"
import { getCurrentMembership, getOrgUsersByRole } from "@/server/permissions"
import {
  getReferralDetail,
  getCareEventsForReferral,
  getNotificationAttemptsForReferral,
} from "@/server/referrals"
import {
  getClinicalConsultationsForReferral,
  getConfirmatoryFollowUpsForReferral,
} from "@/server/clinical-reviews"

const statusToTitle: Record<string, string> = {
  draft: "Draft",
  "pending_assignment": "Pending assignment",
  "ready_to_send": "Ready to send",
  sent: "Sent",
  "awaiting_acknowledgement": "Awaiting acknowledgement",
  acknowledged: "Acknowledged",
  "in_progress": "In progress",
  "awaiting_patient_action": "Awaiting patient action",
  "awaiting_followup_documentation": "Awaiting follow-up documentation",
  completed: "Completed",
  "declined_or_redirected": "Declined or redirected",
  cancelled: "Cancelled",
}

function toTitleStatus(s: string) {
  return statusToTitle[s] ?? s
}

function dueLabel(due: string | null, today: string) {
  if (!due) return "–"
  const d = daysUntil(due, today)
  if (d < 0) return `${-d} day${d === -1 ? "" : "s"} overdue`
  if (d === 0) return "Due today"
  return `In ${d} day${d === 1 ? "" : "s"}`
}

function Fact({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof Flag
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const membership = await getCurrentMembership()
  if (!membership) return notFound()

  const detail = await getReferralDetail(id, membership.organizationId)
  if (!detail) notFound()

  const {
    patientId,
    patientName,
    internalId,
    destination,
    owner,
    priority,
    due,
    status,
    providerAcknowledgementStatus,
    createdAt,
    referringOrganizationId,
    sourceScreening,
    instructions,
  } = detail

  const statusTitle = toTitleStatus(status)
  const today = new Date().toISOString().slice(0, 10)
  const overdue = Boolean(
    due &&
    new Date(due) < new Date(today) &&
    !["completed", "declined_or_redirected", "cancelled"].includes(status)
  )

  const patientHref = `/dashboard/patients/${patientId}`
  const role = membership.role as string

  const [careEvents, notificationAttempts, consultations, followUps, clinicians, staff] =
    await Promise.all([
      getCareEventsForReferral(id),
      getNotificationAttemptsForReferral(id),
      getClinicalConsultationsForReferral(id),
      getConfirmatoryFollowUpsForReferral(id),
      getOrgUsersByRole(membership.organizationId, "clinician"),
      getOrgUsersByRole(membership.organizationId, "care_coordinator"),
    ])

  const userName = (userId: string | null) => {
    if (!userId) return null
    const staffMember = staff.find((s) => s.id === userId)
    if (staffMember) return staffMember.name ?? userId
    const clinician = clinicians.find((c) => c.id === userId)
    if (clinician) return clinician.name ?? userId
    return userId
  }

  const timelineEvents = careEvents.map((e) => {
    let type: "screening" | "review" | "case" | "contact" | "referral" | "alert" = "case"
    if (e.eventType.includes("Screening")) type = "screening"
    else if (e.eventType.includes("Clinician")) type = "review"
    else if (e.eventType.includes("Referral created") || e.eventType.includes("Referral sent")) type = "referral"
    else if (e.eventType.includes("contact")) type = "contact"
    return {
      id: e.id,
      type,
      title: e.eventType,
      actor: userName(e.actorId) ?? "Unknown",
      at: e.timestamp.toISOString(),
      detail: e.details,
    }
  })

  const communications = notificationAttempts.map((a) => ({
    id: a.id,
    channel: a.channel as
      | "Phone call"
      | "SMS (simulated)"
      | "WhatsApp (simulated)"
      | "In person",
    outcome: a.outcome as
      | "Reached, informed of next step"
      | "Reached, needs assistance"
      | "No answer"
      | "Number unavailable"
      | "Declined to proceed",
    notes: [
      a.understanding ? `Understanding: ${a.understanding}` : null,
      a.concernQuestion ? `Concern: ${a.concernQuestion}` : null,
      a.nextStepExplained ? "Next step explained" : null,
    ]
      .filter(Boolean)
      .join("; "),
    by: a.actor,
    at: a.attemptAt,
  }))

  const consultationItems = consultations.map((c) => ({
    id: c.id,
    consultingClinician: userName(c.consultingClinicianId) ?? "Unknown clinician",
    requestingFrom: c.requestingClinicianOrFacility,
    date: c.consultationDate.toISOString().slice(0, 10),
    reason: c.reason,
    outcome: c.outcome as
      | "assessment_completed"
      | "more_information_requested"
      | "further_review_required"
      | "redirected"
      | "other",
    summary: c.summaryRecommendation ?? "",
    nextAction: c.nextAction ?? null,
    nextActionOwner: c.nextActionOwnerId ? userName(c.nextActionOwnerId) : null,
    nextActionDue: c.nextActionDueDate?.toISOString().slice(0, 10) ?? null,
  }))

  const followUpItems = followUps.map((f) => ({
    id: f.id,
    required: f.required as "yes" | "no" | "undetermined",
    label: f.testAssessmentLabel,
    status: f.status as
      | "not_ordered"
      | "ordered"
      | "scheduled"
      | "completed"
      | "result_pending_review"
      | "reviewed"
      | "cancelled",
    expectedDate: f.expectedDate?.toISOString().slice(0, 10) ?? null,
    orderedBy: f.orderedBy ? userName(f.orderedBy) : null,
    orderedAt: f.orderedAt?.toISOString() ?? null,
    completedAt: f.completedAt?.toISOString() ?? null,
    reviewedBy: f.reviewedBy ? userName(f.reviewedBy) : null,
    reviewedAt: f.reviewedAt?.toISOString() ?? null,
    outcomeSummary: f.outcomeSummary ?? null,
  }))

  const canRecordContact = [
    "care_coordinator",
    "clinician",
    "screening_staff",
  ].includes(role)
  const canRespond = role === "receiving_provider_staff"
  const canClose = ["care_coordinator", "clinician"].includes(role)
  const canEscalate = [
    "care_coordinator",
    "clinician",
    "organization_admin",
  ].includes(role)

  const isClinician = role === "clinician"

  const overview = (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border bg-card p-6 shadow-xs">
          <h2 className="font-semibold">Referral information</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Source screening
              </dt>
              <dd className="text-sm">
                {sourceScreening ? (
                  <Link
                    href={`/dashboard/patients/${sourceScreening.patientId}`}
                    className="text-primary hover:underline"
                  >
                    {sourceScreening.type} · {formatDate(sourceScreening.date)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    Documented care need
                  </span>
                )}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Referring organisation
              </dt>
              <dd className="text-sm">{referringOrganizationId}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-muted/60 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Instructions for the patient
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{instructions}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Approved administrative instructions only. Metacare does not
              generate treatment advice.
            </p>
          </div>
        </section>

        <CommunicationPanel
          referralId={id}
          initial={communications}
          canRecord={canRecordContact}
        />

        <section className="rounded-xl border bg-card p-6 shadow-xs">
          <h2 className="mb-5 font-semibold">Timeline</h2>
          <CareTimeline events={timelineEvents} />
        </section>
      </div>

      <aside className="space-y-6">
        <AcknowledgementPanel
          referralId={id}
          initial={{
            state: providerAcknowledgementStatus === "acknowledged"
              ? "acknowledged"
              : status === "awaiting_acknowledgement" || status === "sent"
                ? "pending"
                : "not_sent",
            by: destination,
            at: createdAt,
          }}
          destination={destination}
          canRespond={canRespond}
        />
        <ClosurePanel
          referralId={id}
          status={statusTitle as ReferralStatus}
          acknowledged={isAcknowledgedStatus(statusTitle as ReferralStatus)}
          canClose={canClose}
        />
        <EscalationPanel
          referralId={id}
          clinicians={clinicians.map((c) => ({ id: c.id, name: c.name ?? c.email ?? "Unknown" }))}
          canEscalate={canEscalate}
        />
        <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <ScrollText className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Audit trail.</span>{" "}
            Assignments, status changes, patient contact records,
            acknowledgements and closure decisions are logged with who did them
            and when. Audit entries do not copy clinical content.
          </p>
        </div>
      </aside>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/referrals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Work queue
      </Link>

      <section className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {`REF-${detail.id.replace(/\D/g, "").padStart(4, "0")}`}
          </span>
          <StatusBadge status={statusTitle} />
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-destructive ring-1 ring-red-600/20 ring-inset">
              <AlertTriangle className="size-3" /> Overdue
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Referral for{" "}
          <Link href={patientHref} className="text-primary hover:underline">
            {patientName}
          </Link>
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          {internalId}
        </p>

        <dl className="mt-6 grid gap-x-8 gap-y-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Priority" icon={Flag}>
            <PriorityBadge priority={priority} />
          </Fact>
          <Fact label="Due date" icon={CalendarClock}>
            <span
              className={overdue ? "font-medium text-destructive" : undefined}
            >
              {due ? formatDate(due) : "—"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {dueLabel(due, today)}
            </span>
          </Fact>
          <Fact label="Assigned owner" icon={owner ? UserCheck : UserX}>
            {owner ? (
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="size-3.5" />
                {owner}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Unassigned
              </span>
            )}
          </Fact>
          <Fact label="Receiving provider" icon={Building2}>
            {destination}
          </Fact>
        </dl>
      </section>

      {isClinician ? (
        <Tabs defaultValue="overview" className="gap-6">
          <TabsList className="h-10">
            <TabsTrigger value="overview" className="px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="consultation" className="px-4">
              Clinical consultation
              <span className="ml-1.5 rounded-full bg-background px-1.5 text-xs text-muted-foreground">
                {consultationItems.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="followup" className="px-4">
              Confirmatory follow-up
              <span className="ml-1.5 rounded-full bg-background px-1.5 text-xs text-muted-foreground">
                {followUpItems.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{overview}</TabsContent>
          <TabsContent value="consultation">
            <ConsultationPanel
              referralId={id}
              initial={consultationItems}
              clinicians={clinicians.map((c) => ({ id: c.id, name: c.name ?? c.email ?? "Unknown" }))}
              staff={staff.map((s) => ({ id: s.id, name: s.name ?? s.email ?? "Unknown" }))}
              today={today}
            />
          </TabsContent>
          <TabsContent value="followup">
            <FollowUpPanel
              referralId={id}
              initial={followUpItems}
              clinicians={clinicians.map((c) => ({ id: c.id, name: c.name ?? c.email ?? "Unknown" }))}
              today={today}
            />
          </TabsContent>
        </Tabs>
      ) : (
        overview
      )}
    </div>
  )
}
