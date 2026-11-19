# Metacare

Metacare is a care-coordination platform that closes the screening-to-care loop. It keeps every next step visible, assigned, and accountable — from screening result through clinical review, referral creation, patient communication, provider acknowledgement, and documented closure.

## What it does

Metacare helps clinics track screening results and ensure that every abnormal result leads to a documented next step, never a lost referral:

1. **Screening recorded** — Staff record screening events and results for patients.
2. **Clinical review** — A clinician reviews abnormal screenings and documents whether follow-up is required.
3. **Referral created** — A care coordinator creates a referral with an owner, destination, priority, and due date.
4. **Patient contacted** — The patient is contacted and every attempt is recorded.
5. **Referral acknowledged** — The receiving facility confirms receipt and updates progress.
6. **Outcome documented** — A referral is only complete when an outcome or exception is documented.

## Architecture

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | Neon serverless Postgres |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | better-auth (email/password) |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |

## Project structure

```
src/
├── app/
│   ├── (app)/                    # Public pages (landing, sign-in, sign-up)
│   ├── (dashboard)/              # Authenticated dashboard routes
│   │   ├── dashboard/            # Overview dashboard with metrics & queues
│   │   ├── patients/             # Patient directory & detail
│   │   ├── screenings/           # Screening list & clinical review
│   │   ├── referrals/            # Referral work queue, creation & detail
│   │   ├── notifications/        # In-app notification centre
│   │   ├── analytics/            # Referral analytics & charts
│   │   ├── settings/             # Organisation & member management
│   │   └── audit/                # Audit log viewer (org admin only)
│   └── api/
│       └── auth/                 # better-auth route handlers
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── shared/                   # Shared UI components (layout, nav, form-field)
│   ├── layout/                   # Shell layout components
│   └── modules/                  # Domain-specific UI components
├── lib/
│   ├── db.ts                     # Drizzle Neon client
│   └── utils.ts                  # Utility helpers
├── modules/                      # Domain modules (UI components + actions)
│   ├── patients/
│   ├── screenings/
│   ├── clinical-reviews/
│   ├── referrals/
│   ├── notifications/
│   ├── analytics/
│   ├── organizations/
│   └── audit/
├── server/                       # Server actions & business logic
│   ├── auth.ts                   # better-auth instance + session helper
│   ├── permissions.ts            # RBAC helpers (getCurrentMembership, requireRole)
│   ├── patients.ts               # Patient CRUD + audit
│   ├── screenings.ts             # Screening CRUD + review queue
│   ├── clinical-reviews.ts       # Clinical review decisions (clinician-only)
│   ├── referrals.ts              # Referral lifecycle transitions + audit
│   ├── dashboard.ts              # Metrics, attention items, activity
│   ├── notifications.ts          # Notification centre
│   ├── organizations.ts          # Org & member management
│   └── audit/                    # Audit log queries
└── db/
    ├── schema/                   # Drizzle schema definitions
    └── migrations/               # Generated SQL migrations
```

## Database schema

Core tables:

- **organizations** — Healthcare organizations (clinics, hospitals, facilities)
- **users** — better-auth user accounts (email/password)
- **organization_memberships** — Links users to organizations with roles (`organization_admin`, `screening_staff`, `clinician`, `care_coordinator`, `receiving_provider_staff`)
- **patients** — Patient records (org-scoped)
- **screening_events** — Screening records with result category and clinical review flag
- **clinical_reviews** — Clinician decisions (follow-up required, priority, recommendation)
- **referrals** — Referral records with full lifecycle status (`draft` → `pending_assignment` → `ready_to_send` → `sent` → `awaiting_acknowledgement` → `acknowledged` → `in_progress` → `awaiting_patient_action` → `awaiting_followup_documentation` → `completed`, with terminal branches `declined_or_redirected` and `cancelled`)
- **care_events** — Chronological timeline of all actions on a referral
- **notifications** — In-app notifications (simulated delivery flagged)
- **notification_attempts** — Delivery attempt records
- **audit_logs** — Audit trail for sensitive actions (actor, action, entity, timestamp)

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A Neon serverless Postgres database (or any PostgreSQL 14+ instance)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon/Postgres connection string (SSL required) |
| `BETTER_AUTH_SECRET` | Random secret for better-auth session signing |
| `BETTER_AUTH_URL` | Base URL of your app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public URL used in emails/redirects |

### 3. Set up the database

Generate and push migrations:

```bash
pnpm db:generate
pnpm db:push
```

### 4. Seed demo data

```bash
pnpm db:seed
```

This creates:
- 2 organizations: "Community Health Clinic" (referring) and "Receiving Care Facility" (receiving)
- 6 demo users (one per role) — all with password `Demo1234!`
- 2 fictional patients
- Screening events, clinical reviews, referrals (including an overdue unacknowledged case), care events, and audit logs

### 5. Run the development server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Demo accounts

All demo users share the password `Demo1234!`:

| Email | Role | Organization |
|-------|------|--------------|
| admin@community.clinic | Organization Admin | Community Health Clinic |
| screener@community.clinic | Screening Staff | Community Health Clinic |
| clinician@community.clinic | Clinician | Community Health Clinic |
| coordinator@community.clinic | Care Coordinator | Community Health Clinic |
| admin@receiving.facility | Organization Admin | Receiving Care Facility |
| receiver@receiving.facility | Receiving Provider Staff | Receiving Care Facility |

## Demo journey

1. Sign in as `screener@community.clinic`
2. Go to **Patients** → view patient "Amara Okonkwo" (PAT-0001)
3. Go to **Screenings** → view her abnormal cervical cancer screening (awaiting clinical review)
4. Sign in as `clinician@community.clinic` → document follow-up required + next step
5. Sign in as `coordinator@community.clinic` → create referral to "Cardiology Department", assign owner + due date
6. Sign in as `receiver@receiving.facility` → acknowledge the referral
7. Sign in as `coordinator@community.clinic` → record patient contact + document outcome → close referral
8. Return to **Dashboard** → see updated metrics

## Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type check |
| `pnpm format` | Format with Prettier |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Drizzle Studio |

## Key design decisions

- **Role-based access control** is enforced server-side on every mutation. Client-side UI hiding is supplementary only.
- **Referral lifecycle transitions** are validated server-side — invalid transitions (e.g., skipping steps) are rejected.
- **Audit logs** are written on every sensitive action (patient create/update, screening, clinical decision, referral status transition, communication, acknowledgement, closure, membership changes). Audit entries record who acted and when, but never duplicate clinical content.
- **Overdue/blocked/escalated flags** are computed, not stored — they reflect the current state of each referral.
- **Simulated delivery** — notification delivery attempts are marked `simulated: true`; no real SMS/email is sent in the prototype.
- **All patient data is fictional** and for demonstration only. This is not a diagnostic system and is not ready for real patient records.

## Project status

This is a hackathon prototype. Core workflow (screening → clinical review → referral → acknowledgement → closure) is implemented end-to-end. Patient-facing screens and multi-organization support are out of MVP scope.