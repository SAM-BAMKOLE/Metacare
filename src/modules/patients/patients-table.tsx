"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronRight, Search, UserRoundPlus, Users } from "lucide-react"

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
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate, initials, type Patient } from "@/modules/patients/data"

export function PatientsTable({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.internalId.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    )
  }, [patients, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID or phone"
            className="h-10 pl-9"
            aria-label="Search patients"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "patient" : "patients"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-11 pl-5">Patient</TableHead>
              <TableHead>Internal ID</TableHead>
              <TableHead className="hidden md:table-cell">
                Date of birth
              </TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead>Latest screening</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="group relative">
                <TableCell className="py-3.5 pl-5">
                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="flex items-center gap-3 after:absolute after:inset-0 after:content-['']"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(p.name)}
                    </span>
                    <span className="font-medium text-foreground group-hover:text-primary">
                      {p.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.internalId}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(p.dob)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {p.phone}
                </TableCell>
                <TableCell>
                  {p.latestScreening ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm">
                        {p.latestScreening.type}
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatDate(p.latestScreening.date)}
                        </span>
                      </span>
                      <StatusBadge status={p.latestScreening.status} />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No screenings yet
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-4">
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="font-medium">No patients found</p>
              <p className="text-sm text-muted-foreground">
                Try a different name or ID, or register a new patient.
              </p>
            </div>
            <Link
              href="/dashboard/patients/new"
              className={`mt-1 ` + buttonVariants({ size: "lg" })}
            >
              <UserRoundPlus />
              Register patient
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
