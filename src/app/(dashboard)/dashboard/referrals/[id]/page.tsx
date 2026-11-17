import Link from "next/link"
import { notFound, redirect } from "next/navigation"
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

import { PriorityBadge } from "@/components/shared/priority-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { AcknowledgementPanel } from "@/modules/referrals/acknowledgement-panel"
import { ClosurePanel } from "@/modules/referrals/closure-panel"
import { CommunicationPanel } from "@/modules/referrals/communication-panel"
import { daysUntil, type ReferralStatus } from "@/modules/referrals/data"
import { formatDate } from "@/modules/patients/data"
import { getCurrentMembership } from "@/server/permissions"
import { getReferralDetail } from "@/server/referrals"

function dueLabel(due: string, today: string) {
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
  const membership = await getCurrentMembership()
  if (!membership) return redirect("/dashboard")

  const { id } = await params
  const detail = await getReferralDetail(id, membership.organizationId)
  if (!detail) notFound()

  const {
    patientName,
    internalId,
    destination,
    owner,
    priority,
    due,
    status,
    sourceScreening,
    instructions,
  } = detail
  const today = new Date().toISOString().slice(0, 10)
  const overdue =
    Boolean(due && new Date(due) < new Date()) &&
    !["Completed", "Declined or redirected", "Cancelled"].includes(status)
  const patientHref = `/dashboard/patients/${detail.patientId}`

  const canRecordContact = [
    "care_coordinator",
    "clinician",
    "screening_staff",
  ].includes(membership.role)
  const canRespond = membership.role === "receiving_provider_staff"
  const canClose = ["care_coordinator", "clinician"].includes(membership.role)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/referrals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Work queue
      </Link>

      {/* Header */}
      <section className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {detail.code}
          </span>
          <StatusBadge status={status} />
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
            <span className={overdue ? "font-medium text-destructive" : undefined}>
              {formatDate(due ?? today)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {dueLabel(due ?? today, today)}
            </span>
          </Fact>
          <Fact label="Assigned owner" icon={owner ? UserCheck : UserX}>
            {owner ?? (
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-card p-6 shadow-xs">
            <h2 className="font-semibold">Referral information</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {sourceScreening && (
                <div className="space-y-1">
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Source screening
                  </dt>
                  <dd className="text-sm">
                    <Link
                      href={`/dashboard/patients/${sourceScreening.patientId}`}
                      className="text-primary hover:underline"
                    >
                      {sourceScreening.type} ·{" "}
                      {formatDate(sourceScreening.date)}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="space-y-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Referring organisation
                </dt>
                <dd className="text-sm">{detail.referringOrganizationId}</dd>
              </div>
            </dl>
            <div className="mt-5 rounded-lg bg-muted/60 p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Instructions for the patient
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">
                {instructions || "No instructions recorded."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Approved administrative instructions only. Metacare does not
                generate treatment advice.
              </p>
            </div>
          </section>

          <CommunicationPanel
            referralId={detail.id}
            initial={[]}
            canRecord={canRecordContact}
          />

          <section className="rounded-xl border bg-card p-6 shadow-xs">
            <h2 className="mb-5 font-semibold">Timeline</h2>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          <AcknowledgementPanel
            referralId={detail.id}
            destination={detail.destination}
            canRespond={canRespond}
          />
          <ClosurePanel
            referralId={detail.id}
            status={detail.status as ReferralStatus}
            acknowledged={detail.providerAcknowledgementStatus === "acknowledged"}
            canClose={canClose}
          />
          <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <ScrollText className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium text-foreground">Audit trail.</span>{" "}
              Assignments, status changes, patient contact records,
              acknowledgements and closure decisions are logged with who did
              them and when. Audit entries do not copy clinical content.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
