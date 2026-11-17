# Metacare Implementation Plan

**Source spec:** `metacare-project-description.md`
**Repo:** `C:\Users\HP\workspace\hackathon\Metacare`
**Plan location:** `.kilo\plans\1794822044998-metacare-implementation-plan.md`

## Goal

Build the Metacare hackathon prototype: a care-coordination platform that closes the screening-to-care loop. An evaluator must be able to sign in as different roles, view a fictional patient record, record a screening event, move it through clinical review, create/assign a referral, record patient communication, sign in as a receiving-provider user and acknowledge the referral, update follow-up, see overdue/blocked work surfaced, document an outcome/exception, and see the timeline + dashboard update. One reliable end-to-end journey beats broad disconnected screens.

## Working rules (from user)

- One step (or substep) at a time; user verifies before continuing.
- Interface steps: I describe sections/cards/detail; the user builds the UI. I do not write UI code in those steps.
- No commits unless explicitly asked.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` after implementation steps.

## Stack decisions (resolved)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Already scaffolded |
| Language | TypeScript (strict) | `tsc --noEmit` |
| Package manager | pnpm | Lockfile present |
| UI | Tailwind v4 + shadcn/ui | `components.json` present; style `base-vega`, lucide icons |
| Database | Neon serverless Postgres | User confirmed; `@neondatabase/serverless` driver |
| ORM | Drizzle ORM + drizzle-kit | Schema in `src/db/schema/`, migrations in `drizzle/` |
| Auth | better-auth | Email/password + sessions; org membership handled via memberships table |
| Validation | Zod | Server-side action/schema validation |
| Charts | Recharts | Dashboard analytics |
| Testing | Vitest + Playwright | To add as dev dependencies |
| Icons | Lucide | Already installed |

## Data model (Drizzle entities)

`organizations`, `users` (better-auth user + link), `organization_memberships` (user + org + role), `patients`, `screening_events`, `clinical_reviews`, `referrals`, `care_events`, `notifications`, `notification_attempts`, `audit_logs`.

Relationships per spec §10: org → members/patients; user → org-specific role; patient → screening events; screening event → clinical review; screening/care need → referral; referral → patient + referring org + receiving org + assigned owner; referral → care events, notifications, attempts. Stable IDs (uuid/cuid), `createdAt`/`updatedAt` timestamps, FK constraints, indexes on org + status + due date + owner.

Roles: `organization_admin`, `screening_staff`, `clinician`, `care_coordinator`, `receiving_provider_staff`. Patient-facing UI deferred post-MVP (spec role 5.6 exists but MVP essential features §13 do not list patient screens).

Referral lifecycle (enforced server-side, valid transitions only):
`draft → pending_assignment → ready_to_send → sent → awaiting_acknowledgement → acknowledged → in_progress → awaiting_patient_action → awaiting_followup_documentation → completed`, with terminal branches `declined_or_redirected` and `cancelled`. `overdue`, `blocked`, `escalated` are workflow flags/calculated conditions, not statuses.

## Step-by-step plan

### Phase 0 — Foundation

**Step 1: Environment & dependencies**
1.1 Install dependencies: `better-auth`, `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `zod`, `uuid` (or `nanoid`), `tsx`, `vitest`, `@playwright/test`.
1.2 Create `.env.example` and `.env`: `DATABASE_URL` (Neon connection string), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
1.3 Configure `drizzle.config.ts` and package scripts: `db:generate`, `db:push`, `db:seed`, `db:studio`.
1.4 Verify: `pnpm install`, `pnpm typecheck`, `pnpm lint` clean.

**Step 2: Database schema & migrations**
2.1 `src/lib/db.ts` — Drizzle Neon client singleton.
2.2 `src/db/schema/` — one file per entity (`organizations.ts`, `users.ts`, `organizationMemberships.ts`, `patients.ts`, `screeningEvents.ts`, `clinicalReviews.ts`, `referrals.ts`, `careEvents.ts`, `notifications.ts`, `notificationAttempts.ts`, `auditLogs.ts`) with relations and indexes.
2.3 Run `pnpm db:generate` then `pnpm db:push` against Neon; verify tables exist.
1.4 (validation) Inspect Neon schema; confirm FKs and timestamps.

### Phase 1 — Auth & authorization

**Step 3: better-auth integration**
3.1 `src/server/auth.ts` — better-auth instance (email/password), better-auth Next.js handler route `src/app/api/auth/[...]/route.ts`.
3.2 Session helper: `getCurrentSession()` / `getCurrentUser()` server wrapper.
3.3 `(auth)` routes: sign-in, sign-up, post-login org selection (user may belong to multiple orgs; prototype stores active org in session).
3.4 Verify: sign-up → sign-in → session cookie works; protected route redirects unauthenticated users.

