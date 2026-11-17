"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FlaskConical } from "lucide-react"

import { Logo } from "@/components/shared/logo"
import { UserMenu } from "@/components/layout/user-menu"
import { navSections, roleLabels } from "@/components/layout/nav"
import { cn } from "@/lib/utils"

export function SidebarContent({
  organizationName,
  role,
  onNavigate,
}: {
  organizationName: string
  role: string | null
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const sections = navSections(role)

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo href="/dashboard" />
      </div>

      {/* Organisation */}
      <div className="px-3">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-card px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/10 text-sidebar-primary">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{organizationName}</p>
            {role && (
              <p className="truncate text-xs text-muted-foreground">
                {roleLabels[role] ?? role}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4"
      >
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
            {section.items.map(({ label, href, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-primary/10 font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        <p className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <FlaskConical className="size-3.5" />
          Prototype · fictional data only
        </p>
        <UserMenu />
      </div>
    </div>
  )
}
