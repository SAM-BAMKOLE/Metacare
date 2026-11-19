"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormError } from "@/components/shared/form-field"
import { createPatient, type CreatePatientState } from "@/modules/patients/actions"

export default async function NewPatientPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All patients
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Register patient
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new patient record for your organisation.
        </p>
      </div>

      <PatientForm />
    </div>
  )
}

function PatientForm() {
  const [state, formAction, pending] = useActionState<CreatePatientState, FormData>(
    createPatient,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <FormError message={state.error} />
      )}

      <FormField
        label="Internal ID"
        htmlFor="internalId"
        hint="e.g. MC-00129"
        className="max-w-md"
      >
        <Input
          id="internalId"
          name="internalId"
          type="text"
          required
          maxLength={50}
          className="h-10"
        />
      </FormField>

      <FormField
        label="Full name"
        htmlFor="name"
        hint="Patient's full legal name"
        className="max-w-md"
      >
        <Input id="name" name="name" type="text" required maxLength={200} className="h-10" />
      </FormField>

      <FormField
        label="Date of birth"
        htmlFor="dateOfBirth"
        hint="Optional"
        className="max-w-md"
      >
        <Input id="dateOfBirth" name="dateOfBirth" type="date" className="h-10" />
      </FormField>

      <FormField
        label="Contact details"
        htmlFor="contactDetails"
        hint="Phone number, email, or address"
        className="max-w-md"
      >
        <Input
          id="contactDetails"
          name="contactDetails"
          type="text"
          maxLength={500}
          className="h-10"
        />
      </FormField>

      <FormField
        label="Administrative notes"
        htmlFor="administrativeNotes"
        hint="Optional internal notes"
        className="max-w-md"
      >
        <Input
          id="administrativeNotes"
          name="administrativeNotes"
          type="text"
          maxLength={1000}
          className="h-10"
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Register patient"}
      </Button>
    </form>
  )
}
