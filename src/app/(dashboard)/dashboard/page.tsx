import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardPlus,
  FileText,
  ListChecks,
  MailCheck,
  Percent,
  Phone,
  Send,
  Stethoscope,
  UserRoundPlus,
  UserX,
  type LucideIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDashboardMetrics } from "@/server/dashboard"
import { getAttentionItems } from "@/server/dashboard"
import { getRecentActivity } from "@/server/dashboard"
import { getCurrentMembership } from "@/server/permissions"
import { formatDateTime } from "@/modules/patients/data"
import { CreateOrganizationCard } from "@/modules/organizations/create-organization-card"

const activityIcons: Record<string, LucideIcon> = {
  screening: ClipboardPlus,
  review: Stethoscope,
  case: FileText,
  contact: Phone,
  referral: Send,
  alert: AlertTriangle,
}

type Tone = "default" | "warning" | "danger" | "success"

const tones: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-destructive",
  success: "bg-emerald-50 text-emerald-700",
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: Tone
  hint?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const membership = await getCurrentMembership()
  if (!membership) {
    return <CreateOrganizationCard />
  }

  const [m, attention, activity] = await Promise.all([
    getDashboardMetrics(membership.organizationId),
    getAttentionItems(membership.organizationId),
    getRecentActivity(membership.organizationId),
  ])

  const actions = [
    {
      label: "Register patient",
      href: "/dashboard/patients",
      icon: UserRoundPlus,
      primary: true,
    },
    {
      label: "Record screening",
      href: "/dashboard/screenings/new",
      icon: ClipboardPlus,
    },
    { label: "Create referral", href: "/dashboard/referrals/new", icon: Send },
    {
      label: "View work queue",
      href: "/dashboard/referrals",
      icon: ListChecks,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          What needs attention across your referrals today.
        </p>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-wrap gap-3">
        {actions.map(({ label, href, icon: Icon, primary }) => (
          <Link
            key={label}
            href={href}
            className={buttonVariants({
              variant: primary ? "default" : "outline",
              size: "lg",
            })}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </div>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Screening events recorded"
          value={m.screeningEventsRecorded}
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Results requiring follow-up"
          value={m.resultsRequiringFollowUp}
          icon={Stethoscope}
        />
        <MetricCard
          label="Open referrals"
          value={m.openReferrals}
          icon={Send}
        />
        <MetricCard
          label="Unassigned cases"
          value={m.unassignedCases}
          icon={UserX}
          tone={m.unassignedCases > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Awaiting acknowledgement"
          value={m.referralsAwaitingAcknowledgement}
          icon={MailCheck}
          tone={m.referralsAwaitingAcknowledgement > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Overdue cases"
          value={m.overdueCases}
          icon={AlertTriangle}
          tone={m.overdueCases > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Completed referrals"
          value={m.completedReferrals}
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Acknowledgement rate"
          value={`${m.referralAcknowledgementRate}%`}
          icon={Percent}
          hint="Of referrals sent, all time"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Attention */}
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs lg:col-span-3">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Overdue &amp; unassigned</h2>
              <p className="text-sm text-muted-foreground">
                Referrals that need a person to act.
              </p>
            </div>
            <Link
              href="/dashboard/referrals"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {attention.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">All clear</p>
              <p className="text-sm text-muted-foreground">
                No overdue or unassigned referrals.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {attention.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/dashboard/referrals/${i.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        i.reason === "Overdue" ? tones.danger : tones.warning
                      )}
                    >
                      {i.reason === "Overdue" ? (
                        <AlertTriangle className="size-4" />
                      ) : (
                        <UserX className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {i.patientName}
                        <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                          {i.internalId}
                        </span>
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {i.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.detail}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        i.reason === "Overdue"
                          ? "bg-red-50 text-destructive ring-red-600/20"
                          : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      )}
                    >
                      {i.reason}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-xl border bg-card shadow-xs lg:col-span-2">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Recent activity</h2>
            <p className="text-sm text-muted-foreground">Latest care events.</p>
          </div>
          {activity.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            <ol className="relative space-y-5 p-5">
              <span
                className="absolute top-8 bottom-8 left-9 w-px bg-border"
                aria-hidden
              />
              {activity.map((a) => {
                const Icon = activityIcons[a.type] ?? Activity
                return (
                  <li key={a.id} className="relative flex gap-3">
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                        a.type === "alert" ? tones.danger : tones.default
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {a.patientName} · {a.actor}
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {formatDateTime(a.at)}
                      </time>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        All figures shown are from your organisation&apos;s records.
      </p>
    </div>
  )
}
