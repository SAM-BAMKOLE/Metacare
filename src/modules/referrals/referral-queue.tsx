"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { AlertTriangle, ArrowRight, Ban, Search, UserX } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/modules/patients/data"
import { assignOwner, transitionReferral } from "@/modules/referrals/actions"
import {
  categoryDefs,
  inCategory,
  isOverdue,
  transitions,
  type QueueCategory,
  type QueueReferral,
  type ReferralStatus,
} from "@/modules/referrals/data"

const filterSelect =
  "h-9 rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const rowSelect =
  "h-8 w-full min-w-32 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"

export function ReferralQueue({
  initial,
  today,
  owners: ownersProp,
  destinations: destinationsProp,
}: {
  initial: QueueReferral[]
  today: string
  owners?: string[]
  destinations?: string[]
}) {
  const [referrals, setReferrals] = useState(initial)
  const [category, setCategory] = useState<QueueCategory | "all">("all")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | ReferralStatus>("all")
  const [owner, setOwner] = useState("all")
  const [org, setOrg] = useState("all")
  const [due, setDue] = useState<"any" | "overdue" | "week">("any")
  const [, startTransition] = useTransition()

  const owners = ownersProp ?? [...new Set(referrals.map((r) => r.owner).filter(Boolean))] as string[]
  const destinations = destinationsProp ?? [...new Set(referrals.map((r) => r.destination).filter(Boolean))] as string[]

  const counts = useMemo(() => {
    const c = {} as Record<QueueCategory, number>
    for (const d of categoryDefs) {
      c[d.key] = referrals.filter((r) => inCategory(r, d.key, today)).length
    }
    return c
  }, [referrals, today])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return referrals.filter((r) => {
      if (category !== "all" && !inCategory(r, category, today)) return false
      if (status !== "all" && r.status !== status) return false
      if (
        owner === "unassigned"
          ? r.owner !== null
          : owner !== "all" && r.owner !== owner
      )
        return false
      if (org !== "all" && r.destination !== org) return false
      if (due === "overdue" && !isOverdue(r, today)) return false
      if (due === "week") {
        const d = Math.round(
          (Date.parse(r.due) - Date.parse(today)) / 86_400_000
        )
        if (d < 0 || d > 7) return false
      }
      if (
        q &&
        !r.patientName.toLowerCase().includes(q) &&
        !r.internalId.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [referrals, category, query, status, owner, org, due, today])

  function onAssign(r: QueueReferral, name: string) {
    if (!name) return
    setReferrals((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              owner: name,
              status:
                x.status === "Pending assignment" ? "Ready to send" : x.status,
            }
          : x
      )
    )
    startTransition(() => {
      void assignOwner(r.id, name)
    })
  }

  function onTransition(r: QueueReferral, to: string) {
    if (!to) return
    const next = to as ReferralStatus
    setReferrals((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: next } : x))
    )
    startTransition(() => {
      void transitionReferral(r.id, r.status, next)
    })
  }

  return (
    <div className="space-y-4">
      {/* Queue categories */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 pb-1">
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              category === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            All open
          </button>
          {categoryDefs.map((d) => {
            const active = category === d.key
            const urgent = d.key === "overdue" && counts[d.key] > 0
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(d.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {d.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active
                      ? "bg-white/20"
                      : urgent
                        ? "bg-red-100 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[d.key]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient or ID"
            className="h-9 pl-9"
            aria-label="Search referrals"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={filterSelect}
          >
            <option value="all">All statuses</option>
            {Object.keys(transitions).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={filterSelect}
          >
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            aria-label="Receiving organisation"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className={filterSelect}
          >
            <option value="all">All destinations</option>
            {destinations.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            aria-label="Due date"
            value={due}
            onChange={(e) => setDue(e.target.value as typeof due)}
            className={filterSelect}
          >
            <option value="any">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="week">Due in 7 days</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground lg:ml-auto">
          {filtered.length} {filtered.length === 1 ? "referral" : "referrals"}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-11 pl-5">Patient</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const overdue = isOverdue(r, today)
                const unassigned = r.owner === null
                const waitingAck =
                  r.status === "Awaiting acknowledgement" || r.status === "Sent"
                return (
                  <TableRow
                    key={r.id}
                    className={cn(
                      overdue
                        ? "bg-red-50/60 hover:bg-red-50"
                        : unassigned
                          ? "bg-amber-50/60 hover:bg-amber-50"
                          : waitingAck
                            ? "bg-amber-50/30 hover:bg-amber-50/60"
                            : ""
                    )}
                  >
                    <TableCell
                      className={cn(
                        "py-3.5 pl-5",
                        overdue &&
                          "shadow-[inset_3px_0_0_0_var(--destructive)]",
                        !overdue &&
                          unassigned &&
                          "shadow-[inset_3px_0_0_0_var(--color-amber-400)]"
                      )}
                    >
                      <p className="font-medium">{r.patientName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {r.internalId}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-48 text-muted-foreground">
                      {r.destination}
                    </TableCell>
                    <TableCell>
                      {r.owner ?? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          <UserX className="size-3" /> Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap",
                        overdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDate(r.due)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={r.status} />
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-destructive ring-1 ring-red-600/20 ring-inset">
                            <AlertTriangle className="size-3" /> Overdue
                          </span>
                        )}
                        {r.blocked && (
                          <span
                            title={r.blocked}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-500/20 ring-inset"
                          >
                            <Ban className="size-3" /> Blocked
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Assign owner for ${r.patientName}`}
                          value=""
                          onChange={(e) => onAssign(r, e.target.value)}
                          className={cn(
                            rowSelect,
                            unassigned && "border-amber-400"
                          )}
                        >
                          <option value="">
                            {unassigned ? "Assign owner…" : "Reassign…"}
                          </option>
                          {owners
                            .filter((o) => o !== r.owner)
                            .map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                        </select>
                        <select
                          aria-label={`Move ${r.patientName} to status`}
                          value=""
                          disabled={transitions[r.status].length === 0}
                          onChange={(e) => onTransition(r, e.target.value)}
                          className={rowSelect}
                        >
                          <option value="">Move to…</option>
                          {transitions[r.status].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <Link
                          href={`/dashboard/referrals/${r.id}`}
                          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">Nothing in this queue</p>
            <p className="text-sm text-muted-foreground">
              Try a different category or clear your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
