import { db } from "@/lib/db"
import {
  organizations,
  organizationMemberships,
  user as authUser,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"

export interface OrganizationMember {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export interface OrganizationInfo {
  id: string
  name: string
}

export async function getOrganization(id: string): Promise<OrganizationInfo | null> {
  'use server'
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1)
  if (!org) return null
  return { id: org.id, name: org.name }
}

export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  'use server'
  const rows = await db.select({
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    role: organizationMemberships.role,
  })
    .from(organizationMemberships)
    .innerJoin(authUser, eq(organizationMemberships.userId, authUser.id))
    .where(eq(organizationMemberships.organizationId, organizationId))
    .orderBy(authUser.name)

  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? r.email ?? "Unknown",
    email: r.email ?? "",
    role: r.role,
    status: "active",
  }))
}

export async function updateOrganizationName(organizationId: string, name: string) {
  'use server'
  const [updated] = await db.update(organizations)
    .set({ name })
    .where(eq(organizations.id, organizationId))
    .returning()
  return updated
}

export async function changeMemberRole(
  organizationId: string,
  userId: string,
  role: string
) {
  'use server'
  const [updated] = await db.update(organizationMemberships)
    .set({ role })
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.userId, userId)
      )
    )
    .returning()
  return updated
}

export async function setMemberActive(
  organizationId: string,
  userId: string,
  active: boolean
) {
  'use server'
  if (!active) {
    // Deactivate: remove the membership
    await db.delete(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId)
        )
      )
  } else {
    // Reactivate: this would typically re-create the membership
    // For simplicity, we just ensure it exists
    const [existing] = await db.select().from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId)
        )
      )
      .limit(1)
    if (!existing) {
      await db.insert(organizationMemberships).values({
        organizationId,
        userId,
        role: "screening_staff",
      })
    }
  }
}
