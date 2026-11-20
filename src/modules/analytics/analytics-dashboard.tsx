"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FlaskConical,
  MailCheck,
  Phone,
  UserX,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { StatusCount, TrendPoint } from "@/server/dashboard"

const tick = { fill: "var(--muted-foreground)", fontSize: 12 }
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
}

const pct = (v: number | null) => (v === null ? "–" : `${v}%`)

interface AnalyticsDashboardProps {
  metrics: {
    screeningEventsRecorded: number
    resultsRequiringFollowUp: number
    openReferrals: number
    unassignedCases: number
    referralsAwaitingAcknowledgement: number
    overdueCases: number
    completedReferrals: number
    casesWithExceptions: number
    referralAcknowledgementRate: number
    followUpCompletionRate: number
    averageTimeToAcknowledgementHours: number | null
    patientCommunicationCoverageRate: number
    patientAcknowledgementRate: number
    documentedOutcomeRate: number
  }
  statusDistribution: StatusCount[]
  weeklyTrend: TrendPoint[]
  weeksBack: number
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: "default" | "danger" | "warning" | "success"
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    danger: "bg-red-50 text-destructive",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
  }
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
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
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  )
}

function ChartCard({
  title,
  description,
  label,
  className,
  children,
}: {
  title: string
  description: string
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn("rounded-xl border bg-card p-5 shadow-xs", className)}
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div role="img" aria-label={label} className="mt-4 h-64">
        {children}
      </div>
    </section>
  )
}

export default function AnalyticsDashboard({
  metrics,
  statusDistribution,
  weeklyTrend,
  weeksBack,
}: AnalyticsDashboardProps) {
  const rangeText = `last ${weeksBack} weeks`
  const openReferrals = metrics.openReferrals
  const overdueRate =
    openReferrals > 0
      ? Math.round((metrics.overdueCases / openReferrals) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Acknowledgement rate"
          value={pct(metrics.referralAcknowledgementRate)}
          hint={`Acknowledged referrals as % of sent`}
          icon={MailCheck}
        />
        <Metric
          label="Follow-up completion"
          value={pct(metrics.followUpCompletionRate)}
          hint={`Completed referrals as % of eligible`}
          icon={CheckCircle2}
          tone="success"
        />
        <Metric
          label="Overdue rate"
          value={`${overdueRate}%`}
          hint={`${metrics.overdueCases} of ${openReferrals} open referrals, as of today`}
          icon={AlertTriangle}
          tone={metrics.overdueCases > 0 ? "danger" : "default"}
        />
        <Metric
          label="Unassigned cases"
          value={String(metrics.unassignedCases)}
          hint="Open referrals with no owner, as of today"
          icon={UserX}
          tone={metrics.unassignedCases > 0 ? "warning" : "default"}
        />
        <Metric
          label="Avg. time to acknowledge"
          value={
            metrics.averageTimeToAcknowledgementHours === null
              ? "–"
              : `${metrics.averageTimeToAcknowledgementHours} h`
          }
          hint="Average hours from sent to acknowledged"
          icon={Clock}
        />
        <Metric
          label="Patient communication coverage"
          value={pct(metrics.patientCommunicationCoverageRate)}
          hint="Sent+ referrals contacted as % of all sent+ referrals"
          icon={Phone}
          tone={metrics.patientCommunicationCoverageRate > 0 ? "success" : "default"}
        />
        <Metric
          label="Patient acknowledgement rate"
          value={pct(metrics.patientAcknowledgementRate)}
          hint="Attempts acknowledged as % of delivery attempts"
          icon={MailCheck}
        />
        <Metric
          label="Documented outcome rate"
          value={pct(metrics.documentedOutcomeRate)}
          hint="Completed referrals with a documented outcome"
          icon={FileCheck}
          tone={metrics.documentedOutcomeRate > 0 ? "success" : "default"}
        />
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Referral status distribution"
          description={`Where referrals stand today`}
          label="Bar chart of referral counts by current status"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusDistribution}
              layout="vertical"
              margin={{ top: 0, right: 32, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <YAxis
                type="category"
                dataKey="status"
                width={160}
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={tooltipStyle}
              />
              <Bar
                dataKey="count"
                name="Referrals"
                fill="var(--chart-3)"
                radius={[0, 4, 4, 0]}
                barSize={18}
                label={{
                  position: "right",
                  fill: "var(--foreground)",
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Acknowledgement rate over time"
          description={`Share of sent referrals acknowledged, ${rangeText}`}
          label="Line chart of weekly acknowledgement rate"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyTrend}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                width={44}
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(l) => `Week of ${l}`}
                formatter={(v) => `${v}%`}
              />
              <Line
                type="monotone"
                dataKey="ackRate"
                name="Acknowledgement rate"
                stroke="var(--chart-3)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--chart-3)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Time to acknowledgement"
          description={`Average hours from sent to acknowledged, ${rangeText}`}
          label="Area chart of average hours to acknowledgement per week"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyTrend}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <YAxis
                unit=" h"
                width={48}
                tickLine={false}
                axisLine={false}
                tick={tick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(l) => `Week of ${l}`}
                formatter={(v) => `${v} h`}
              />
              <Area
                type="monotone"
                dataKey="avgAckHours"
                name="Avg. time to acknowledge"
                stroke="var(--chart-4)"
                strokeWidth={2.5}
                fill="var(--chart-1)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Metric definitions */}
      <section className="rounded-xl border bg-card p-5 shadow-xs">
        <h2 className="font-semibold mb-3">Metric definitions</h2>
        <dl className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="col-span-3 border-b pb-2">
            <dt className="font-medium text-foreground">Patient communication coverage</dt>
            <dd className="text-muted-foreground">
              % of referrals in sent-or-later status with a recorded patient
              communication (patientCommunicationStatus = &quot;contacted&quot;).
              Denominator: all sent+ referrals in the selected window.
            </dd>
          </div>
          <div className="col-span-3 border-b pb-2">
            <dt className="font-medium text-foreground">Patient acknowledgement rate</dt>
            <dd className="text-muted-foreground">
              % of notification delivery attempts that have an acknowledgement
              timestamp recorded.
              Denominator: all notification attempts in the selected window.
            </dd>
          </div>
          <div className="col-span-3 border-b pb-2">
            <dt className="font-medium text-foreground">Documented outcome rate</dt>
            <dd className="text-muted-foreground">
              % of completed referrals with a closure outcome recorded.
              Denominator: all completed referrals in the selected window.
            </dd>
          </div>
          <div className="col-span-3 border-b pb-2">
            <dt className="font-medium text-foreground">Referral acknowledgement rate</dt>
            <dd className="text-muted-foreground">
              % of sent referrals that have been acknowledged by the receiving
              provider.
              Denominator: all referrals in sent-or-later status.
            </dd>
          </div>
          <div className="col-span-3 border-b pb-2">
            <dt className="font-medium text-foreground">Follow-up completion rate</dt>
            <dd className="text-muted-foreground">
              % of eligible referrals (open or completed) that are completed.
              Denominator: all open + completed referrals.
            </dd>
          </div>
        </dl>
      </section>

      {/* Disclaimer */}
      <div className="flex gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-slate-600" />
        <p>
          <span className="font-medium text-foreground">
            Data is live from your organisation&apos;s records.
          </span>{" "}
          Figures reflect the current state of your database. No patient
          details appear on this page.
        </p>
      </div>
    </div>
  )
}
