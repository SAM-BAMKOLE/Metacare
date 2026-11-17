import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ResultBadge } from "@/components/shared/result-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ReviewForm } from "@/modules/clinical-reviews/review-form"
import { formatDate } from "@/modules/patients/data"
import { getCurrentMembership } from "@/server/permissions"
import { getScreeningWithPatient } from "@/server/screenings"

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default async function ClinicalReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "clinician") {
    redirect("/dashboard")
  }

  const { id } = await params
  const screening = await getScreeningWithPatient(id, membership.organizationId)
  if (!screening) notFound()

  const awaitingReview = screening.status === "Awaiting review"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/screenings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All screenings
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Clinical review
        </h1>
        <p className="text-sm text-muted-foreground">
          Review the screening record and document your decision.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-5 rounded-xl border bg-card p-6 shadow-xs lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Screening details</h2>
            <StatusBadge status={screening.status} />
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Patient">
              <Link
                href={`/dashboard/patients/${screening.patientId}`}
                className="font-medium text-primary hover:underline"
              >
                {screening.patientName}
              </Link>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {screening.internalId}
              </span>
            </Detail>
            <Detail label="Screening type">{screening.type}</Detail>
            <Detail label="Date">{formatDate(screening.date)}</Detail>
            <Detail label="Location">{screening.location}</Detail>
            <Detail label="Result category">
              <ResultBadge category={screening.resultCategory} />
            </Detail>
            <Detail label="Recorded by">{screening.recordedBy}</Detail>
          </dl>

          <div className="rounded-lg bg-muted/60 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Result notes
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {screening.notes || (
                <span className="text-muted-foreground">
                  No notes recorded.
                </span>
              )}
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-xs lg:col-span-2">
          <h2 className="mb-4 font-semibold">Decision</h2>
          {awaitingReview ? (
            <ReviewForm screeningId={screening.id} />
          ) : (
            <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
              A decision has already been documented for this screening.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
