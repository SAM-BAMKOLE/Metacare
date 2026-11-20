# Metacare — Phase 5 (Event-Derived Metrics) & Phase 6 (Release Verification)

**Source spec:** `Metacare_Submission_Readiness_Implementation_Guide.docx`
**Repo:** `C:\Users\HP\workspace\hackathon\Metacare`
**Plan location:** `.kilo\plans\1795174714709-metacare-phase5-metrics-phase6-release.md`
**Prior plan:** `.kilo\plans\1794822044998-metacare-implementation-plan.md` (Phases 0-5 complete)

## Goal

Complete the two remaining submission-readiness phases:
- Phase 5 (P1): event-derived metrics — add the three missing metrics, date-range filter, "Simulated demo data" label, and metric definitions to the analytics surface.
- Phase 6 (P0): release verification — typecheck/lint/build clean, E2E demo run, exception path, cross-org access denial, document seed command + deploy URL.

## Decisions (resolved)

| Decision | Resolution |
|---|---|
| Metric denominators | Confirmed with user: (1) Patient communication coverage rate = % of referrals in sent+ status with `patientCommunicationStatus === 'contacted'`; (2) Patient acknowledgement rate = % of `notification_attempts` with `acknowledgementAt` set; (3) Documented outcome rate = % of completed referrals with `closureOutcome` set |
| Where metrics live | Extend `getDashboardMetrics` in `src/server/dashboard.ts` (`DashboardMetrics` interface); keep `daysBack=30` default, add optional `start`/`end` Date params for date-range filtering |
| UI scope | Confined to analytics page + `AnalyticsDashboard` component; no new pages |
| "Simulated demo data" label | Added to analytics page (delivery attempts are `simulated: true`) |
| Metric definitions | Visible definitions section on analytics page (denominator + window per metric) |
| Commits | None unless explicitly asked |

## Phase 5 — Event-derived metrics

### Task 5.1 — Server metrics (`src/server/dashboard.ts`)
- Extend `DashboardMetrics` with:
  - `patientCommunicationCoverageRate: number`
  - `patientAcknowledgementRate: number`
  - `documentedOutcomeRate: number`
- Add optional `start`/`end` (Date) params to `getDashboardMetrics` (default last 30 days via `daysBack`); compute the three metrics over the selected window.
- Add optional `start`/`end` to `getWeeklyTrend` for date-range consistency (default last 12 weeks).

### Task 5.2 — Analytics UI cards (`src/modules/analytics/analytics-dashboard.tsx`)
- Add 3 metric cards: Patient communication coverage, Patient acknowledgement rate, Documented outcome rate (reuse existing `Metric` component + `pct` formatter).
- Add a metric definitions section listing each metric's denominator and time window.

### Task 5.3 — Analytics page (`src/app/(dashboard)/dashboard/analytics/page.tsx`)
- Add a date-range filter UI; pass selected range to `getDashboardMetrics` / `getWeeklyTrend`.
- Add "Simulated demo data" label near the metrics/header.
- Preserve existing `getStatusDistribution` + `getWeeklyTrend` calls.

### Task 5.4 — Verify Phase 5
- `pnpm typecheck` clean
- `pnpm lint` clean
- `pnpm build` clean

## Phase 6 — Release verification

### Task 6.1 — Final checks
- `pnpm typecheck` clean
- `pnpm lint` clean
- `pnpm build` clean (18 routes)

### Task 6.2 — E2E demo
- Run `scripts/e2e-demo.ts` against the seeded Neon DB (`pnpm db:seed` first if DB needs reseeding).
- Expect all checks to pass (was 88/88; re-count after Phase 5 changes).

### Task 6.3 — Exception path
- Verify overdue → work queue → escalation flow (covered by e2e steps 7/10/12): past-due referral flagged overdue, appears in overdue queue, escalation created/acknowledged/resolved.

### Task 6.4 — Cross-org access denial
- Manual test: sign in as a user in org A, attempt to read/transition a referral belonging to org B → expect 403 (server-side org scoping already enforced in `getReferralDetail`/`listReferrals`).

### Task 6.5 — Documentation
- Seed command: `pnpm db:seed` (already in README).
- Deploy URL: N/A for local dev; note required env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`) and recommended host (Vercel + Neon) in README if not already present.

## Verification gates (all must pass before plan complete)

- `pnpm typecheck` clean
- `pnpm lint` clean
- `pnpm build` clean
- `scripts/e2e-demo.ts` passes all checks
- Cross-org access denial confirmed (403)

## Files to touch

- `src/server/dashboard.ts` — 3 new metrics + date-range params
- `src/modules/analytics/analytics-dashboard.tsx` — 3 cards + definitions section
- `src/app/(dashboard)/dashboard/analytics/page.tsx` — date-range filter + simulated label
- `README.md` — optional: Phase 5 metric definitions note + deploy/env notes
