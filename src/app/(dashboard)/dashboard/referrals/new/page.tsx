import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { ReferralForm } from "@/modules/referrals/referral-form"
import { getCurrentMembership } from "@/server/permissions"
import { getPatientsForDirectory } from "@/server/patients"
import { getScreeningWithPatient } from "@/server/screenings"

export default async function NewReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ screeningId?: string }>
}) {
  const { screeningId } = await searchParams
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard/referrals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All referrals
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create referral
          </h1>
          <p className="text-sm text-muted-foreground">
            No organisation membership found for your account.
          </p>
        </div>
      </div>
    )
  }

  const patients = await getPatientsForDirectory(membership.organizationId)

  let initialPatientId: string | undefined
  if (screeningId) {
    const screening = await getScreeningWithPatient(screeningId, membership.organizationId)
    initialPatientId = screening?.patientId
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/referrals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All referrals
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create referral
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new referral from a screening event.
        </p>
      </div>

      <ReferralForm
        patients={patients}
        initialPatientId={initialPatientId}
      />
    </div>
  )
}
