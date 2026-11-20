"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormError, controlClass, textareaClass } from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import { createEscalation } from "@/modules/referrals/actions"

export type Person = { id: string; name: string }

export function EscalationPanel({
  referralId,
  clinicians,
  canEscalate,
}: {
  referralId: string
  clinicians: Person[]
  canEscalate: boolean
}) {
  const [escalatedToId, setEscalatedToId] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <h2 className="font-semibold">Escalate referral</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Escalate this referral to a senior clinician for review.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {!canEscalate && (
        <p className="text-sm text-muted-foreground">
          Your role cannot escalate referrals.
        </p>
      )}

      {canEscalate && (
      <form onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(async () => {
          const res = await createEscalation(referralId, data)
          if (res.error) {
            setError(res.error)
            return
          }
          setReason("")
          setEscalatedToId("")
        })
      }} className="space-y-3">
        <FormField
          label="Escalate to"
          htmlFor="escalatedToId"
          hint="Select the senior clinician to escalate to"
          className="max-w-md"
        >
          <select
            id="escalatedToId"
            name="escalatedToId"
            required
            className={controlClass}
          >
            <option value="" disabled>
              Select clinician
            </option>
            {clinicians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FormError />
        </FormField>

        <FormField
          label="Reason"
          htmlFor="reason"
          hint="Why are you escalating this referral?"
          className="max-w-md"
        >
          <textarea
            id="reason"
            name="reason"
            required
            className={cn(textareaClass, "min-h-24")}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Escalate referral
        </Button>
      </form>
      )}
    </section>
  )
}
