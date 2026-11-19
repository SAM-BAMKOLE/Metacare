import Link from "next/link"
import { Lock, ScrollText } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { roleLabels } from "@/components/layout/nav"
import {
  formatAuditTime,
  shortId,
  type AuditEntry,
} from "@/modules/audit/config"

export function AuditTable({
  entries,
  filtered,
}: {
  entries: AuditEntry[]
  filtered: boolean
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ScrollText className="size-5 text-muted-foreground" />
        </span>
        <p className="font-medium">No audit entries found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sensitive actions performed by your organisation will appear here.
        </p>
        {filtered && (
          <Link
            href="/dashboard/audit"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Clear filters
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[56rem]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="h-11 pl-5">Time</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity type</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead className="pr-5">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="py-3.5 pl-5 whitespace-nowrap text-muted-foreground">
                <time dateTime={e.at}>{formatAuditTime(e.at)}</time>
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium">{e.actorName}</p>
                {e.actorRole && (
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[e.actorRole] ?? e.actorRole}
                  </p>
                )}
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {e.actionLabel}
              </TableCell>
              <TableCell>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {e.entityLabel}
                </span>
              </TableCell>
              <TableCell>
                <code
                  title={e.entityId}
                  className="font-mono text-xs text-muted-foreground"
                >
                  {shortId(e.entityId)}
                </code>
              </TableCell>
              <TableCell className="max-w-sm pr-5 whitespace-normal">
                {e.sensitive ? (
                  <span
                    title="Details are withheld for patient and clinical records."
                    className="inline-flex items-start gap-1.5 text-sm text-muted-foreground"
                  >
                    <Lock className="mt-0.5 size-3.5 shrink-0" />
                    {e.details}
                  </span>
                ) : (
                  <span className="text-sm">{e.details}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
