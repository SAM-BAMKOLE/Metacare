import { redirect } from "next/navigation"

export type Role =
  | "organization_admin"
  | "screening_staff"
  | "clinician"
  | "care_coordinator"
  | "receiving_provider_staff"

export type SessionUser = { id: string; name: string; role: Role }

// PROTOTYPE STUB: replace with your Better Auth session + organization
// membership lookup. DEMO_ROLE lets you try other roles locally.
export async function getCurrentUser(): Promise<SessionUser> {
  const role = (process.env.DEMO_ROLE as Role | undefined) ?? "clinician"
  return { id: "u_demo", name: "Dr. Emeka Obi", role }
}

/**
 * Server-side role guard. Call it at the top of protected pages and actions.
 * Redirects to the dashboard when the user's role is not allowed.
 */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!roles.includes(user.role)) redirect("/dashboard")
  return user
}
