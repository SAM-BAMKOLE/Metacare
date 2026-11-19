import Link from "next/link"
import { UserRoundPlus } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { PatientsTable } from "@/modules/patients/patients-table"
import { getCurrentMembership } from "@/server/permissions"
import { getPatientsForDirectory } from "@/server/patients"

export default async function PatientsPage() {
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground">
          No organisation membership found for your account.
        </p>
      </div>
    )
  }

  const patients = await getPatientsForDirectory(membership.organizationId)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">
            Search and manage patient records for your organisation.
          </p>
        </div>
        <Link href="/dashboard/patients/new" className={buttonVariants({ size: "lg" })}>
          <UserRoundPlus />
          Register patient
        </Link>
      </div>

      <PatientsTable patients={patients} />

      <p className="text-xs text-muted-foreground">
        All patient data shown is fictional and for demonstration only.
      </p>
    </div>
  )
}
