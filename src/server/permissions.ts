import { db } from "@/lib/db"
import { organizationMemberships, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getCurrentSession } from "./auth"

export type UserRole =
  | "organization_admin"
  | "screening_staff"
  | "clinician"
  | "care_coordinator"
  | "receiving_provider_staff"

export const ALL_ROLES: UserRole[] = [
  "organization_admin",
  "screening_staff",
  "clinician",
  "care_coordinator",
  "receiving_provider_staff",
]

export class AuthorizationError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "AuthorizationError"
  }
}

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}

export async function getCurrentMembership() {
  const session = await getCurrentSession()
  if (!session?.user) return null
  const memberships = await db
    .select({
      id: organizationMemberships.id,
      userId: organizationMemberships.userId,
      organizationId: organizationMemberships.organizationId,
      role: organizationMemberships.role,
      status: organizationMemberships.status,
      createdAt: organizationMemberships.createdAt,
      organizationName: organizations.name,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(eq(organizationMemberships.userId, session.user.id))
  return memberships[0] ?? null
}

export async function getAllMemberships() {
  const session = await getCurrentSession()
  if (!session?.user) return []
  return db
    .select({
      id: organizationMemberships.id,
      userId: organizationMemberships.userId,
      organizationId: organizationMemberships.organizationId,
      role: organizationMemberships.role,
      status: organizationMemberships.status,
      createdAt: organizationMemberships.createdAt,
      organizationName: organizations.name,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(eq(organizationMemberships.userId, session.user.id))
}

export async function requireRole(allowedRoles: UserRole[]) {
  const membership = await getCurrentMembership()
  if (!membership) throw new AuthorizationError("No organization membership", 403)
  const role = membership.role as UserRole
  if (!allowedRoles.includes(role)) throw new AuthorizationError("Forbidden", 403)
  return membership
}

export async function isInOrg(userId: string, orgId: string) {
  const memberships = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, userId))
  return memberships.some((m) => m.organizationId === orgId)
}

export interface OrgUser {
  id: string
  name: string | null
  email: string | null
  role: string
}

export async function getOrgUsersByRole(
  organizationId: string,
  role: string
): Promise<OrgUser[]> {
  const { user: authUser } = await import("@/db/schema/auth")
  const rows = await db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: organizationMemberships.role,
    })
    .from(authUser)
    .innerJoin(
      organizationMemberships,
      eq(organizationMemberships.userId, authUser.id)
    )
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.role, role)
      )
    )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
  }))
}
