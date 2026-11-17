"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"

type SessionUser = { name?: string; email?: string }

function initialsOf(name?: string, email?: string) {
  const source = (name || email || "?").trim()
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function UserMenu({
  redirectIfSignedOut = false,
}: {
  redirectIfSignedOut?: boolean
}) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setUser(data?.user ?? null)
        setLoaded(true)
        if (redirectIfSignedOut && !data?.user) router.replace("/sign-in")
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [redirectIfSignedOut, router])

  async function signOut() {
    setSigningOut(true)
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      })
    } finally {
      router.push("/sign-in")
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/10 text-xs font-semibold text-sidebar-primary">
        {loaded ? initialsOf(user?.name, user?.email) : ""}
      </span>
      <div className="min-w-0 flex-1">
        {loaded ? (
          <>
            <p className="truncate text-sm font-medium">
              {user?.name || "Signed in"}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-1.5" aria-hidden>
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        disabled={signingOut}
        aria-label="Sign out"
        title="Sign out"
      >
        {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
      </Button>
    </div>
  )
}
