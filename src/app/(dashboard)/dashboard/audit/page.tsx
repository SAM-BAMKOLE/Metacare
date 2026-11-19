import { redirect } from "next/navigation"

import { AuditFilterBar } from "@/modules/audit/audit-filter-bar"
import { AuditPagination } from "@/modules/audit/audit-pagination"
import { AuditTable } from "@/modules/audit/audit-table"
import { isDefaultFilters, parseAuditFilters } from "@/modules/audit/config"
import { getAuditLogsForAdmin } from "@/server/audit"

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAuditFilters(await searchParams)

  // Organisation admins only. The query returns null for anyone else
  // (or when there is no organisation), so non-admins never reach the data.
  const result = await getAuditLogsForAdmin(filters)
  if (!result) redirect("/dashboard")

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Record of sensitive actions across your organisation. Audit entries
          record who performed an action and when, but do not duplicate clinical
          content.
        </p>
      </div>

      <AuditFilterBar filters={filters} />

      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <AuditTable
          entries={result.entries}
          filtered={!isDefaultFilters(filters)}
        />
        <AuditPagination
          filters={filters}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
        />
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Audit entries record administrative actions only. Clinical content
        (patient results, notes, recommendations) is not stored in audit logs.
        All data shown is from your organisation&apos;s records.
      </p>
    </div>
  )
}
