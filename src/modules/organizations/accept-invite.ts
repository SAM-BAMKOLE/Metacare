"use server"

import { db } from "@/lib/db"
import { organizationMemberships } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCurrentSession } from "@/server/auth"

export type AcceptInviteResult = { error: string | null }

export async function acceptInviteServer(
  membershipId: string
): Promise<AcceptInviteResult> {
  const session = await getCurrentSession()
  if (!session?.user) {
    return { error: "You must be signed in." }
  }

  // Verify the membership exists, belongs to this user, and is invited
  const [membership] = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId))
    .limit(1)

  if (!membership) {
    return { error: "Invite not found." }
  }

  if (membership.userId !== session.user.id) {
    return { error: "This invite does not belong to you." }
  }

  if (membership.status !== "invited") {
    return { error: "This invite has already been accepted or is not active." }
  }

  await db
    .update(organizationMemberships)
    .set({ status: "active" })
    .where(eq(organizationMemberships.id, membershipId))

  return { error: null }
}
