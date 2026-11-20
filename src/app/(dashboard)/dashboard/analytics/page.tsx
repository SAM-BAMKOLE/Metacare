import AnalyticsDashboard from "@/modules/analytics/analytics-dashboard"
import {
  getDashboardMetrics,
  getStatusDistribution,
  getWeeklyTrend,
} from "@/server/dashboard"
import { getCurrentMembership } from "@/server/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type DateRange = {
  start?: string
  end?: string
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: DateRange
}) {
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          No organisation membership found for your account.
        </p>
      </div>
    )
  }

  const start = searchParams.start ? new Date(searchParams.start) : undefined
  const end = searchParams.end ? new Date(searchParams.end) : undefined

  const [metrics, statusDistribution, weeklyTrend] = await Promise.all([
    getDashboardMetrics(membership.organizationId, 30, { start, end }),
    getStatusDistribution(membership.organizationId),
    getWeeklyTrend(membership.organizationId, 12, { start, end }),
  ])

  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 30)
  const defaultEnd = new Date()
  const formatInput = (d: Date) => d.toISOString().slice(0, 10)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 space-y-1 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            How referrals are moving, and where they slow down.
          </p>
        </div>

        <form
          method="get"
          className="flex items-end gap-2 rounded-xl border bg-card p-3 shadow-xs"
        >
          <div className="space-y-2">
            <label htmlFor="start-date" className="text-xs font-medium text-muted-foreground block">
              From
            </label>
            <Input
              id="start-date"
              name="start"
              type="date"
              defaultValue={formatInput(defaultStart)}
              className="w-32 text-xs"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="end-date" className="text-xs font-medium text-muted-foreground block">
              To
            </label>
            <Input
              id="end-date"
              name="end"
              type="date"
              defaultValue={formatInput(defaultEnd)}
              className="w-32 text-xs"
            />
          </div>
          <Button type="submit" className="text-xs">
            Apply
          </Button>
        </form>

        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="relative size-1.5 rounded-full bg-amber-500 animate-pulse" />
          </span>
          Simulated demo data
        </span>
      </div>

      <AnalyticsDashboard
        metrics={metrics}
        statusDistribution={statusDistribution}
        weeklyTrend={weeklyTrend}
        weeksBack={12}
      />
    </div>
  )
}
