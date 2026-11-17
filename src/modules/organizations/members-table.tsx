"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail, UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FormField, controlClass } from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import {
  cancelInvite,
  changeMemberRole,
  inviteMember,
  setMemberActive,
} from "@/modules/organizations/actions"
import {
  roleKeys,
  roleMeta,
  type Member,
  type MemberStatus,
  type RoleKey,
} from "@/modules/organizations/data"
import { initials } from "@/modules/patients/data"

const statusStyles: Record<MemberStatus, { label: string; cls: string }> = {
  active: {
    label: "Active",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  invited: { label: "Invited", cls: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  deactivated: {
    label: "Deactivated",
    cls: "bg-secondary text-muted-foreground ring-border",
  },
}

const rowSelect =
  "h-8 w-full min-w-44 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"

export function MembersTable({
  initial,
  currentUserId,
}: {
  initial: Member[]
  currentUserId: string
}) {
  const [members, setMembers] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<RoleKey | "">("")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const activeAdmins = members.filter(
    (m) => m.role === "organization_admin" && m.status === "active"
  ).length

  function isLastAdmin(m: Member) {
    return (
      m.role === "organization_admin" &&
      m.status === "active" &&
      activeAdmins <= 1
    )
  }

  function onRoleChange(m: Member, role: RoleKey) {
    setError(null)
    const previous = m.role
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)))
    startTransition(async () => {
      const res = await changeMemberRole(m.id, role)
      if (res.error) {
        setError(res.error)
        setMembers((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, role: previous } : x))
        )
      }
    })
  }

  function onSetActive(m: Member, active: boolean) {
    setError(null)
    setConfirmId(null)
    const status: MemberStatus = active ? "active" : "deactivated"
    const previous = m.status
    setMembers((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, status } : x))
    )
    startTransition(async () => {
      const res = await setMemberActive(m.id, active)
      if (res.error) {
        setError(res.error)
        setMembers((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, status: previous } : x))
        )
      }
    })
  }

  function onCancelInvite(m: Member) {
    setError(null)
    startTransition(async () => {
      const res = await cancelInvite(m.id)
      if (res.error) {
        setError(res.error)
        return
      }
      setMembers((prev) => prev.filter((x) => x.id !== m.id))
    })
  }

  function onInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    if (!inviteRole) {
      setInviteError("Choose a role.")
      return
    }
    const email = inviteEmail.trim().toLowerCase()
    if (members.some((m) => m.email === email)) {
      setInviteError("This person is already a member or has a pending invite.")
      return
    }
    startTransition(async () => {
      const res = await inviteMember(email, inviteRole)
      if (res.error) {
        setInviteError(res.error)
        return
      }
      setMembers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: "",
          email,
          role: inviteRole as RoleKey,
          status: "invited",
        },
      ])
      setInviteEmail("")
      setInviteRole("")
      setInviteOpen(false)
    })
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            {members.filter((m) => m.status === "active").length} active of{" "}
            {members.length}
          </p>
        </div>
        {!inviteOpen && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Invite member
          </Button>
        )}
      </div>

      {inviteOpen && (
        <form
          onSubmit={onInvite}
          className="space-y-4 border-b bg-muted/30 px-6 py-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Invite a member</h3>
            <button
              type="button"
              onClick={() => {
                setInviteOpen(false)
                setInviteError(null)
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close invite form"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" htmlFor="inviteEmail">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inviteEmail"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@clinic.org"
                  className="h-10 pl-9"
                />
              </div>
            </FormField>
            <FormField
              label="Role"
              htmlFor="inviteRole"
              hint={
                inviteRole
                  ? roleMeta[inviteRole].description
                  : "Choose what this person can do."
              }
            >
              <select
                id="inviteRole"
                required
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as RoleKey)}
                className={controlClass}
              >
                <option value="" disabled>
                  Select role
                </option>
                {roleKeys.map((r) => (
                  <option key={r} value={r}>
                    {roleMeta[r].label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          {inviteError && (
            <p role="alert" className="text-sm text-destructive">
              {inviteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Send invite
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          className="border-b bg-destructive/5 px-6 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-11 pl-6">User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const self = m.id === currentUserId
              const s = statusStyles[m.status]
              const lastAdmin = isLastAdmin(m)
              const confirming = confirmId === m.id
              return (
                <TableRow
                  key={m.id}
                  className={cn(m.status === "deactivated" && "opacity-70")}
                >
                  <TableCell className="py-3.5 pl-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {m.name ? (
                          initials(m.name)
                        ) : (
                          <Mail className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {m.name || (
                            <span className="font-normal text-muted-foreground">
                              Pending invite
                            </span>
                          )}
                          {self && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    <select
                      aria-label={`Role for ${m.name || m.email}`}
                      value={m.role}
                      disabled={
                        self ||
                        lastAdmin ||
                        m.status === "deactivated" ||
                        pending
                      }
                      title={
                        self
                          ? "You cannot change your own role"
                          : lastAdmin
                            ? "At least one active admin is required"
                            : undefined
                      }
                      onChange={(e) =>
                        onRoleChange(m, e.target.value as RoleKey)
                      }
                      className={rowSelect}
                    >
                      {roleKeys.map((r) => (
                        <option key={r} value={r}>
                          {roleMeta[r].label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        s.cls
                      )}
                    >
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {m.status === "invited" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => onCancelInvite(m)}
                      >
                        Cancel invite
                      </Button>
                    )}
                    {m.status === "deactivated" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => onSetActive(m, true)}
                      >
                        Reactivate
                      </Button>
                    )}
                    {m.status === "active" && !self && !confirming && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={lastAdmin || pending}
                        title={
                          lastAdmin
                            ? "At least one active admin is required"
                            : undefined
                        }
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmId(m.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                    {m.status === "active" && !self && confirming && (
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => onSetActive(m, false)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
