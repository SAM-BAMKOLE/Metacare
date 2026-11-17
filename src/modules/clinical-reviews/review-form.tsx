"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  FormError,
  FormField,
  controlClass,
  textareaClass,
} from "@/components/shared/form-field"
import { cn } from "@/lib/utils"
import {
  createClinicalReview,
  type ReviewState,
} from "@/modules/clinical-reviews/actions"

export function ReviewForm({ screeningId }: { screeningId: string }) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    createClinicalReview,
    {
      error: null,
    }
  )
  const [followUp, setFollowUp] = useState<"yes" | "no" | null>(null)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="screeningId" value={screeningId} />

      <div className="flex gap-3 rounded-lg bg-primary/5 p-3.5 text-sm text-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Metacare records the decision; it does not make it.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Is follow-up required?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((v) => (
            <label
              key={v}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                followUp === v
                  ? "border-primary bg-primary/5 text-primary"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <input
                type="radio"
                name="followUp"
                value={v}
                required
                checked={followUp === v}
                onChange={() => setFollowUp(v)}
                className="sr-only"
              />
              {v === "yes" ? "Yes, follow-up required" : "No follow-up needed"}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Next-step recommendation" htmlFor="recommendation">
        <textarea
          id="recommendation"
          name="recommendation"
          required
          className={textareaClass}
          placeholder="Document the next step as determined by you."
        />
      </FormField>

      {followUp === "yes" && (
        <FormField label="Clinical priority" htmlFor="priority">
          <select
            id="priority"
            name="priority"
            required
            defaultValue=""
            className={controlClass}
          >
            <option value="" disabled>
              Select priority
            </option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
          </select>
        </FormField>
      )}

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
          Document decision
        </Button>
      </div>
    </form>
  )
}
