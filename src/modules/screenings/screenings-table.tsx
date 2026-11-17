"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ClipboardPlus, Search, ShieldCheck, Stethoscope } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResultBadge } from "@/components/shared/result-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/modules/patients/data"
import type { ScreeningWithPatient } from "@/server/screenings"

export function ScreeningsTable({ screenings }: { screenings: ScreeningWithPatient[] }) {
  const [query, setQuery] = useState("")
  const [onlyAwaiting, setOnlyAwaiting] = useState(false)

  const awaitingCount = screenings.filter(
    (s) => s.status === "Awaiting review"
  ).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return screenings.filter((s) => {
      if (onlyAwaiting && s.status !== "Awaiting review") return false
      if (!q) return true
      return (
        s.patientName.toLowerCase().includes(q) ||
        s.internalId.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      )
    })
  }, [screenings, query, onlyAwaiting])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={!onlyAwaiting}
            onClick={() => setOnlyAwaiting(false)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              !onlyAwaiting
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={onlyAwaiting}
            onClick={() => setOnlyAwaiting(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              onlyAwaiting
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Awaiting clinical review
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                onlyAwaiting ? "bg-white/20" : "bg-amber-100 text-amber-700"
              )}
            >
              {awaitingCount}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, ID or type"
            className="h-10 pl-9"
            aria-label="Search screenings"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-11 pl-5">Patient</TableHead>
              <TableHead>Screening type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">
                Result category
              </TableHead>
              <TableHead>Review status</TableHead>
              <TableHead className="pr-5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="group relative">
                <TableCell className="py-3.5 pl-5">
                  <Link
                    href={`/dashboard/patients/${s.patientId}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    <span className="block font-medium group-hover:text-primary">
                      {s.patientName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.internalId}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(s.date)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {s.location}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ResultBadge category={s.resultCategory} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="relative z-10 flex justify-end">
                    {s.status === "Awaiting review" && (
                      <Link
                        href={`/dashboard/screenings/${s.id}/review`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <Stethoscope />
                        Review
                      </Link>
                    )}
                    {s.status === "Follow-up required" && (
                      <Link
                        href={`/dashboard/referrals/new?screeningId=${s.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <ClipboardPlus />
                        Create referral
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ShieldCheck className="size-5 text-muted-foreground" />
            </span>
            <p className="font-medium">
              {onlyAwaiting
                ? "Nothing is waiting for clinical review"
                : "No screenings found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {onlyAwaiting
                ? "New results needing review will appear here."
                : "Try a different search."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
