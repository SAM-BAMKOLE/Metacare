"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { SidebarContent } from "@/components/layout/app-sidebar"

export function AppShell({
  organizationName,
  role,
  children,
}: {
  organizationName: string
  role: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer after navigating.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent organizationName={organizationName} role={role} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </Button>
        <Logo href="/dashboard" />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 z-10"
            >
              <X />
            </Button>
            <SidebarContent
              organizationName={organizationName}
              role={role}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <main>{children}</main>
      </div>
    </div>
  )
}
