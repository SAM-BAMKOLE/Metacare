import AnalyticsDashboard from "@/modules/analytics/analytics-dashboard"
import {
  getDashboardMetrics,
  getStatusDistribution,
  getWeeklyTrend,
} from "@/server/dashboard"
import { getCurrentMembership } from "@/server/permissions"

export default async function AnalyticsPage() {
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

  const [metrics, statusDistribution, weeklyTrend] = await Promise.all([
    getDashboardMetrics(membership.organizationId),
    getStatusDistribution(membership.organizationId),
    getWeeklyTrend(membership.organizationId, 12),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          How referrals are moving, and where they slow down.
        </p>
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
