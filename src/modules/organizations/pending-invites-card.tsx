"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Loader2, UserRoundPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { acceptInvite } from "@/modules/organizations/actions"

export function PendingInvitesCard({
  invites,
}: {
  invites: {
    id: string
    organizationName: string
    role: string
  }[]
}) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (prev: { error: string | null }, formData: FormData) => {
      const membershipId = formData.get("membershipId") as string
      const res = await acceptInvite(membershipId)
      if (res.error) {
        return { error: res.error }
      }
      router.push("/dashboard")
      return { error: null }
    },
    { error: null }
  )

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <UserRoundPlus className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Pending invitations
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You have been invited to join the following organisation(s). Accept an
          invitation to get started.
        </p>

        <div className="mt-6 space-y-3">
          {invites.map((invite) => (
            <form
              key={invite.id}
              action={formAction}
            >
              <input
                type="hidden"
                name="membershipId"
                value={invite.id}
              />
              <div className="flex items-center justify-between p-3 rounded-lg border border-muted bg-muted/50">
                <div>
                  <p className="text-sm font-medium">
                    {invite.organizationName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invite.role} · Pending
                  </p>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="animate-spin size-4" />}
                  {!isPending && "Accept"}
                </Button>
              </div>
            </form>
          ))}
        </div>

        {state.error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Not seeing the right invite? Ask your administrator to invite the
            email you signed up with.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
