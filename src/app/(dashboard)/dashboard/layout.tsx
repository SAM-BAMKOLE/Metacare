import { AppShell } from "@/components/layout/app-shell"
import { getShellContext } from "@/components/layout/get-shell-context"
import { UserMenu } from "@/components/layout/user-menu"
import { Logo } from "@/components/shared/logo"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getShellContext()

  // No organisation yet: a minimal shell without navigation. The dashboard
  // page shows the "create organisation" step.
  if (!ctx) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Logo href="/dashboard" />
            <div className="w-full max-w-xs">
              {/* Also sends signed-out visitors to /sign-in. */}
              <UserMenu redirectIfSignedOut />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    )
  }

  return (
    <AppShell organizationName={ctx.organizationName} role={ctx.role}>
      {children}
    </AppShell>
  )
}
