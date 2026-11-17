import Link from "next/link"
import { FilePlus2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { ReferralQueue } from "@/modules/referrals/referral-queue"
import { getCurrentMembership } from "@/server/permissions"
import { listReferralsWithDetails } from "@/server/referrals"
import type { QueueReferral } from "@/modules/referrals/data"

export default async function ReferralsPage() {
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Referral work queue
        </h1>
        <p className="text-sm text-muted-foreground">
          No organisation membership found for your account.
        </p>
      </div>
    )
  }

  const rows = await listReferralsWithDetails(membership.organizationId)
  const today = new Date().toISOString().slice(0, 10)

  const referrals: QueueReferral[] = rows.map((r) => ({
    id: r.id,
    patientName: r.patientName,
    internalId: r.internalId,
    destination: r.destination,
    owner: r.owner,
    priority: r.priority,
    due: r.due ?? today,
    status: r.status,
    patientContacted: r.patientCommunicationStatus === "contacted",
  })) as QueueReferral[]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Referral work queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Referrals that need a person to act, grouped by what is outstanding.
          </p>
        </div>
        <Link
          href="/dashboard/referrals/new"
          className={buttonVariants({ size: "lg" })}
        >
          <FilePlus2 />
          Create referral
        </Link>
      </div>

      <ReferralQueue initial={referrals} today={today} />

      <p className="text-xs text-muted-foreground">
        Overdue, blocked and awaiting-acknowledgement are flags on a referral,
        not replacements for its status.
      </p>
    </div>
  )
}
