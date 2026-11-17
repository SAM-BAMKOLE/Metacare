"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Building2, Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormError, FormField } from "@/components/shared/form-field"
import { createOrganization } from "@/modules/organizations/create-organization"

export function CreateOrganizationCard() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createOrganization(name)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Set up your organisation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create your organisation to start recording screenings and tracking
          referrals. You will be its first administrator and can invite your
          team afterwards.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <FormField label="Organisation name" htmlFor="orgName">
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ibadan Community Clinic"
              required
              maxLength={120}
              className="h-10"
              autoFocus
            />
          </FormField>
          <FormError message={error} />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending || name.trim().length < 2}
          >
            {pending && <Loader2 className="animate-spin" />}
            Create organisation
          </Button>
        </form>

        <div className="mt-6 flex items-start justify-between gap-4 border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Joining an existing team? Ask your administrator to invite the email
            you signed up with, then check again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="shrink-0"
          >
            <RefreshCw />
            Check again
          </Button>
        </div>
      </div>
    </div>
  )
}
