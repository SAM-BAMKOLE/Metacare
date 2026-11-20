"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormError,
  FormField,
  controlClass,
  textareaClass,
} from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import { closeReferral } from "@/modules/referrals/detail-actions"
import {
  closingOutcomes,
  exceptionOutcomes,
  furtherActionOutcomes,
} from "@/modules/referrals/detail-data"
import { terminalStatuses, type ReferralStatus } from "@/modules/referrals/data"

export function ClosurePanel({
  referralId,
  status,
  acknowledged,
  canClose,
}: {
  referralId: string
  status: ReferralStatus
  acknowledged: boolean
  canClose: boolean
}) {
  const [outcome, setOutcome] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recorded, setRecorded] = useState<{
    outcome: string
    closes: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const isTerminal = terminalStatuses.includes(status)
  const needsFurtherAction = (
    furtherActionOutcomes as readonly string[]
  ).includes(outcome)
  const closing = (closingOutcomes as readonly string[]).filter(
    (o) => acknowledged || exceptionOutcomes.includes(o)
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await closeReferral(referralId, data, acknowledged)
      if (res.error) {
        setError(res.error)
        return
      }
      setRecorded({
        outcome: String(data.get("outcome")),
        closes: !needsFurtherAction,
      })
    })
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <h2 className="font-semibold">Closure</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        A referral is complete only when an outcome or exception is documented.
        Clinical review, confirmatory follow-up (if required), and patient
        communication must all be documented before a case can be closed.
      </p>

      {isTerminal ? (
        <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
          This referral is{" "}
          <span className="font-medium">{status.toLowerCase()}</span>. The
          outcome is recorded in the timeline.
        </p>
      ) : recorded ? (
        <div className="mt-4 flex gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{recorded.outcome}</p>
            <p className="text-xs">
              {recorded.closes
                ? "The case will be closed."
                : "The case stays open until the further action is done."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {!acknowledged && (
            <div className="flex gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <p>
                Not acknowledged yet, so only an exception outcome can be
                recorded.
              </p>
            </div>
          )}

          <fieldset disabled={!canClose || pending} className="space-y-4">
            <FormField label="Outcome" htmlFor="outcome">
              <select
                id="outcome"
                name="outcome"
                required
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className={controlClass}
              >
                <option value="" disabled>
                  Select outcome
                </option>
                <optgroup label="Closes the case">
                  {closing.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </optgroup>
                {acknowledged && (
                  <optgroup label="Needs a further action">
                    {furtherActionOutcomes.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </FormField>

            {outcome && (
              <p
                className={cn(
                  "text-xs",
                  needsFurtherAction
                    ? "text-amber-700"
                    : "text-muted-foreground"
                )}
              >
                {needsFurtherAction
                  ? "This outcome needs another action, so the case stays open."
                  : "This outcome closes the case."}
              </p>
            )}

            <FormField
              label="Reason"
              htmlFor="reason"
              hint="Required. Explain what happened."
            >
              <textarea
                id="reason"
                name="reason"
                required
                className={cn(textareaClass, "min-h-24")}
              />
            </FormField>
          </fieldset>

          <FormError message={error} />
          {!canClose && (
            <p className="text-sm text-muted-foreground">
              Only a clinician can record a closure outcome.
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!canClose || pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            {needsFurtherAction ? "Record outcome" : "Close case"}
          </Button>
        </form>
      )}
    </section>
  )
}