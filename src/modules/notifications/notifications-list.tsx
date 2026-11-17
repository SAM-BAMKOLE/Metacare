"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FlaskConical,
  MailCheck,
  MailOpen,
  MessageSquareText,
  RefreshCw,
  Send,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/modules/patients/data"
import {
  markAllNotificationsRead,
  retryNotification,
  setNotificationRead,
} from "@/modules/notifications/actions"
import type {
  AppNotification,
  Delivery,
  NotificationType,
} from "@/modules/notifications/data"

const typeMeta: Record<
  NotificationType,
  { label: string; icon: LucideIcon; tone: "default" | "danger" | "warning" }
> = {
  assigned: { label: "Assignment", icon: UserCheck, tone: "default" },
  awaiting_ack: {
    label: "Awaiting acknowledgement",
    icon: Send,
    tone: "warning",
  },
  due_soon: { label: "Approaching due date", icon: Clock, tone: "warning" },
  overdue: { label: "Overdue", icon: AlertTriangle, tone: "danger" },
  patient_response: {
    label: "Patient response",
    icon: MessageSquareText,
    tone: "default",
  },
  provider_update: {
    label: "Provider update",
    icon: MailCheck,
    tone: "default",
  },
  escalated: { label: "Escalation", icon: AlertTriangle, tone: "danger" },
}

const toneCls = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-destructive",
}

const deliveryMeta: Record<
  Delivery,
  { label: string; cls: string; icon: LucideIcon }
> = {
  delivered: {
    label: "Delivered",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    cls: "bg-red-50 text-destructive ring-red-600/20",
    icon: X,
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: Clock,
  },
}

type Filter = "all" | "unread" | "failed"

export function NotificationsList({ initial }: { initial: AppNotification[] }) {
  const [items, setItems] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [, startTransition] = useTransition()

  const unread = items.filter((n) => !n.read).length
  const failed = items.filter((n) => n.delivery === "failed").length

  const visible = items.filter((n) => {
    if (filter === "unread") return !n.read
    if (filter === "failed") return n.delivery === "failed"
    return true
  })

  function setRead(id: string, read: boolean) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
    startTransition(() => {
      void setNotificationRead(id, read)
    })
  }

  function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    startTransition(() => {
      void markAllNotificationsRead()
    })
  }

  function retry(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, delivery: "pending" } : n))
    )
    startTransition(() => {
      void retryNotification(id)
    })
  }

  const chips: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: unread },
    { key: "failed", label: "Failed delivery", count: failed },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={filter === c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === c.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
              {c.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    filter === c.key
                      ? "bg-white/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {c.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAll}
          disabled={unread === 0}
        >
          <CheckCheck />
          Mark all as read
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Bell className="size-5 text-muted-foreground" />
            </span>
            <p className="font-medium">Nothing here</p>
            <p className="text-sm text-muted-foreground">
              You are all caught up.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {visible.map((n) => {
              const meta = typeMeta[n.type]
              const Icon = meta.icon
              const d = deliveryMeta[n.delivery]
              const DIcon = d.icon
              return (
                <li
                  key={n.id}
                  className={cn(
                    "group relative flex gap-4 px-5 py-4 transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary/[0.03]"
                  )}
                >
                  <Link
                    href={`/dashboard/referrals/${n.referralId}`}
                    onClick={() => !n.read && setRead(n.id, true)}
                    className="absolute inset-0"
                  >
                    <span className="sr-only">
                      Open referral for: {n.title}
                    </span>
                  </Link>

                  <span
                    className={cn(
                      "pointer-events-none relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                      toneCls[meta.tone]
                    )}
                  >
                    <Icon className="size-4" />
                    {!n.read && (
                      <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
                    )}
                  </span>

                  <div className="pointer-events-none relative min-w-0 flex-1 space-y-1.5">
                    <p
                      className={cn(
                        "text-sm group-hover:text-primary",
                        n.read ? "font-medium" : "font-semibold"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{n.content}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                          d.cls
                        )}
                      >
                        <DIcon className="size-3" />
                        {d.label}
                      </span>
                      {n.simulated ? (
                        <span
                          title="Recorded by the prototype. Never sent through an external provider."
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-400 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        >
                          <FlaskConical className="size-3" />
                          Simulated SMS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <Bell className="size-3" />
                          In-app
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {meta.label} · {formatDateTime(n.at)}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
                    {n.delivery === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retry(n.id)}
                      >
                        <RefreshCw />
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRead(n.id, !n.read)}
                      aria-label={n.read ? "Mark as unread" : "Mark as read"}
                      title={n.read ? "Mark as unread" : "Mark as read"}
                    >
                      {n.read ? <MailOpen /> : <MailCheck />}
                      <span className="hidden sm:inline">
                        {n.read ? "Mark unread" : "Mark read"}
                      </span>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
