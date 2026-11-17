"use client"

import Link from "next/link"
import { useActionState, useMemo, useState } from "react"
import { Loader2, Search, X } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormError,
  FormField,
  controlClass,
  textareaClass,
} from "@/components/shared/form-field"
import { ageFromDob, initials } from "@/modules/patients/data"
import { createScreening, type ActionState } from "@/modules/screenings/actions"
import { resultCategories, screeningTypes } from "@/modules/screenings/data"

type PatientOption = {
  id: string
  name: string
  internalId: string
  dob: string
}

export function NewScreeningForm({
  patients,
  initialPatientId,
  today,
}: {
  patients: PatientOption[]
  initialPatientId?: string
  today: string
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createScreening,
    {
      error: null,
    }
  )
  const [selected, setSelected] = useState<PatientOption | null>(
    patients.find((p) => p.id === initialPatientId) ?? null
  )
  const [query, setQuery] = useState("")

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.internalId.toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [patients, query])

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border bg-card p-6 shadow-xs sm:p-8"
    >
      {/* Patient lookup */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Patient</span>
        <input type="hidden" name="patientId" value={selected?.id ?? ""} />

        {selected ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(selected.name)}
              </span>
              <div>
                <p className="text-sm font-medium">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{selected.internalId}</span> ·{" "}
                  {ageFromDob(selected.dob)} years
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or internal ID"
              className="h-10 pl-9"
              autoComplete="off"
            />
            {query.trim() && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                {matches.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted-foreground">
                    No matching patients.
                  </li>
                )}
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(p)
                        setQuery("")
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.internalId}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Screening type" htmlFor="type">
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className={controlClass}
          >
            <option value="" disabled>
              Select type
            </option>
            {screeningTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            max={today}
            required
            className="h-10"
          />
        </FormField>
      </div>

      <FormField label="Location" htmlFor="location">
        <Input
          id="location"
          name="location"
          required
          placeholder="e.g. Ibadan Community Clinic"
          className="h-10"
        />
      </FormField>

      <FormField
        label="Result category"
        htmlFor="resultCategory"
        hint="A category for tracking only. A clinician decides what happens next."
      >
        <select
          id="resultCategory"
          name="resultCategory"
          required
          defaultValue=""
          className={controlClass}
        >
          <option value="" disabled>
            Select category
          </option>
          {resultCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Result notes"
        htmlFor="notes"
        hint="Optional. Keep to what is needed for coordination."
      >
        <textarea id="notes" name="notes" className={textareaClass} />
      </FormField>

      <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <input
          type="checkbox"
          name="requiresReview"
          defaultChecked
          className="mt-0.5 size-4 rounded border-input accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm font-medium">
            Requires clinical review
          </span>
          <span className="block text-xs text-muted-foreground">
            Sends the result to a clinician, who documents whether follow-up is
            needed.
          </span>
        </span>
      </label>

      <FormError message={state.error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/screenings"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Cancel
        </Link>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Record screening
        </Button>
      </div>
    </form>
  )
}
