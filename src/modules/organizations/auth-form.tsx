"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Mode = "sign-in" | "sign-up"

const copy = {
  "sign-in": {
    title: "Welcome back",
    subtitle: "Sign in to your Metacare workspace.",
    action: "Sign in",
    endpoint: "/api/auth/sign-in/email",
    altText: "Don't have an account?",
    altLink: "Sign up",
    altHref: "/sign-up",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Get started with the Metacare demo.",
    action: "Create account",
    endpoint: "/api/auth/sign-up/email",
    altText: "Already have an account?",
    altLink: "Sign in",
    altHref: "/sign-in",
  },
} as const

function Field({
  label,
  id,
  ...props
}: { label: string; id: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input id={id} name={id} className="h-10" required {...props} />
    </div>
  )
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const c = copy[mode]
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    if (mode === "sign-up") {
      if (password !== form.get("confirmPassword")) {
        setError("Passwords do not match.")
        return
      }
    }

    const body =
      mode === "sign-up"
        ? { name: String(form.get("name") ?? ""), email, password }
        : { email, password }

    setLoading(true)
    try {
      const res = await fetch(c.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message ?? "Something went wrong. Please try again.")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(
        "Could not reach the server. Check your connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{c.title}</h1>
        <p className="text-sm text-muted-foreground">{c.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
        {mode === "sign-up" && (
          <Field
            label="Full name"
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Ngozi Eze"
          />
        )}
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@clinic.org"
        />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete={
            mode === "sign-up" ? "new-password" : "current-password"
          }
          minLength={8}
          placeholder="At least 8 characters"
        />
        {mode === "sign-up" && (
          <Field
            label="Confirm password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
          />
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Please wait…" : c.action}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {c.altText}{" "}
        <Link
          href={c.altHref}
          className="font-medium text-primary hover:underline"
        >
          {c.altLink}
        </Link>
      </p>
    </div>
  )
}