**Step 4: Organization membership & RBAC**
4.1 Seed `organizations` and `organization_memberships` rows linking users to orgs with roles.
4.2 Server-only permission helpers: `hasRole(user, org, roles[])`, `isInOrg(user, orgId)`, `requireRole(...)` throwing 403.
4.3 Middleware: protect all `(dashboard)/*` routes; unauthenticated → sign-in.
4.4 Verify: role-based access denial (e.g., screening staff cannot access org settings).

### Phase 2 — Seed data

**Step 5: Fictional seed data**
5.1 Seed script `scripts/seed.ts` (tsx): referring clinic org + receiving facility org; one user per role; 2–3 fictional patients; mix of open/overdue/acknowledged referrals.
5.2 Mark all seed data clearly as simulated/fictional (spec §12 clinical safety).
5.3 Run `pnpm db:seed`; verify demo accounts sign in and see seed data.

### Phase 3 — Core workflow modules

**Step 6: Patients module**
6.1 Server actions/service functions: create patient, list patients (org-scoped), get patient.
6.2 Zod schemas for patient create/update.
6.3 UI description (user builds):
   - Patient directory: search bar, table of patients (name, DOB, org, latest screening), "Register patient" button, row → patient detail.
   - Patient detail: header with contact info, tabs for screening events / referrals / timeline, links to create screening.
