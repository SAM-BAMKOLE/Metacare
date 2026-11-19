import { and, desc, eq, gte, ilike, inArray, lt, sql } from "drizzle-orm"

// ADJUST THESE IMPORTS AND COLUMN NAMES to match your schema. Written against:
//   auditLogs(id, actorId, action, entityType, entityId, details, createdAt)
//   organizationMemberships(userId, organizationId, role)
//   user(id, name)            <- the Better Auth user table
import { db } from "@/lib/db"
import { auditLogs, organizationMemberships, user } from "@/db/schema"
import { getCurrentMembership } from "@/server/permissions"
import {
  PAGE_SIZE,
  dateRange,
  groupActions,
  toAuditEntry,
  type AuditEntry,
  type AuditFilters,
} from "@/modules/audit/config"

export type AuditPage = {
  entries: AuditEntry[]
  total: number
  page: number
  pageCount: number
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/**
 * Audit entries for the signed-in organisation admin's organisation.
 * Returns null when the caller is not an organisation admin.
 *
 * The organisation always comes from the session, never from a URL or form
 * value. auditLogs has no organisationId column, so entries are scoped to
 * actors who are members of the organisation (inner join on memberships).
 * Consider adding organisationId to auditLogs: entries by someone who belongs
 * to several organisations, or by staff of another organisation acting on
 * this one, are otherwise attributed by actor only.
 */
export async function getAuditLogsForAdmin(
  filters: AuditFilters
): Promise<AuditPage | null> {
  const membership = await getCurrentMembership()
  if (!membership) return null
  if ((membership as { role?: string }).role !== "organization_admin")
    return null

  const organizationId = membership.organizationId
  const { start, endExclusive } = dateRange(filters)
  const actions = groupActions(filters.action)

  const where = and(
    gte(auditLogs.createdAt, start),
    lt(auditLogs.createdAt, endExclusive),
    actions ? inArray(auditLogs.action, actions) : undefined,
    filters.actor
      ? ilike(user.name, `%${escapeLike(filters.actor)}%`)
      : undefined
  )

  const joinMembership = and(
    eq(organizationMemberships.userId, auditLogs.actorId),
    eq(organizationMemberships.organizationId, organizationId)
  )

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        createdAt: auditLogs.createdAt,
        actorName: user.name,
        actorRole: organizationMemberships.role,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
      })
      .from(auditLogs)
      .innerJoin(organizationMemberships, joinMembership)
      .leftJoin(user, eq(user.id, auditLogs.actorId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .innerJoin(organizationMemberships, joinMembership)
      .leftJoin(user, eq(user.id, auditLogs.actorId))
      .where(where),
  ])

  // Sensitive details are replaced here on the server, before anything is
  // sent to the browser.
  return {
    entries: rows.map(toAuditEntry),
    total: count,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  }
}
