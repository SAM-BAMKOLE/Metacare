"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, ShieldCheck, X } from "lucide-react"

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
import { createClinicalConsultation } from "@/modules/referrals/clinical-actions"
import {
  consultationOutcomeLabels,
  consultationOutcomes,
  type Consultation,
  type ConsultationOutcome,
  type Person,
} from "@/modules/referrals/clinical-data"

const outcomeTone: Record<ConsultationOutcome, string> = {
  assessment_completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  more_information_requested: "bg-amber-50 text-amber-700 ring-amber-600/20",
  further_review_required: "bg-primary/10 text-primary ring-primary/20",
  redirected: "bg-secondary text-secondary-foreground ring-border",
  other: "bg-secondary text-secondary-foreground ring-border",
}

function Field({
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

export function ConsultationPanel({
  referralId,
  initial,
  clinicians,
  staff,
  today,
}: {
  referralId: string
  initial: Consultation[]
  clinicians: Person[]
  staff: Person[]
  today: string
}) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState(initial.length === 0)
  const [hasNext, setHasNext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const nameOf = (list: Person[], id: FormDataEntryValue | null) =>
    list.find((p) => p.id === id)?.name ?? "Unknown"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const res = await createClinicalConsultation(referralId, data)
      if (res.error) {
        setError(res.error)
        return
      }
      const next = String(data.get("nextAction") ?? "").trim()
      const entry: Consultation = {
        id: res.id ?? crypto.randomUUID(),
        consultingClinician: nameOf(
          clinicians,
          data.get("consultingClinicianId")
        ),
        requestingFrom: String(data.get("requestingFrom")).trim(),
        date: String(data.get("date")),
        reason: String(data.get("reason")).trim(),
        outcome: data.get("outcome") as ConsultationOutcome,
        summary: String(data.get("summary")).trim(),
        nextAction: next || null,
        nextActionOwner: next
          ? nameOf(staff, data.get("nextActionOwnerId"))
          : null,
        nextActionDue: next ? String(data.get("nextActionDue")) : null,
      }
      setItems((prev) =>
        [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      )
      form.reset()
      setHasNext(false)
      setOpen(false)
    })
  }

  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Clinical consultation</h2>
          <p className="text-sm text-muted-foreground">
            Consultations documented for this referral, newest first.
          </p>
        </div>
        {!open && (
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Record consultation
          </Button>
        )}
      </div>

      <div className="flex gap-3 border-b bg-primary/5 px-6 py-3 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Metacare records what you document here. It does not interpret results
          or suggest next steps. Audit entries note that a consultation was
          recorded but do not copy its text.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          No consultations recorded yet.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((c) => (
            <li key={c.id} className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {formatDate(c.date)}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {c.consultingClinician}
                  </span>
                </p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    outcomeTone[c.outcome]
                  )}
                >
                  {consultationOutcomeLabels[c.outcome]}
                </span>
              </div>

              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Field label="Requested by">{c.requestingFrom}</Field>
                <Field label="Reason">{c.reason}</Field>
                <div className="sm:col-span-2">
                  <Field label="Summary / recommendation">{c.summary}</Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Next action">
                    {c.nextAction ? (
                      <>
                        {c.nextAction}
                        <span className="block text-xs text-muted-foreground">
                          {c.nextActionOwner}
                          {c.nextActionDue &&
                            ` · due ${formatDate(c.nextActionDue)}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        None recorded
                      </span>
                    )}
                  </Field>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-5 border-t bg-muted/30 px-6 py-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Record a consultation</h3>
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

          <fieldset disabled={pending} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Consulting clinician"
                htmlFor="consultingClinicianId"
              >
                <select
                  id="consultingClinicianId"
                  name="consultingClinicianId"
                  required
                  defaultValue=""
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
                label="Requesting clinician or facility"
                htmlFor="requestingFrom"
              >
                <Input
                  id="requestingFrom"
                  name="requestingFrom"
                  required
                  className="h-10"
                />
              </FormField>
              <FormField label="Consultation date" htmlFor="date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  max={today}
                  className="h-10"
                />
              </FormField>
              <FormField label="Outcome" htmlFor="outcome">
                <select
                  id="outcome"
                  name="outcome"
                  required
                  defaultValue=""
                  className={controlClass}
                >
                  <option value="" disabled>
                    Select outcome
                  </option>
                  {consultationOutcomes.map((o) => (
                    <option key={o} value={o}>
                      {consultationOutcomeLabels[o]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Reason" htmlFor="reason">
              <textarea
                id="reason"
                name="reason"
                required
                className={cn(textareaClass, "min-h-20")}
              />
            </FormField>
            <FormField label="Summary / recommendation" htmlFor="summary">
              <textarea
                id="summary"
                name="summary"
                required
                className={textareaClass}
              />
            </FormField>

            <div className="space-y-4 rounded-lg border bg-card p-4">
              <FormField
                label="Next action"
                htmlFor="nextAction"
                hint="Optional. If you add one, choose an owner and a due date."
              >
                <textarea
                  id="nextAction"
                  name="nextAction"
                  onChange={(e) => setHasNext(e.target.value.trim().length > 0)}
                  className={cn(textareaClass, "min-h-20")}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Next action owner"
                  htmlFor="nextActionOwnerId"
                >
                  <select
                    id="nextActionOwnerId"
                    name="nextActionOwnerId"
                    required={hasNext}
                    defaultValue=""
                    className={controlClass}
                  >
                    <option value="">
                      {hasNext ? "Select owner" : "None"}
                    </option>
                    {staff.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Next action due date" htmlFor="nextActionDue">
                  <Input
                    id="nextActionDue"
                    name="nextActionDue"
                    type="date"
                    required={hasNext}
                    min={today}
                    className="h-10"
                  />
                </FormField>
              </div>
            </div>
          </fieldset>

          <FormError message={error} />

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Record consultation
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
