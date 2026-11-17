import { ClipboardPlus } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { ScreeningsTable } from "@/modules/screenings/screenings-table"
import { getCurrentMembership } from "@/server/permissions"
import { listScreeningsWithPatients } from "@/server/screenings"

export default async function ScreeningsPage() {
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Screenings</h1>
        <p className="text-sm text-muted-foreground">
          No organisation membership found for your account.
        </p>
      </div>
    )
  }

  const screenings = await listScreeningsWithPatients(membership.organizationId)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Screenings</h1>
          <p className="text-sm text-muted-foreground">
            Recorded screening events and where each one stands in clinical
            review.
          </p>
        </div>
        <Link
          href="/dashboard/screenings/new"
          className={buttonVariants({ size: "lg" })}
        >
          <ClipboardPlus />
          Create screening
        </Link>
      </div>

      <ScreeningsTable screenings={screenings} />

      <p className="text-xs text-muted-foreground">
        All screening data shown is from your organisation&apos;s records.
      </p>
    </div>
  )
}
