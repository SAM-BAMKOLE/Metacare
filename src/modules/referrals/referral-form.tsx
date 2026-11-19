"use client"

import { useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormError } from "@/components/shared/form-field"
import { createReferral, type CreateReferralResult } from "@/modules/referrals/actions"

interface ReferralFormProps {
  patients: {
    id: string
    name: string
    internalId: string
  }[]
  initialPatientId?: string
}

export function ReferralForm({
  patients,
  initialPatientId,
}: ReferralFormProps) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<CreateReferralResult, FormData>(
    async (_prev: CreateReferralResult, formData: FormData) => {
      return await createReferral(_prev, formData)
    },
    { error: null }
  )

  useEffect(() => {
    if (!state.error && state.referralId) {
      router.push(`/dashboard/referrals/${state.referralId}`)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <FormField
        label="Patient"
        hint="Select the patient being referred"
        className="max-w-md"
      >
        <select
          name="patientId"
          defaultValue={initialPatientId || ""}
          required
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Select a patient
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.internalId})
            </option>
          ))}
        </select>
        <FormError />
      </FormField>

      <FormField
        label="Receiving provider"
        hint="Name of the provider or facility receiving the referral"
        className="max-w-md"
      >
        <Input
          name="receivingProvider"
          type="text"
          required
          maxLength={200}
          className="h-10"
          placeholder="e.g. Cardiology Department"
        />
        <FormError />
      </FormField>

      <FormField
        label="Priority"
        hint="Clinical priority of the referral"
        className="max-w-md"
      >
        <select
          name="priority"
          defaultValue="routine"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
        </select>
      </FormField>

      <FormField
        label="Due date"
        hint="Optional due date for the referral"
        className="max-w-md"
      >
        <Input
          name="dueDate"
          type="date"
          className="h-10"
        />
      </FormField>

      <FormField
        label="Instructions"
        hint="Optional instructions for the receiving provider"
        className="max-w-md"
      >
        <textarea
          name="instructions"
          rows={3}
          maxLength={1000}
          className="h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create referral"}
      </Button>
    </form>
  )
}
