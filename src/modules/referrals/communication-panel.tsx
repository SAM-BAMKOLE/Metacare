"use client"

import { useState, useTransition } from "react"
import {
  Loader2,
  MessageSquareText,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormError,
  FormField,
  controlClass,
  textareaClass,
} from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/modules/patients/data"
import { recordPatientCommunication } from "@/modules/referrals/detail-actions"
import {
  channels,
  communicationOutcomes,
  notReachedOutcomes,
  type Channel,
  type CommOutcome,
  type Communication,
} from "@/modules/referrals/detail-data"

const channelIcons: Record<Channel, LucideIcon> = {
  "Phone call": Phone,
  "SMS (simulated)": MessageSquareText,
  "WhatsApp (simulated)": MessageSquareText,
  "In person": UserRound,
}

export function CommunicationPanel({
  referralId,
  initial = [],
  canRecord,
}: {
  referralId: string
  initial?: Communication[]
  canRecord: boolean
}) {
  const [log, setLog] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const res = await recordPatientCommunication(referralId, data)
      if (res.error) {
        setError(res.error)
        return
      }
      setLog((prev) => [
        {
          id: crypto.randomUUID(),
          channel: data.get("channel") as Channel,
          outcome: data.get("outcome") as CommOutcome,
          notes: String(data.get("notes") ?? "").trim(),
          by: "You",
          at: new Date().toISOString(),
        },
        ...prev,
      ])
      form.reset()
    })
  }

  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">Patient communication</h2>
        <p className="text-sm text-muted-foreground">
          Every contact attempt is recorded. Unsuccessful attempts stay visible.
        </p>
      </div>

      {log.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          No contact attempts recorded yet.
        </p>
      ) : (
        <ul className="divide-y">
          {log.map((c) => {
            const Icon = channelIcons[c.channel]
            const notReached = notReachedOutcomes.includes(c.outcome)
            return (
              <li key={c.id} className="flex gap-4 px-6 py-4">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    notReached
                      ? "bg-red-50 text-destructive"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">{c.channel}</p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        notReached
                          ? "bg-red-50 text-destructive ring-red-600/20"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      )}
                    >
                      {c.outcome}
                    </span>
                  </div>
                  {c.notes && <p className="mt-1 text-sm">{c.notes}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.by} · {formatDateTime(c.at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 border-t bg-muted/30 px-6 py-5"
      >
        <fieldset disabled={!canRecord || pending} className="space-y-4">
          <h3 className="text-sm font-semibold">Record patient contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Channel" htmlFor="channel">
              <select
                id="channel"
                name="channel"
                required
                defaultValue=""
                className={controlClass}
              >
                <option value="" disabled>
                  Select channel
                </option>
                {channels.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
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
                {communicationOutcomes.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField
            label="Notes"
            htmlFor="notes"
            hint="Optional. Record only what is needed for coordination."
          >
            <textarea
              id="notes"
              name="notes"
              className={cn(textareaClass, "min-h-20")}
            />
          </FormField>
        </fieldset>

        <FormError message={error} />
        {!canRecord && (
          <p className="text-sm text-muted-foreground">
            Your role cannot record patient contact.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!canRecord || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Record contact
          </Button>
        </div>
      </form>
    </section>
  )
}
