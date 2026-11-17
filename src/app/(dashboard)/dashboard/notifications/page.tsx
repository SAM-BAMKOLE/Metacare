import { FlaskConical } from "lucide-react"

import { NotificationsList } from "@/modules/notifications/notifications-list"
import type { AppNotification } from "@/modules/notifications/data"
import { getCurrentMembership } from "@/server/permissions"
import { listNotifications } from "@/server/notifications"

export default async function NotificationsPage() {
  const membership = await getCurrentMembership()
  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          No organisation membership found for your account.
        </p>
      </div>
    )
  }

  const rows = await listNotifications(membership.userId ?? "")
  const items: AppNotification[] = rows.map((r) => ({
    id: r.id,
    type: r.type as AppNotification["type"],
    title: r.title,
    content: r.content,
    channel: "in_app",
    delivery: "delivered",
    simulated: r.simulated,
    read: r.read,
    referralId: r.referralId ?? "",
    at: r.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Updates that need your attention. Select one to open the referral.
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-slate-600" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">
              Simulated messages are not real.
            </span>{" "}
            Anything tagged{" "}
            <span className="font-medium text-foreground">Simulated SMS</span>{" "}
            is recorded by this prototype and never sent through an external
            provider. Only in-app notifications are delivered to staff.
          </p>
          <p>
            A failed notification never removes the case from your work queue.
          </p>
        </div>
      </div>

      <NotificationsList initial={items} />

      <p className="text-xs text-muted-foreground">
        Notification text never includes patient names or results. All
        notifications shown are fictional.
      </p>
    </div>
  )
}
