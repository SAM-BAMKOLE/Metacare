import { ShieldCheck } from "lucide-react"

import { OrganizationForm } from "@/modules/organizations/organization-form"
import { MembersTable } from "@/modules/organizations/members-table"
import type { Member } from "@/modules/organizations/data"
import { getCurrentMembership } from "@/server/permissions"
import { getOrganization, getOrganizationMembers } from "@/server/organizations"

export default async function SettingsPage() {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Organisation admin access required.
        </p>
      </div>
    )
  }

  const org = await getOrganization(membership.organizationId)
  const rows = await getOrganizationMembers(membership.organizationId)
  const members: Member[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as Member["role"],
    status: r.status as Member["status"],
  }))

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organisation and who can access it.
        </p>
      </div>

      {org && <OrganizationForm initialName={org.name} />}
      <MembersTable initial={members} currentUserId={membership.userId ?? ""} />

      <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">
            Admin access is separate from clinical access.
          </span>{" "}
          Being an organisation admin lets you manage members and settings. It
          does not give access to patient records. Role and membership changes
          are written to the audit log.
        </p>
      </div>
    </div>
  )
}