6.4 Audit log on patient create/update.
6.5 Verify: create patient → appears in directory; org-scoped (users only see their org's patients).

**Step 7: Screening management**
7.1 Service: create screening event (patient, type, date/location, recording staff, result category, notes, requiresClinicalReview flag); list screening events; flag awaiting clinical review.
7.2 Zod validation; audit log on create.
7.3 UI description (user builds):
   - Screening list: table (patient, type, date, result, review status), filter "Awaiting clinical review", "Create screening" button.
   - Create screening form: patient lookup, screening type, result, notes, checkbox "requires clinical review".
7.4 Verify: screening event saved with `requiresClinicalReview=true` shows in review queue.

**Step 8: Clinical reviews**
8.1 Service: create clinical review linked to screening event (clinician, decision: follow-up required yes/no, next-step recommendation, clinical priority); mark screening reviewed.
8.2 Enforce: only role `clinician` can create reviews; the app records the decision, never makes it.
8.3 UI description (user builds):
   - Review screen: screening details, decision form (follow-up required / not required, next step, priority), "Document decision" button.
8.4 Verify: clinician documents decision; screening status updates; non-clinician blocked.

**Step 9: Referral management (central module)**
9.1 Service: create referral from screened event/clinical decision (patient, source screening, referring org, receiving org/provider, assigned owner, clinician-set priority, due date, instructions, initial status `draft`).
9.2 Validated state transition service: `transitionReferral(referralId, from, to, actor, reason)` enforcing the lifecycle graph; records care event + audit log.
9.3 List referrals with filters (status, owner, receiving org, due date, overdue flag).
9.4 UI description (user builds):
   - Create referral form linked from a reviewed screening.
   - Referral list/work queue table.
9.5 Verify: referral created with `draft` status; invalid transitions rejected server-side.

**Step 10: Care timeline & activity history**
10.1 `care_events` entries on every important transition (screening recorded, review documented, referral created, patient contacted, referral sent, acknowledged, appointment, outcome); fields: actor, timestamp, event type, details.
10.2 Timeline UI description (user builds): chronological list on referral detail and patient detail (event, actor, time, details); permission-aware visibility.
10.3 Verify: creating a referral appends a timeline entry visible on the referral detail page.

**Step 11: Patient communication records**
11.1 Service: record communication attempt (referral, channel, attempt time, outcome: contacted/not reached/left message, notes); flags patient as contacted.
11.2 UI description (user builds): on referral detail, "Record patient contact" form with outcome; shows history of attempts.
11.3 Verify: failed attempt remains visible; referral stays in queue.

**Step 12: Receiving-provider acknowledgement**
12.1 Service: receiving provider staff view referrals addressed to their org; actions: acknowledge receipt / request more info / decline with reason; transitions `awaiting_acknowledgement → acknowledged` or `declined_or_redirected`.
12.2 UI description (user builds): receiving provider inbox (referrals to my org), acknowledgement modal with reason.
12.3 Verify: sign in as receiving-provider user → sees referral → acknowledges → status updates; referring org sees acknowledgement.

**Step 13: Notifications centre**
13.1 `notifications` + `notification_attempts` tables; in-app notifications; simulated SMS/messaging delivery clearly flagged as simulated (spec §6.6).
13.2 Notification triggers: new referral assigned, awaiting acknowledgement, due-date approaching, overdue, patient responded, provider updated, escalated.
13.3 Failed delivery must not hide the underlying task (retry-tolerant design; mark attempt failed, notification remains visible).
13.4 UI description (user builds): notifications bell/centre, list with read/unread/failed/pending states, click → navigate to case.
13.5 Verify: creating a referral generates a notification; delivery simulation marks attempts.

**Step 14: Work queues & escalation flags**
14.1 Computed flags: `overdue = dueDate < now && status not terminal`; `blocked`; `escalated`; `unassigned = no owner`.
14.2 Queue categories per spec §6.7: unassigned, awaiting transmission, awaiting acknowledgement, patients awaiting contact, approaching due date, overdue, blocked, awaiting documentation, awaiting closure review.
14.3 UI description (user builds): work queue page grouped by category with owner assignment action.
14.4 Verify: overdue referral appears in overdue queue; unassigned referral in unassigned queue.

**Step 15: Dashboard & analytics**
15.1 Metrics per spec §6.8: screening events, results requiring follow-up, open referrals, unassigned cases, awaiting acknowledgement, overdue, completed, acknowledgement rate, completion rate, average time between stages. Defined denominators/time windows; seed data identified as simulated.
15.2 UI description (user builds): dashboard with metric cards, overdue/unassigned highlight, recent activity, shortcuts; charts via recharts; filters by date range/facility.
15.3 Verify: dashboard numbers match seed data counts.

### Phase 4 — Operations

**Step 16: Audit logs**
16.1 `audit_logs` writes on sensitive actions (patient create/update, screening, clinical decision, referral status transition, communication, closure/exception, membership changes); fields: actor, action, affected record, timestamp.
16.2 Verify: sensitive action produces an audit row; audit records don't duplicate sensitive clinical content.

**Step 17: Organization & member settings**
17.1 UI description (user builds): org details, invite/manage members, assign roles, basic operational settings. Org admin separate from clinical-record access (spec §5.1).
17.2 Verify: org admin can invite/remove members and assign roles.

**Step 18: Public landing page & auth screens**
18.1 `(public)` landing: problem, value, capabilities, sign-in/demo access.
18.2 `(auth)` sign-in/sign-up with session feedback.
18.3 Verify: unauthenticated visitor lands on public page; sign-in works.

### Phase 5 — Demo verification & polish

**Step 19: End-to-end demo scenario (spec §14)**
Run the full journey as different users:
1. Screening staff opens patient record, creates screening event, records result.
2. Event assigned for clinical review; clinician documents follow-up required + next step.
3. Care coordinator creates referral to receiving facility, assigns owner + due date.
4. Patient marked contacted; communication attempt recorded.
5. Receiving provider signs in, acknowledges referral.
6. Receiving provider records appointment/assessment update.
7. Care coordinator records returned follow-up info.
8. Authorized user documents outcome and closes case.
9. Dashboard reflects updated status; timeline shows full sequence.
Plus exception path: referral unacknowledged past deadline → overdue flag → queue → coordinator alert → escalation recorded → case remains traceable.
Verify all 12 success measures from spec §20.

**Step 20: Final checks & handoff**
20.1 `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass.
20.2 Document env vars needed for deployment (Vercel recommended), Neon DB connection, seed command.
20.3 Hand off to user for UI build of described pages and demo recording.

## Risks & mitigations

- **better-auth + Next.js 16 App Router auth boundary:** keep auth in route handlers + server sessions; client components read session via server props, not browser cookies directly.
- **Role/org checks bypassed via URL params:** all mutations go through server actions/service functions that re-check org membership and role; no client-only authorization.
- **Next.js 16 is newer than common training data:** verify APIs against `node_modules/next/dist/docs` as directed by AGENTS.md before writing App Router code.
- **Simulated vs real delivery:** every notification attempt row records `simulated: true`; UI labels simulated messages.

## Open questions (deferred)

- Patient-facing screens: out of MVP scope; add post-hackathon if time allows.
- Deployment target: Vercel (recommended) vs other host — confirm at Step 20.
- Multi-org per user: prototype stores one active org per session; full multi-org is post-MVP.

## Validation gates

After each implementation step: `pnpm lint` clean, `pnpm typecheck` clean, and manual verification of the affected demo flow. Step 19 must pass all 12 evaluator checks before the plan is considered complete.