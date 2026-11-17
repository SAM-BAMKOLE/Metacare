import { getCurrentMembership } from "@/server/permissions"

export type ShellContext = {
  organizationName: string
  role: string | null
} | null

// Adjust the field names below to whatever getCurrentMembership() returns.
// Only `organizationId` is known to exist, so everything else is read defensively.
export async function getShellContext(): Promise<ShellContext> {
  const membership = await getCurrentMembership()
  if (!membership) return null

  const m = membership as {
    role?: string
    organizationName?: string
    organization?: { name?: string }
  }

  return {
    organizationName:
      m.organizationName ?? m.organization?.name ?? "Your organisation",
    role: m.role ?? null,
  }
}
