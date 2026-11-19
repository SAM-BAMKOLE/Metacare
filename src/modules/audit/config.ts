// Shared by the server query and the page. No database or server-only imports here.

export const PAGE_SIZE = 25
export const APP_TIME_ZONE = "Africa/Lagos" // UTC+1, no daylight saving
const TZ_OFFSET = "+01:00"

// ---- Action groups (the filter dropdown) ------------------------------------
// ALIGN THESE with the exact `action` strings your server code writes to
// auditLogs.action. Anything not listed still appears under "All".
export const actionGroups = [
  {
    key: "patient",
    label: "Patient create/update",
    actions: ["patient.create", "patient.update"],
  },
  { key: "screening", label: "Screening event", actions: ["screening.create"] },
  {
    key: "review",
    label: "Clinical review",
    actions: ["clinical_review.create"],
  },
  {
    key: "referral_created",
    label: "Referral created",
    actions: ["referral.create"],
  },
  {
    key: "referral_status",
    label: "Referral status change",
    actions: ["referral.transition"],
  },
  {
    key: "communication",
    label: "Patient communication",
    actions: ["communication.record"],
  },
  {
    key: "acknowledgement",
    label: "Referral acknowledgement",
    actions: ["referral.acknowledge"],
  },
  { key: "closure", label: "Referral closure", actions: ["referral.close"] },
  {
    key: "membership",
    label: "Membership change",
    actions: [
      "membership.invite",
      "membership.invite_cancel",
      "membership.role_change",
      "membership.deactivate",
      "membership.reactivate",
    ],
  },
] as const

export type AuditGroupKey = (typeof actionGroups)[number]["key"]

// Human label, plus a generic description used instead of stored details for
// sensitive entities so patient information can never reach the browser.
const actionMeta: Record<string, { label: string; generic: string }> = {
  "patient.create": {
    label: "Patient created",
    generic: "Patient record created",
  },
  "patient.update": {
    label: "Patient updated",
    generic: "Patient record updated",
  },
  "screening.create": {
    label: "Screening recorded",
    generic: "Screening event recorded",
  },
  "clinical_review.create": {
    label: "Clinical review recorded",
    generic: "Clinical decision documented",
  },
  "referral.create": { label: "Referral created", generic: "Referral created" },
  "referral.transition": {
    label: "Referral status changed",
    generic: "Referral status changed",
  },
  "communication.record": {
    label: "Patient contact recorded",
    generic: "Patient contact recorded",
  },
  "referral.acknowledge": {
    label: "Referral acknowledgement",
    generic: "Referral response recorded",
  },
  "referral.close": {
    label: "Referral closed",
    generic: "Referral outcome documented",
  },
  "organisation.create": {
    label: "Organisation created",
    generic: "Organisation created",
  },
  "membership.invite": { label: "Member invited", generic: "Member invited" },
  "membership.invite_cancel": {
    label: "Invite cancelled",
    generic: "Invitation cancelled",
  },
  "membership.role_change": {
    label: "Member role changed",
    generic: "Member role changed",
  },
  "membership.deactivate": {
    label: "Member deactivated",
    generic: "Member deactivated",
  },
  "membership.reactivate": {
    label: "Member reactivated",
    generic: "Member reactivated",
  },
}

export const entityLabels: Record<string, string> = {
  patient: "Patient",
  screening_event: "Screening event",
  clinical_review: "Clinical review",
  referral: "Referral",
  care_event: "Care event",
  notification: "Notification",
  organisation: "Organisation",
  organisation_membership: "Membership",
}

// Entities that hold patient or clinical information. Their stored `details`
// are never shown; a generic description is shown instead.
const sensitiveEntityTypes = new Set([
  "patient",
  "screening_event",
  "clinical_review",
  "care_event",
])

const entityGeneric: Record<string, string> = {
  patient: "Patient record changed",
  screening_event: "Screening record changed",
  clinical_review: "Clinical decision documented",
  care_event: "Care event recorded",
}

function humanise(s: string) {
  const t = s.replace(/[._-]+/g, " ").trim()
  return t ? t[0].toUpperCase() + t.slice(1) : "Unknown action"
}

export function actionLabel(action: string) {
  return actionMeta[action]?.label ?? humanise(action)
}

// ---- Entries ------------------------------------------------------------------

export type AuditRow = {
  id: string
  createdAt: Date | string
  actorName: string | null
  actorRole: string | null
  action: string
  entityType: string
  entityId: string
  details: string | null
}

export type AuditEntry = {
  id: string
  at: string // ISO
  actorName: string
  actorRole: string | null
  action: string
  actionLabel: string
  entityType: string
  entityLabel: string
  entityId: string
  details: string
  sensitive: boolean
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

export function toAuditEntry(r: AuditRow): AuditEntry {
  const sensitive = sensitiveEntityTypes.has(r.entityType)
  const stored = (r.details ?? "").trim()

  const details = sensitive
    ? (actionMeta[r.action]?.generic ??
      entityGeneric[r.entityType] ??
      "Sensitive record changed")
    : stored
      ? truncate(stored, 200)
      : (actionMeta[r.action]?.generic ?? actionLabel(r.action))

  return {
    id: r.id,
    at: new Date(r.createdAt).toISOString(),
    actorName: r.actorName ?? "Deleted user",
    actorRole: r.actorRole,
    action: r.action,
    actionLabel: actionLabel(r.action),
    entityType: r.entityType,
    entityLabel: entityLabels[r.entityType] ?? humanise(r.entityType),
    entityId: r.entityId,
    details,
    sensitive,
  }
}

// ---- Filters ------------------------------------------------------------------

export type AuditFilters = {
  action: "all" | AuditGroupKey
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  actor: string
  page: number
}

export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(
    new Date()
  )
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function isDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  )
}

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? ""

export function defaultFilters(): AuditFilters {
  const t = today()
  return { action: "all", from: addDays(t, -30), to: t, actor: "", page: 1 }
}

export function parseAuditFilters(
  sp: Record<string, string | string[] | undefined>
): AuditFilters {
  const d = defaultFilters()
  const action = first(sp.action)
  let from = first(sp.from)
  let to = first(sp.to)
  from = isDate(from) ? from : d.from
  to = isDate(to) ? to : d.to
  if (from > to) [from, to] = [to, from]

  const page = Number.parseInt(first(sp.page), 10)

  return {
    action: actionGroups.some((g) => g.key === action)
      ? (action as AuditGroupKey)
      : "all",
    from,
    to,
    actor: first(sp.actor).trim().slice(0, 80),
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
  }
}

export function isDefaultFilters(f: AuditFilters) {
  const d = defaultFilters()
  return (
    f.action === "all" && f.actor === "" && f.from === d.from && f.to === d.to
  )
}

// Start of `from` and the start of the day after `to`, in Lagos time.
export function dateRange(f: Pick<AuditFilters, "from" | "to">) {
  return {
    start: new Date(`${f.from}T00:00:00${TZ_OFFSET}`),
    endExclusive: new Date(`${addDays(f.to, 1)}T00:00:00${TZ_OFFSET}`),
  }
}

export function groupActions(key: AuditFilters["action"]): string[] | null {
  if (key === "all") return null
  return [...(actionGroups.find((g) => g.key === key)?.actions ?? [])]
}

// ---- Display ------------------------------------------------------------------

export function formatAuditTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso))
}

export function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}
