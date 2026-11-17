"use client"

import { useState, useTransition } from "react"
import {
  Ban,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormError,
  FormField,
  textareaClass,
} from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/modules/patients/data"
import { acknowledgeReferral } from "@/modules/referrals/detail-actions"
import type { AckState } from "@/modules/referrals/detail-data"

const states: Record<
  AckState["state"],
  { label: string; cls: string; icon: LucideIcon }
> = {
  not_sent: {
    label: "Not sent yet",
    cls: "bg-secondary text-secondary-foreground ring-border",
    icon: Clock,
  },
  pending: {
    label: "Awaiting acknowledgement",
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: Clock,
  },
  acknowledged: {
    label: "Acknowledged",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    cls: "bg-secondary text-secondary-foreground ring-border",
    icon: Ban,
  },
  info_requested: {
    label: "Information requested",
    cls: "bg-sky-50 text-sky-700 ring-sky-600/20",
    icon: Info,
  },
}

const decisions = [
  {
    value: "acknowledge",
    label: "Acknowledge receipt",
    hint: "Confirm the referral has reached your facility.",
    needsReason: false,
  },
  {
    value: "request_info",
    label: "Request more information",
    hint: "Tell the referring team what is missing.",
    needsReason: true,
  },
  {
    value: "decline",
    label: "Decline referral",
    hint: "Record why it cannot be accepted.",
    needsReason: true,
  },
] as const

type Decision = (typeof decisions)[number]["value"]

const resultingState: Record<Decision, AckState["state"]> = {
  acknowledge: "acknowledged",
  request_info: "info_requested",
  decline: "declined",
}

export function AcknowledgementPanel({
  referralId,
  initial = { state: "not_sent" as const },
  destination,
  canRespond,
}: {
  referralId: string
  initial?: AckState
  destination: string
  canRespond: boolean
}) {
  const [ack, setAck] = useState(initial)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const meta = states[ack.state]
  const Icon = meta.icon
  const needsReason =
    decisions.find((d) => d.value === decision)?.needsReason ?? false
  const canShowForm = ack.state === "pending" || ack.state === "info_requested"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await acknowledgeReferral(referralId, data)
      if (res.error) {
        setError(res.error)
        return
      }
      const chosen = data.get("decision") as Decision
      setAck({
        state: resultingState[chosen],
        by: "You",
        at: new Date().toISOString(),
        reason: String(data.get("reason") ?? "").trim() || undefined,
      })
      setDecision(null)
    })
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <h2 className="font-semibold">Provider acknowledgement</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{destination}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
            meta.cls
          )}
        >
          <Icon className="size-3.5" />
          {meta.label}
        </span>
        {ack.at && (
          <span className="text-xs text-muted-foreground">
            {ack.by} · {formatDateTime(ack.at)}
          </span>
        )}
      </div>
      {ack.reason && (
        <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">{ack.reason}</p>
      )}

      {ack.state === "not_sent" && (
        <p className="mt-4 text-sm text-muted-foreground">
          The referral has not been sent. The receiving facility can respond
          once it is.
        </p>
      )}

      {canShowForm && (
        <form onSubmit={onSubmit} className="mt-5 space-y-4 border-t pt-5">
          <fieldset disabled={!canRespond || pending} className="space-y-4">
            <legend className="sr-only">Respond to this referral</legend>
            <div className="space-y-2">
              {decisions.map((d) => (
                <label
                  key={d.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    decision === d.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                    !canRespond && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={d.value}
                    required
                    checked={decision === d.value}
                    onChange={() => setDecision(d.value)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium">{d.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <FormField
              label={needsReason ? "Reason (required)" : "Note (optional)"}
              htmlFor="reason"
            >
              <textarea
                id="reason"
                name="reason"
                required={needsReason}
                className={cn(textareaClass, "min-h-20")}
              />
            </FormField>
          </fieldset>

          <FormError message={error} />
          {!canRespond && (
            <p className="text-sm text-muted-foreground">
              Only staff at the receiving facility can respond to a referral.
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!canRespond || pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            Submit response
          </Button>
        </form>
      )}
    </section>
  )
}
