import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, controlClass } from "@/components/shared/form-field"
import { actionGroups, today, type AuditFilters } from "@/modules/audit/config"

// A plain GET form: filters live in the URL, so the page is server-rendered,
// shareable and works without client-side state.
export function AuditFilterBar({ filters }: { filters: AuditFilters }) {
  return (
    <form
      key={`${filters.action}|${filters.from}|${filters.to}|${filters.actor}`}
      action="/dashboard/audit"
      method="get"
      className="rounded-xl border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Action" htmlFor="action">
          <select
            id="action"
            name="action"
            defaultValue={filters.action}
            className={controlClass}
          >
            <option value="all">All</option>
            {actionGroups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="From" htmlFor="from">
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from}
            max={today()}
            className="h-10"
          />
        </FormField>

        <FormField label="To" htmlFor="to">
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to}
            max={today()}
            className="h-10"
          />
        </FormField>

        <FormField label="Actor" htmlFor="actor">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="actor"
              name="actor"
              type="search"
              defaultValue={filters.actor}
              placeholder="Search by user name"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </div>
        </FormField>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Defaults to the last 30 days. Times are shown in Lagos time.
        </p>
        <div className="flex gap-2">
          <Link
            href="/dashboard/audit"
            className={buttonVariants({ variant: "outline" })}
          >
            Clear filters
          </Link>
          <Button type="submit">
            <SlidersHorizontal />
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  )
}
