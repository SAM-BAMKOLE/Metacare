"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormError, FormField } from "@/components/shared/form-field"
import { updateOrganizationName } from "@/modules/organizations/actions"

export function OrganizationForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [saved, setSaved] = useState(initialName)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = name.trim() !== saved

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setJustSaved(false)
    startTransition(async () => {
      const res = await updateOrganizationName(name)
      if (res.error) {
        setError(res.error)
        return
      }
      setSaved(name.trim())
      setName(name.trim())
      setJustSaved(true)
    })
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <h2 className="font-semibold">Organisation details</h2>
      <p className="text-sm text-muted-foreground">
        The name shown to your team and to facilities you refer patients to.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <FormField
          label="Organisation name"
          htmlFor="orgName"
          className="max-w-md"
        >
          <Input
            id="orgName"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setJustSaved(false)
            }}
            required
            maxLength={120}
            className="h-10"
          />
        </FormField>

        <FormError message={error} />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!dirty || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
          {justSaved && !dirty && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
              <Check className="size-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
