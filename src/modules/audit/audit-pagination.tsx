import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PAGE_SIZE, type AuditFilters } from "@/modules/audit/config"

function hrefFor(f: AuditFilters, page: number) {
  const p = new URLSearchParams()
  if (f.action !== "all") p.set("action", f.action)
  p.set("from", f.from)
  p.set("to", f.to)
  if (f.actor) p.set("actor", f.actor)
  if (page > 1) p.set("page", String(page))
  return `/dashboard/audit?${p.toString()}`
}

export function AuditPagination({
  filters,
  page,
  pageCount,
  total,
}: {
  filters: AuditFilters
  page: number
  pageCount: number
  total: number
}) {
  if (total === 0) return null

  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const disabled = "pointer-events-none opacity-50"

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <p className="text-sm text-muted-foreground">
        {from > total
          ? "No entries on this page"
          : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(filters, page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && disabled
          )}
        >
          <ChevronLeft />
          Previous
        </Link>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <Link
          href={hrefFor(filters, page + 1)}
          aria-disabled={page >= pageCount}
          tabIndex={page >= pageCount ? -1 : undefined}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= pageCount && disabled
          )}
        >
          Next
          <ChevronRight />
        </Link>
      </div>
    </div>
  )
}
