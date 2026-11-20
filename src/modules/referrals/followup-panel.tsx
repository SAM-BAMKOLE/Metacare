"use client"

import { useState, useTransition } from "react"
import { Loader2, Pencil, Plus, ShieldCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormError,
  FormField,
  controlClass,
  textareaClass,
} from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import { formatDate } from "@/modules/patients/data"
import {
  createConfirmatoryFollowUp,
  updateConfirmatoryFollowUp,
} from "@/modules/referrals/clinical-actions"
import {
  completedStatuses,
  followUpRequiredLabels,
  followUpRequiredOptions,
  followUpStatusLabels,
  followUpTransitions,
  formatLocalDateTime,
  nowLocal,
  terminalFollowUpStatuses,
  type FollowUp,
  type FollowUpRequired,
  type FollowUpStatus,
  type Person,
} from "@/modules/referrals/clinical-data"

const statusTone: Record<FollowUpStatus, string> = {
  not_ordered: "bg-secondary text-secondary-foreground ring-border",
  ordered: "bg-sky-50 text-sky-700 ring-sky-600/20",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/20",
  completed: "bg-primary/10 text-primary ring-primary/20",
  result_pending_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
  reviewed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-secondary text-muted-foreground ring-border",
}

const dash = <span className="text-muted-foreground">–</span>

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
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  )
}

// ---- One follow-up, with its status update controls ----------------------------------

function FollowUpCard({
  item,
  clinicians,
  onUpdated,
}: {
  item: FollowUp
  clinicians: Person[]
  onUpdated: (updated: FollowUp) => void
}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<FollowUpStatus>(item.status)
  const [completedAt, setCompletedAt] = useState(item.completedAt ?? "")
  const [reviewedAt, setReviewedAt] = useState(item.reviewedAt ?? "")
  const [reviewedById, setReviewedById] = useState("")
  const [summary, setSummary] = useState(item.outcomeSummary ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const terminal = terminalFollowUpStatuses.includes(item.status)
  const statusOptions: FollowUpStatus[] = [
    item.status,
    ...followUpTransitions[item.status],
  ]
  const needsCompleted = completedStatuses.includes(status)
  const isReviewed = status === "reviewed"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const now = nowLocal()
    if (needsCompleted && completedAt > now)
      return setError("The completed time cannot be in the future.")
    if (isReviewed && reviewedAt > now)
      return setError("The reviewed time cannot be in the future.")
    if (isReviewed && reviewedAt < completedAt)
      return setError("The reviewed time cannot be before the completed time.")

    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateConfirmatoryFollowUp(item.id, data)
      if (res.error) {
        setError(res.error)
        return
      }
      onUpdated({
        ...item,
        status,
        completedAt: needsCompleted ? completedAt : item.completedAt,
        reviewedBy: isReviewed
          ? (clinicians.find((p) => p.id === reviewedById)?.name ?? null)
          : item.reviewedBy,
        reviewedAt: isReviewed ? reviewedAt : item.reviewedAt,
        outcomeSummary: summary.trim() || item.outcomeSummary,
        orderedBy:
          status === "ordered" && !item.orderedBy ? "You" : item.orderedBy,
        orderedAt:
          status === "ordered" && !item.orderedAt ? now : item.orderedAt,
      })
      setEditing(false)
    })
  }

  return (
    <li className="space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {item.label || "No follow-up required"}
          </p>
          <p className="text-xs text-muted-foreground">
            Follow-up required: {followUpRequiredLabels[item.required]}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            statusTone[item.status]
          )}
        >
          {followUpStatusLabels[item.status]}
        </span>
      </div>

      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Ordered by / at">
          {item.orderedBy ? (
            <>
              {item.orderedBy}
              {item.orderedAt && (
                <span className="block text-xs text-muted-foreground">
                  {formatLocalDateTime(item.orderedAt)}
                </span>
              )}
            </>
          ) : (
            dash
          )}
        </Detail>
        <Detail label="Expected date">
          {item.expectedDate ? formatDate(item.expectedDate) : dash}
        </Detail>
        <Detail label="Completed at">
          {item.completedAt ? formatLocalDateTime(item.completedAt) : dash}
        </Detail>
        <Detail label="Reviewed by">
          {item.reviewedBy ? (
            <>
              {item.reviewedBy}
              {item.reviewedAt && (
                <span className="block text-xs text-muted-foreground">
                  {formatLocalDateTime(item.reviewedAt)}
                </span>
              )}
            </>
          ) : (
            dash
          )}
        </Detail>
        <div className="sm:col-span-2">
          <Detail label="Outcome summary">{item.outcomeSummary ?? dash}</Detail>
        </div>
      </dl>

      {!terminal && !editing && (
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil />
          Update status
        </Button>
      )}

      {editing && (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border bg-muted/30 p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Update status</h4>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close update form"
            >
              <X className="size-4" />
            </button>
          </div>

          <fieldset disabled={pending} className="space-y-4">
            <FormField label="Status" htmlFor={`status-${item.id}`}>
              <select
                id={`status-${item.id}`}
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
                className={controlClass}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {followUpStatusLabels[s]}
                    {s === item.status ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </FormField>

            {needsCompleted && (
              <FormField
                label="Completed at"
                htmlFor={`completedAt-${item.id}`}
              >
                <Input
                  id={`completedAt-${item.id}`}
                  name="completedAt"
                  type="datetime-local"
                  required
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="h-10"
                />
              </FormField>
            )}

            {isReviewed && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Reviewed by"
                  htmlFor={`reviewedById-${item.id}`}
                >
                  <select
                    id={`reviewedById-${item.id}`}
                    name="reviewedById"
                    required
                    value={reviewedById}
                    onChange={(e) => setReviewedById(e.target.value)}
                    className={controlClass}
                  >
                    <option value="" disabled>
                      Select clinician
                    </option>
                    {clinicians.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Reviewed at"
                  htmlFor={`reviewedAt-${item.id}`}
                >
                  <Input
                    id={`reviewedAt-${item.id}`}
                    name="reviewedAt"
                    type="datetime-local"
                    required
                    value={reviewedAt}
                    onChange={(e) => setReviewedAt(e.target.value)}
                    className="h-10"
                  />
                </FormField>
              </div>
            )}

            <FormField
              label={
                isReviewed ? "Outcome summary (required)" : "Outcome summary"
              }
              htmlFor={`summary-${item.id}`}
              hint="Record what the clinician documented. Metacare does not interpret results."
            >
              <textarea
                id={`summary-${item.id}`}
                name="outcomeSummary"
                required={isReviewed}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={cn(textareaClass, "min-h-20")}
              />
            </FormField>
          </fieldset>

          <FormError message={error} />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Update
            </Button>
          </div>
        </form>
      )}
    </li>
  )
}

