import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { NewScreeningForm } from "@/modules/screenings/new-screening-form"
import { getCurrentMembership } from "@/server/permissions"
import { getPatientsForDirectory } from "@/server/patients"

export default async function NewScreeningPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { patientId } = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard/screenings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All screenings
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Record screening
          </h1>
          <p className="text-sm text-muted-foreground">
            No organisation membership found for your account.
          </p>
        </div>
      </div>
    )
  }

  const patients = await getPatientsForDirectory(membership.organizationId)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/screenings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All screenings
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Record screening
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a screening event for an existing patient.
        </p>
      </div>

      <NewScreeningForm
        patients={patients.map((p) => ({
          id: p.id,
          name: p.name,
          internalId: p.internalId,
          dob: p.dob,
        }))}
        initialPatientId={patientId}
        today={today}
      />
    </div>
  )
}
