"use server"

import { z } from "zod"

import { db } from "@/lib/db"
import {
  organizations,
  organizationMemberships,
  auditLogs,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCurrentSession } from "@/server/auth"

export type CreateOrganizationResult = { error: string | null }

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter an organisation name.")
  .max(120, "Keep the name under 120 characters.")

export async function createOrganization(
  name: string
): Promise<CreateOrganizationResult> {
  const parsed = nameSchema.safeParse(name)
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the name." }

  const session = await getCurrentSession()
  if (!session?.user) {
    return { error: "You must be signed in." }
  }

  // Refuse if the user already has an organisation membership
  const [existing] = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, session.user.id))
    .limit(1)
  if (existing) {
    return {
      error: "You already belong to an organisation. Contact your admin to join another.",
    }
  }

  // Insert the organisation
  const [org] = await db
    .insert(organizations)
    .values({ name: parsed.data })
    .returning()

  // Insert the user's membership with role "organization_admin"
  await db.insert(organizationMemberships).values({
    userId: session.user.id,
    organizationId: org.id,
    role: "organization_admin",
  })

  // Write an audit log entry
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "organization.create",
    entityType: "organization",
    entityId: org.id,
    details: `Created organisation "${parsed.data}"`,
  })

  return { error: null }
}