// ---- Panel ---------------------------------------------------------------------------------

export function FollowUpPanel({
  referralId,
  initial,
  clinicians,
  today,
}: {
  referralId: string
  initial: FollowUp[]
  clinicians: Person[]
  today: string
}) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState(initial.length === 0)
  const [required, setRequired] = useState<FollowUpRequired | "">("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const res = await createConfirmatoryFollowUp(referralId, data)
      if (res.error) {
        setError(res.error)
        return
      }
      const isNo = data.get("required") === "no"
      setItems((prev) => [
        {
          id: res.id ?? crypto.randomUUID(),
          required: data.get("required") as FollowUpRequired,
          label: String(data.get("label") ?? "").trim(),
          status: "not_ordered",
          expectedDate:
            !isNo && data.get("expectedDate")
              ? String(data.get("expectedDate"))
              : null,
          orderedBy: null,
          orderedAt: null,
          completedAt: null,
          reviewedBy: null,
          reviewedAt: null,
          outcomeSummary: null,
        },
        ...prev,
      ])
      form.reset()
      setRequired("")
      setOpen(false)
    })
  }

  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Confirmatory follow-up</h2>
          <p className="text-sm text-muted-foreground">
            Tests or assessments the clinician has decided on.
          </p>
        </div>
        {!open && (
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add follow-up
          </Button>
        )}
      </div>

      <div className="flex gap-3 border-b bg-primary/5 px-6 py-3 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Metacare tracks the follow-up the clinician decides on. It does not
          choose tests or interpret results. Audit entries do not copy outcome
          summaries.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          No follow-up recorded yet.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <FollowUpCard
              key={item.id}
              item={item}
              clinicians={clinicians}
              onUpdated={(u) =>
                setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)))
              }
            />
          ))}
        </ul>
      )}

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-5 border-t bg-muted/30 px-6 py-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Add a follow-up</h3>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close form"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <fieldset disabled={pending} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Required" htmlFor="required">
                <select
                  id="required"
                  name="required"
                  required
                  value={required}
                  onChange={(e) =>
                    setRequired(e.target.value as FollowUpRequired)
                  }
                  className={controlClass}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {followUpRequiredOptions.map((o) => (
                    <option key={o} value={o}>
                      {followUpRequiredLabels[o]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Test or assessment label"
                htmlFor="label"
                className="sm:col-span-2"
                hint={
                  required === "no"
                    ? "Optional when no follow-up is required."
                    : undefined
                }
              >
                <Input
                  id="label"
                  name="label"
                  required={required !== "no"}
                  className="h-10"
                />
              </FormField>
            </div>
            <FormField
              label="Expected date"
              htmlFor="expectedDate"
              className="sm:max-w-xs"
            >
              <Input
                id="expectedDate"
                name="expectedDate"
                type="date"
                min={today}
                disabled={required === "no"}
                className="h-10"
              />
            </FormField>
          </fieldset>

          <FormError message={error} />

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Add follow-up
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
